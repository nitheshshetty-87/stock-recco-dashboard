import express from 'express'
import cors from 'cors'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())

// ─── Firebase Admin (Firestore) ───────────────────────────────────────────────

function initFirebase() {
  if (getApps().length > 0) return getFirestore()

  // In production (Railway): use GOOGLE_APPLICATION_CREDENTIALS env var
  // In development: use local service account file if present
  const serviceAccountPath = join(__dirname, 'firebase-service-account.json')

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Railway: pass JSON as env var
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    initializeApp({ credential: cert(serviceAccount) })
  } else if (existsSync(serviceAccountPath)) {
    const require = createRequire(import.meta.url)
    const serviceAccount = require('./firebase-service-account.json')
    initializeApp({ credential: cert(serviceAccount) })
  } else {
    // Fallback: use application default credentials
    initializeApp()
  }

  return getFirestore()
}

const db = initFirebase()

// ─── Holdings ─────────────────────────────────────────────────────────────────

app.get('/api/holdings', async (req, res) => {
  try {
    const doc = await db.collection('portfolio').doc('holdings').get()
    if (!doc.exists) return res.json([])
    res.json(doc.data().items || [])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/holdings', async (req, res) => {
  try {
    await db.collection('portfolio').doc('holdings').set({
      items: req.body,
      updatedAt: new Date().toISOString(),
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Instruments cache ────────────────────────────────────────────────────────

let instrumentsCache = []
let cacheDate = null

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
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

app.post('/api/instruments/refresh', async (req, res) => {
  cacheDate = null
  await loadInstruments()
  res.json({ ok: true, count: instrumentsCache.length })
})

// ─── Live prices via Yahoo Finance ───────────────────────────────────────────

app.get('/api/prices', async (req, res) => {
  try {
    const symbols = (req.query.symbols || '').split(',').filter(Boolean)
    if (!symbols.length) return res.json({})

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    }

    const entries = await Promise.all(symbols.map(async s => {
      const [sym, ex] = s.split(':')
      const yfSym = ex === 'BSE' ? `${sym}.BO` : `${sym}.NS`
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yfSym}?interval=1d&range=1d`,
          { headers }
        )
        if (!r.ok) return [s, null]
        const json = await r.json()
        const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice
        return [s, price ?? null]
      } catch {
        return [s, null]
      }
    }))

    res.json(Object.fromEntries(entries.filter(([, p]) => p != null)))
  } catch {
    res.json({})
  }
})

// ─── Serve built frontend in production ───────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, 'dist')
  const { default: sirv } = await import('sirv')
  app.use(sirv(distPath, { single: true }))
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Stock Recco API running on http://localhost:${PORT}`)
  loadInstruments().catch(console.error)
})
