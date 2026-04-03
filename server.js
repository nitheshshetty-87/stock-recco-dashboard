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

// Serve holdings from local data file (refreshed by Claude via Kite MCP)
app.get('/api/holdings', (req, res) => {
  try {
    const data = readFileSync(dataFile, 'utf-8')
    res.json(JSON.parse(data))
  } catch {
    res.status(500).json({ error: 'Could not read holdings data' })
  }
})

// Update holdings (called programmatically to refresh data)
app.post('/api/holdings', (req, res) => {
  try {
    writeFileSync(dataFile, JSON.stringify(req.body, null, 2))
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Could not write holdings data' })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Stock Recco API running on http://localhost:${PORT}`)
})
