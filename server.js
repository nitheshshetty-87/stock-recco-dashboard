import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataFile = join(__dirname, 'data', 'holdings.json')

const app = express()
app.use(cors())
app.use(express.json())

// ─── Holdings ────────────────────────────────────────────────────────────────

app.get('/api/holdings', (req, res) => {
  try {
    const data = readFileSync(dataFile, 'utf-8')
    res.json(JSON.parse(data))
  } catch {
    res.status(500).json({ error: 'Could not read holdings data' })
  }
})

app.post('/api/holdings', (req, res) => {
  try {
    writeFileSync(dataFile, JSON.stringify(req.body, null, 2))
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Could not write holdings data' })
  }
})

// ─── Instruments cache ────────────────────────────────────────────────────────

let instrumentsCache = []
let cacheDate = null

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    // handle quoted fields
    const cols = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur); cur = '' }
      else cur += ch
    }
    cols.push(cur)
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (cols[i] ?? '').trim()]))
  })
}

async function loadInstruments() {
  const today = new Date().toDateString()
  if (cacheDate === today && instrumentsCache.length > 0) return

  console.log('Fetching instruments from Kite...')
  const [nseRes, bseRes] = await Promise.all([
    fetch('https://api.kite.trade/instruments/NSE'),
    fetch('https://api.kite.trade/instruments/BSE'),
  ])
  const [nseText, bseText] = await Promise.all([nseRes.text(), bseRes.text()])

  const nse = parseCSV(nseText).filter(r => r.instrument_type === 'EQ' && r.segment === 'NSE')
  const bse = parseCSV(bseText).filter(r => r.instrument_type === 'EQ' && r.segment === 'BSE')

  instrumentsCache = [...nse, ...bse].map(r => ({
    token: r.instrument_token,
    symbol: r.tradingsymbol,
    name: r.name,
    exchange: r.exchange,
    last_price: parseFloat(r.last_price) || 0,
  }))

  cacheDate = today
  console.log(`Loaded ${instrumentsCache.length} instruments (NSE: ${nse.length}, BSE: ${bse.length})`)
}

// Search & paginate instruments
app.get('/api/instruments', async (req, res) => {
  try {
    await loadInstruments()
    const { q = '', exchange = 'ALL', page = '0', limit = '50' } = req.query
    const qLower = q.toLowerCase()
    const pageNum = parseInt(page)
    const limitNum = Math.min(parseInt(limit), 200)

    let results = instrumentsCache
    if (exchange !== 'ALL') results = results.filter(i => i.exchange === exchange)
    if (q) results = results.filter(i =>
      i.symbol.toLowerCase().includes(qLower) ||
      i.name.toLowerCase().includes(qLower)
    )

    const total = results.length
    const paginated = results.slice(pageNum * limitNum, (pageNum + 1) * limitNum)

    res.json({ total, page: pageNum, limit: limitNum, results: paginated })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Live quotes for a list of instruments (exchange:symbol, comma-separated)
app.get('/api/quotes', async (req, res) => {
  const { instruments } = req.query // e.g. "NSE:RELIANCE,BSE:TCS"
  if (!instruments) return res.status(400).json({ error: 'instruments param required' })

  try {
    const ids = instruments.split(',').slice(0, 500) // Kite max 500
    const url = `https://api.kite.trade/quote/ltp?${ids.map(i => `i=${encodeURIComponent(i)}`).join('&')}`
    // Note: live quotes require auth token — return empty for now, page shows last_price from CSV
    res.json({ data: {}, note: 'Connect Kite auth for live quotes' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Refresh instruments cache on demand
app.post('/api/instruments/refresh', async (req, res) => {
  cacheDate = null
  await loadInstruments()
  res.json({ ok: true, count: instrumentsCache.length })
})

// ─── Boot ─────────────────────────────────────────────────────────────────────

const PORT = 3001
app.listen(PORT, async () => {
  console.log(`Stock Recco API running on http://localhost:${PORT}`)
  // Pre-load instruments in background
  loadInstruments().catch(console.error)
})
