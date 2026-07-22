import { createClient } from '@sanity/client'
import { writeFileSync } from 'fs'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2026-06-01',
  token: process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false, perspective: 'raw',
})
const docs = await client.fetch('*[!(_id in path("_.**"))]')
const date = new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')
const path = `../backups/backup-${date}.ndjson`
writeFileSync(path, docs.map(d => JSON.stringify(d)).join('\n'))
console.log(`Backup ${docs.length} document → ${path}`)
