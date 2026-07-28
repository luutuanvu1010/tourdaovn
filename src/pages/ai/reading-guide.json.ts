import type { APIRoute } from 'astro'
import { GEO_SCHEMA_VERSION, jsonResponse, SITE_URL } from '../../lib/geoKnowledge'

export const prerender = true

export const GET: APIRoute = async () => {
  const generatedAt = new Date().toISOString()
  return jsonResponse({
    schemaVersion: GEO_SCHEMA_VERSION,
    generatedAt,
    site: SITE_URL,
    files: {
      index: '/ai/index.json',
      entities: '/ai/entities.json',
      graph: '/ai/graph.json',
    },
    intents: [
      {
        id: 'where_to_go',
        label: 'Di dau',
        readFirst: ['/ai/index.json', '/ai/entities.json', '/ai/graph.json'],
        priorityEntityTypes: ['place', 'attraction', 'experience'],
        preferredPaths: ['/', '/kham-pha/', '/dia-danh/', '/diem-tham-quan/', '/trai-nghiem/'],
        cautions: ['Use only entity URLs and relations present in the AI files.'],
      },
      {
        id: 'where_to_stay',
        label: 'O dau',
        readFirst: ['/ai/index.json', '/ai/entities.json', '/ai/graph.json'],
        priorityEntityTypes: ['hotel', 'resort', 'place'],
        preferredPaths: ['/luu-tru/', '/khach-san/', '/resort/'],
        cautions: ['For lodging price claims, require hasPriceData or a public booking/free flag.'],
      },
      {
        id: 'what_to_eat',
        label: 'An gi',
        readFirst: ['/ai/entities.json', '/ai/graph.json'],
        priorityEntityTypes: ['article'],
        preferredPaths: ['/cam-nang/'],
        cautions: ['Food coverage lives in guide articles; this site has no restaurant or dish entities.'],
      },
      {
        id: 'which_tour',
        label: 'Tour nao',
        readFirst: ['/ai/entities.json', '/ai/graph.json'],
        priorityEntityTypes: ['tour', 'organization', 'place', 'attraction'],
        preferredPaths: ['/tour/'],
        cautions: ['Do not invent itinerary stops, operators, prices, or booking availability.'],
      },
      {
        id: 'event_or_season',
        label: 'Su kien va mua',
        readFirst: ['/ai/entities.json', '/ai/graph.json'],
        priorityEntityTypes: ['event', 'article', 'place', 'attraction'],
        preferredPaths: ['/su-kien/', '/cam-nang/'],
        cautions: ['Check updatedAt, startDate, endDate, and event status before answering.'],
      },
      {
        id: 'trust_check',
        label: 'Kiem do tin cay',
        readFirst: ['/ai/index.json', '/ai/entities.json'],
        priorityEntityTypes: ['person', 'organization', 'article'],
        preferredPaths: ['/tac-gia/', '/cong-ty/', '/cam-nang/'],
        cautions: ['Prefer entities with officialSource, sameAs, author, approvedBy, and contentProvenance.'],
      },
    ],
  })
}
