import { createClient, type SanityClient } from '@sanity/client'
import { SANITY_DATASET, SANITY_PROJECT_ID, SANITY_READ_TOKEN } from '../synthesis/config'

let client: SanityClient | null = null
let clientKey = ''

export function getClient(): SanityClient {
  const key = `${SANITY_PROJECT_ID}:${SANITY_DATASET}:${SANITY_READ_TOKEN ? 'token' : 'anon'}`
  if (client && clientKey === key) return client

  if (!SANITY_PROJECT_ID) throw new Error('SANITY_STUDIO_PROJECT_ID is required')

  client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2026-06-01',
    token: SANITY_READ_TOKEN || undefined,
    useCdn: false,
    perspective: 'published'
  })
  clientKey = key

  return client
}

const ALL_TYPES = [
  'touristDestination', 'place', 'attraction', 'experience',
  'restaurant', 'specialty', 'hotel', 'resort', 'tour',
  'organization', 'event', 'article', 'person', 'category'
]

/**
 * Fetch tất cả document trong published namespace từ Sanity.
 * Dùng `...` để lấy toàn bộ field gốc (gồm reference dạng {_ref, _type}).
 *
 * CHỦ Ý trả ĐỦ corpus, KHÔNG lọc reviewStatus ở đây (ADR-0008 Phương án bị loại:
 * lọc approved-only ở mức toàn cục làm I18/I17 mất tầm nhìn vào reference từ document
 * chưa approved, gài regression). Phạm vi "đã publish = approved" áp ở tầng dispatch
 * (validate-constraints.ts) cho riêng nhóm cổng completeness — xem ADR-0008 Quyết định 4.
 */
export async function fetchAllDocs(): Promise<any[]> {
  const c = getClient()
  const query = `*[_type in $types]`
  return c.fetch(query, { types: ALL_TYPES }) as Promise<any[]>
}
