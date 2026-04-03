import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const sa = require('../firebase-service-account.json')
const { initializeApp, cert } = await import('firebase-admin/app')
const { getFirestore } = await import('firebase-admin/firestore')

initializeApp({ credential: cert(sa) })
const db = getFirestore()

const holdings = JSON.parse(readFileSync(join(__dirname, '../data/holdings.json'), 'utf-8'))
await db.collection('portfolio').doc('holdings').set({
  items: holdings,
  updatedAt: new Date().toISOString(),
})
console.log(`✓ Pushed ${holdings.length} holdings to Firestore`)
process.exit(0)
