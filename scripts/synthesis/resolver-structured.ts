// Luồng A theo Revision 2026-06-20 (chiều): định danh cấu trúc (geo, sameAs, ảnh ứng viên)
// lấy deterministic từ Wikidata/Wikipedia REST, KHÔNG LLM, không key. Chạy trước luồng B (prose).
import { FETCH_TIMEOUT_MS } from './config'
import { parseCoord } from '../../src/lib/geo'

export interface StructuredSource {
  name: string
  // N3b: `name` = tên venue, để harvester geocode theo tên khi trang không có geo lẫn address.
  // Optional — nguồn Wikidata/Wikipedia bỏ qua, giữ nguyên nghĩa cũ.
  resolve(input: { wikipediaUrl?: string; wikidataId?: string; html?: string; url?: string; name?: string }): Promise<StructuredResult>
}

export interface StructuredResult {
  geo?: { lat: number; lng: number }
  sameAs: string[] // [Wikidata URL, Wikipedia URL] đã de-dup
  imageCandidate?: { commonsUrl: string; license?: string; alt?: string } // P2 chỉ log, KHÔNG upload
  wikidataId?: string
  label?: string
  // N3 (mở rộng, R1): on-page harvester cho venue điền thêm address/officialSource từ HTML.
  // Optional — nguồn Wikidata/Wikipedia không set, giữ nguyên nghĩa cũ.
  address?: { street?: string; ward?: string } // §2.4/§2.0b: ward = phường hiện hành (I15)
  officialSource?: string // url trang chính thức của venue
  warnings: string[]
}

async function fetchJsonWithRetry(url: string, warnings: string[]): Promise<any | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) {
        warnings.push(`HTTP ${res.status} từ ${url}`)
        continue
      }
      return await res.json()
    } catch (err: any) {
      clearTimeout(timer)
      const reason = err.name === 'AbortError' ? `timeout sau ${FETCH_TIMEOUT_MS}ms` : err.message
      warnings.push(`Lỗi gọi ${url}: ${reason}`)
    }
  }
  return null
}

function parseWikipediaUrl(wikipediaUrl: string): { lang: string; title: string } | null {
  try {
    const u = new URL(wikipediaUrl)
    const langMatch = u.hostname.match(/^([a-z-]+)\.wikipedia\.org$/i)
    if (!langMatch) return null
    const wikiIdx = u.pathname.indexOf('/wiki/')
    if (wikiIdx === -1) return null
    const title = u.pathname.slice(wikiIdx + '/wiki/'.length)
    if (!title) return null
    return { lang: langMatch[1], title }
  } catch {
    return null
  }
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export async function resolveStructured(input: {
  wikipediaUrl?: string
  wikidataId?: string
}): Promise<StructuredResult> {
  const warnings: string[] = []
  const sameAsSet = new Set<string>()
  let wikidataId = input.wikidataId?.trim() || undefined
  let label: string | undefined
  let restGeo: { lat: number; lng: number } | undefined
  let geo: { lat: number; lng: number } | undefined
  let imageCandidate: StructuredResult['imageCandidate']

  if (input.wikipediaUrl) {
    const parsed = parseWikipediaUrl(input.wikipediaUrl)
    if (!parsed) {
      warnings.push(`Không tách được lang/title từ wikipediaUrl: ${input.wikipediaUrl}`)
      sameAsSet.add(input.wikipediaUrl)
    } else {
      const { lang, title } = parsed
      const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`
      const summary = await fetchJsonWithRetry(summaryUrl, warnings)
      if (summary) {
        label = summary.title

        if (summary.coordinates) {
          const cLat = parseCoord(summary.coordinates.lat, 'lat')
          const cLng = parseCoord(summary.coordinates.lon, 'lng')
          if (cLat !== null && cLng !== null) {
            restGeo = { lat: cLat, lng: cLng }
            geo = restGeo
          }
        }

        if (summary.wikibase_item && !wikidataId) {
          wikidataId = summary.wikibase_item
        }

        const thumbSrc = summary.thumbnail?.source || summary.originalimage?.source
        if (thumbSrc) {
          imageCandidate = { commonsUrl: thumbSrc }
        }

        const wikipediaCanonical = summary.content_urls?.desktop?.page || input.wikipediaUrl
        sameAsSet.add(wikipediaCanonical)
      } else {
        warnings.push(`Không lấy được Wikipedia summary cho "${title}"`)
        sameAsSet.add(input.wikipediaUrl)
      }
    }
  }

  if (wikidataId) {
    const cleanQ = wikidataId.trim()
    sameAsSet.add(`https://www.wikidata.org/wiki/${cleanQ}`)

    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${cleanQ}.json`
    const entityData = await fetchJsonWithRetry(entityUrl, warnings)
    if (entityData) {
      const entity = entityData.entities?.[cleanQ]

      const p625 = entity?.claims?.P625?.[0]?.mainsnak?.datavalue?.value
      const p625Lat = p625 ? parseCoord(p625.latitude, 'lat') : null
      const p625Lng = p625 ? parseCoord(p625.longitude, 'lng') : null
      if (p625Lat !== null && p625Lng !== null) {
        const wikidataGeo = { lat: p625Lat, lng: p625Lng }
        if (restGeo) {
          const dist = haversineMeters(restGeo.lat, restGeo.lng, wikidataGeo.lat, wikidataGeo.lng)
          if (dist > 500) {
            warnings.push(
              `Geo lệch >500m giữa Wikipedia REST và Wikidata P625 (${Math.round(dist)}m) — giữ P625`,
            )
          }
        }
        geo = wikidataGeo // P625 ưu tiên hơn coordinates của REST
      }

      const p18 = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
      if (p18 && typeof p18 === 'string') {
        imageCandidate = {
          commonsUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p18)}`,
        }
      }
    } else {
      warnings.push(`Không lấy được Wikidata entity ${cleanQ}`)
    }
  }

  return {
    geo,
    sameAs: Array.from(sameAsSet).filter(Boolean),
    imageCandidate,
    wikidataId,
    label,
    warnings,
  }
}

export const wikidataSource: StructuredSource = {
  name: 'wikidata',
  resolve: (input) => resolveStructured(input),
}
