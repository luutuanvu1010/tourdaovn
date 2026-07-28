import type { APIRoute } from 'astro'
import { buildGeoDataset, GEO_SCHEMA_VERSION, jsonResponse, routeSummary, SITE_URL } from '../../lib/geoKnowledge'
import { brand } from '../../site.config'

export const prerender = true

const entityTypeUses: Record<string, string> = {
  touristDestination: 'Destination entity pages, separate from the site homepage.',
  place: 'Geographic areas, beaches, islands, wards, and local areas.',
  attraction: 'Visitor attractions and managed venues.',
  experience: 'Things to do, tied to real venues or places.',
  restaurant: 'Food venues and where to try local specialties.',
  specialty: 'Local dishes and products with regional identity.',
  hotel: 'Urban lodging.',
  resort: 'Resort lodging and island or beach stays.',
  tour: 'Bookable or guided itineraries.',
  event: 'Seasonal events and festivals.',
  article: 'Guides, itineraries, transport explainers, and editorial context.',
  person: 'Authors and trust signals.',
  organization: 'Operators, organizers, and verified companies.',
}

export const GET: APIRoute = async () => {
  const dataset = await buildGeoDataset()
  return jsonResponse({
    schemaVersion: GEO_SCHEMA_VERSION,
    generatedAt: dataset.generatedAt,
    site: {
      name: brand.name,
      baseUrl: SITE_URL,
      languages: ['vi', 'en', 'zh', 'ko', 'ru'],
      canonicalLanguage: 'vi',
    },
    files: {
      entities: `${SITE_URL}/ai/entities.json`,
      graph: `${SITE_URL}/ai/graph.json`,
      readingGuide: `${SITE_URL}/ai/reading-guide.json`,
      llms: `${SITE_URL}/llms.txt`,
      sitemap: `${SITE_URL}/sitemap.xml`,
    },
    entityTypes: routeSummary().map((item) => ({
      ...item,
      use: entityTypeUses[item.type] ?? 'Public entity type.',
    })),
    stats: dataset.stats,
  })
}
