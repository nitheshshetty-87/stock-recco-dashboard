import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const sa = require('../firebase-service-account.json')
const { initializeApp, cert } = await import('firebase-admin/app')
const { default: admin } = await import('firebase-admin')

initializeApp({ credential: cert(sa) })

// Get an access token using the service account
const token = await admin.app().options.credential.getAccessToken()
const accessToken = token.access_token

const projectId = 'stock-recco-dashboard'
const newDomain = 'stock-recco-dashboard-production.up.railway.app'

// Get current config
const getRes = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
)
const config = await getRes.json()

if (!getRes.ok) {
  console.error('Failed to get config:', JSON.stringify(config, null, 2))
  process.exit(1)
}

const currentDomains = config.authorizedDomains || []
console.log('Current authorized domains:', currentDomains)

if (currentDomains.includes(newDomain)) {
  console.log(`✓ ${newDomain} already authorized`)
  process.exit(0)
}

const updatedDomains = [...currentDomains, newDomain]

// Patch config
const patchRes = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=authorizedDomains`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authorizedDomains: updatedDomains }),
  }
)
const patchData = await patchRes.json()

if (!patchRes.ok) {
  console.error('Failed to update config:', JSON.stringify(patchData, null, 2))
  process.exit(1)
}

console.log(`✓ Added ${newDomain} to Firebase authorized domains`)
console.log('Updated domains:', patchData.authorizedDomains)
process.exit(0)
