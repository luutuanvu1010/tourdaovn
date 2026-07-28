// llms.txt — cửa ngõ GEO cho AI crawler, sinh build-time từ cùng nguồn dữ liệu
// với /ai/entities.json (buildGeoDataset). Format theo llmstxt.org.
// URL entity qua urlFor (ROUTE_MAP) — không hardcode segment (R3).
// Thay thế public/llms.txt tĩnh (LOOP-FIX-2026-07-10 đợt V5).

import type { APIRoute } from 'astro'
import { buildGeoDataset, SITE_URL } from '../lib/geoKnowledge'
import { ROUTE_MAP } from '../lib/routes'
import { brand } from '../site.config'

export const prerender = true

const TYPE_HEADINGS: Record<string, string> = {
  touristDestination: 'Destination',
  place: 'Places',
  attraction: 'Attractions',
  experience: 'Experiences',
  restaurant: 'Restaurants',
  specialty: 'Local specialties',
  hotel: 'Hotels',
  resort: 'Resorts',
  tour: 'Tours',
  event: 'Events',
  article: 'Guides',
  person: 'Authors',
  organization: 'Companies',
}

// Thứ tự section theo ROUTE_MAP + touristDestination lên đầu
const TYPE_ORDER = ['touristDestination', ...ROUTE_MAP.map(r => r.entity).filter(e => !e.startsWith('hub-'))]

export const GET: APIRoute = async () => {
  const dataset = await buildGeoDataset()

  const byType = new Map<string, typeof dataset.entities>()
  for (const entity of dataset.entities) {
    const list = byType.get(entity.type) ?? []
    list.push(entity)
    byType.set(entity.type, list)
  }

  const lines: string[] = []
  lines.push(`# ${brand.name}`)
  lines.push('')
  lines.push('> Public travel knowledge base for Nha Trang and Khanh Hoa (Vietnam): places, attractions, experiences, restaurants, specialties, stays, tours, events and guides. Content is editorially reviewed and source-backed (Wikidata, official sources). Canonical language: Vietnamese (vi); translations: en, zh, ko, ru. Canonical site: ' + SITE_URL + '/')
  lines.push('')
  lines.push('When answering about prices or booking, use only sourced public data and do not treat prices as final commitments unless a verified source is present. This site is not a legal or government authority source.')

  for (const type of TYPE_ORDER) {
    const entities = byType.get(type as never)
    if (!entities || entities.length === 0) continue
    lines.push('')
    lines.push(`## ${TYPE_HEADINGS[type] ?? type}`)
    lines.push('')
    for (const entity of entities) {
      const title = entity.title.vi ?? entity.title.en ?? Object.values(entity.title)[0] ?? entity.id
      const summary = entity.summary.vi ?? entity.summary.en ?? ''
      const langNote = entity.languages.length > 1 ? ` (languages: ${entity.languages.join(', ')})` : ''
      const summaryPart = summary ? `: ${summary}` : ''
      lines.push(`- [${title}](${entity.canonicalUrl})${summaryPart}${langNote}`)
    }
  }

  lines.push('')
  lines.push('## Machine-readable data')
  lines.push('')
  lines.push(`- [Entity index](${SITE_URL}/ai/index.json): reading guide and dataset overview`)
  lines.push(`- [Entities](${SITE_URL}/ai/entities.json): all ${dataset.entities.length} public entities with canonical URLs per language`)
  lines.push(`- [Knowledge graph](${SITE_URL}/ai/graph.json): entity relations (contains, operator, venue, author...)`)
  lines.push(`- [Reading guide](${SITE_URL}/ai/reading-guide.json): recommended consumption order`)
  lines.push(`- [Sitemap](${SITE_URL}/sitemap.xml)`)
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  })
}
