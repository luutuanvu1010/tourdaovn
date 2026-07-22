// N3 — On-page harvester cho venue (restaurant/hotel/resort/tour).
// Impl của StructuredSource (resolver-structured.ts): moi geo/address/officialSource
// DETERMINISTIC từ chính HTML trang đã fetch (JSON-LD → microdata → OpenGraph → thẻ <address>),
// cộng geocode OSM fallback khi thiếu geo: ưu tiên address, không có address thì theo TÊN venue
// (N3b). KHÔNG LLM (R2).
//
// Lưu ý nguồn HTML (founder chốt 2026-06-23, option A): fetcher có thể truyền rawHtml
// cho harvester. Khi không có rawHtml, harvester tự GET raw HTML từ url. Trong unit test
// luôn truyền html fixture → KHÔNG chạm mạng (R: cấm gọi mạng thật trong test).
import { FETCH_TIMEOUT_MS } from './config'
import type { StructuredSource, StructuredResult } from './resolver-structured'
import { geocodeAddress } from './geocode-osm'
import { parseCoord } from '../../src/lib/geo'

// Khung Việt Nam/Khánh Hòa — đồng bộ output-validator.ts (VN_LAT_RANGE/VN_LNG_RANGE). Pre-filter
// phòng JSON-LD/OG/geocode trả nhầm địa điểm trùng tên nước ngoài (R4).
const VN_LAT_RANGE: [number, number] = [8, 24]
const VN_LNG_RANGE: [number, number] = [102, 110]

function inVietnamFrame(lat: number, lng: number): boolean {
  return lat >= VN_LAT_RANGE[0] && lat <= VN_LAT_RANGE[1] && lng >= VN_LNG_RANGE[0] && lng <= VN_LNG_RANGE[1]
}

interface ParsedAddress {
  street?: string
  ward?: string
}

// --- JSON-LD ----------------------------------------------------------------
function extractJsonLdNodes(html: string): any[] {
  const nodes: any[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim()
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      // Có thể là object, array, hoặc {"@graph":[...]}
      if (Array.isArray(parsed)) {
        nodes.push(...parsed)
      } else if (parsed && Array.isArray(parsed['@graph'])) {
        nodes.push(...parsed['@graph'])
      } else if (parsed && typeof parsed === 'object') {
        nodes.push(parsed)
      }
    } catch {
      // JSON-LD hỏng → bỏ qua, không throw (deterministic, best-effort)
    }
  }
  return nodes
}

function geoFromJsonLd(nodes: any[]): { lat: number; lng: number } | undefined {
  for (const node of nodes) {
    const g = node?.geo
    if (g && typeof g === 'object') {
      const lat = parseCoord(g.latitude, 'lat')
      const lng = parseCoord(g.longitude, 'lng')
      if (lat !== null && lng !== null) return { lat, lng }
    }
  }
  return undefined
}

function addressFromJsonLd(nodes: any[]): ParsedAddress | undefined {
  for (const node of nodes) {
    const a = node?.address
    if (a && typeof a === 'object' && !Array.isArray(a)) {
      const street = typeof a.streetAddress === 'string' ? a.streetAddress.trim() : undefined
      const ward = typeof a.addressLocality === 'string' ? a.addressLocality.trim() : undefined
      if (street || ward) return { street: street || undefined, ward: ward || undefined }
    }
  }
  return undefined
}

function urlFromJsonLd(nodes: any[]): string | undefined {
  for (const node of nodes) {
    if (typeof node?.url === 'string' && /^https?:\/\//i.test(node.url.trim())) {
      return node.url.trim()
    }
  }
  return undefined
}

// --- OpenGraph + meta -------------------------------------------------------
function metaContent(html: string, property: string): string | undefined {
  // Khớp cả property="..." content="..." lẫn content="..." property="..."
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re1 = new RegExp(`<meta[^>]*(?:property|name)=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i')
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${esc}["']`, 'i')
  const m = html.match(re1) || html.match(re2)
  return m ? m[1].trim() : undefined
}

function geoFromOpenGraph(html: string): { lat: number; lng: number } | undefined {
  const latStr = metaContent(html, 'og:latitude') || metaContent(html, 'place:location:latitude')
  const lngStr = metaContent(html, 'og:longitude') || metaContent(html, 'place:location:longitude')
  if (latStr === undefined || lngStr === undefined) return undefined
  const lat = parseCoord(latStr, 'lat')
  const lng = parseCoord(lngStr, 'lng')
  if (lat === null || lng === null) return undefined
  return { lat, lng }
}

// --- Microdata (itemprop) ---------------------------------------------------
function microdataItemprop(html: string, prop: string): string | undefined {
  const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // content="..." dạng meta/itemprop, hoặc text trong thẻ
  const reContent = new RegExp(`itemprop=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i')
  const reTag = new RegExp(`itemprop=["']${esc}["'][^>]*>([^<]*)<`, 'i')
  const m = html.match(reContent) || html.match(reTag)
  return m && m[1].trim() ? m[1].trim() : undefined
}

function geoFromMicrodata(html: string): { lat: number; lng: number } | undefined {
  const latStr = microdataItemprop(html, 'latitude')
  const lngStr = microdataItemprop(html, 'longitude')
  if (latStr === undefined || lngStr === undefined) return undefined
  const lat = Number(latStr)
  const lng = Number(lngStr)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return undefined
  return { lat, lng }
}

function addressFromMicrodata(html: string): ParsedAddress | undefined {
  const street = microdataItemprop(html, 'streetAddress')
  const ward = microdataItemprop(html, 'addressLocality')
  if (street || ward) return { street, ward }
  return undefined
}

// --- thẻ <address> (fallback cuối, chỉ street) ------------------------------
function addressFromTag(html: string): ParsedAddress | undefined {
  const m = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i)
  if (!m) return undefined
  const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return undefined
  // Không tách được phường tin cậy từ text tự do → chỉ điền street, ward để người/JSON-LD lo.
  return { street: text }
}

/**
 * Thuần (no network): moi geo/address/officialSource từ một chuỗi HTML.
 * Thứ tự ưu tiên: JSON-LD → microdata → OpenGraph (geo) / thẻ <address> (address).
 * Geo ngoài khung Việt Nam bị bỏ + cảnh báo (R4). KHÔNG bịa field (R2/R4).
 */
export function parseOnpage(html: string, pageUrl?: string): StructuredResult {
  const warnings: string[] = []
  const nodes = extractJsonLdNodes(html)

  // geo: JSON-LD → microdata → OG
  let geo = geoFromJsonLd(nodes) || geoFromMicrodata(html) || geoFromOpenGraph(html)
  if (geo && !inVietnamFrame(geo.lat, geo.lng)) {
    warnings.push(`Geo on-page ngoài khung Việt Nam [${VN_LAT_RANGE.join(',')}]×[${VN_LNG_RANGE.join(',')}] (lat=${geo.lat}, lng=${geo.lng}) → bỏ`)
    geo = undefined
  }

  // address: JSON-LD → microdata → thẻ <address>
  const address = addressFromJsonLd(nodes) || addressFromMicrodata(html) || addressFromTag(html)

  // officialSource: JSON-LD url → og:url → pageUrl (trang chính thức của venue)
  const officialSource =
    urlFromJsonLd(nodes) || metaContent(html, 'og:url') || (pageUrl && /^https?:\/\//i.test(pageUrl) ? pageUrl : undefined)

  if (!geo && !address) {
    warnings.push('Không tìm thấy geo/address cấu trúc trên trang (JSON-LD/microdata/OG/thẻ address)')
  }

  return {
    geo,
    address,
    officialSource,
    sameAs: [], // harvester không sinh sameAs (việc của Wikidata resolver)
    warnings,
  }
}

// --- Raw HTML fetch (chỉ khi resolve không được truyền html sẵn) ------------
async function fetchRawHtml(url: string, warnings: string[]): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'nhatrangtravel-synthesis/1.0 (+https://nhatrangtravel.net)' },
    })
    clearTimeout(timer)
    if (!res.ok) {
      warnings.push(`Harvester HTTP ${res.status} từ ${url}`)
      return null
    }
    return await res.text() // RAW, KHÔNG strip — cần <script>/meta cho JSON-LD/OG
  } catch (err: any) {
    clearTimeout(timer)
    const reason = err?.name === 'AbortError' ? `timeout sau ${FETCH_TIMEOUT_MS}ms` : err?.message
    warnings.push(`Harvester lỗi GET ${url}: ${reason}`)
    return null
  }
}

/**
 * Impl StructuredSource. resolve({html}) thuần (test); resolve({url}) tự GET raw HTML.
 * Sau parse: nếu thiếu geo → geocode OSM fallback — ưu tiên address, không có address thì
 * theo tên venue (input.name); kiểm khung VN (R1–R3, chỉ fallback). KHÔNG LLM.
 */
export const onpageHarvester: StructuredSource = {
  name: 'onpage',
  async resolve(input): Promise<StructuredResult> {
    const warnings: string[] = []
    let html = input.html

    if (!html && input.url) {
      const fetched = await fetchRawHtml(input.url, warnings)
      if (fetched) html = fetched
    }

    if (!html) {
      warnings.push('Harvester không có html lẫn url hợp lệ → bỏ qua')
      return { sameAs: [], warnings }
    }

    const parsed = parseOnpage(html, input.url)
    parsed.warnings = [...warnings, ...parsed.warnings]

    // Geocode fallback (N3b, R1): CHỈ khi trang không ra geo structured. Thứ tự nguồn không đổi —
    // on-page đã thử ở parseOnpage; đây là tầng cuối. Ưu tiên address (chính xác hơn, R2); không có
    // address mới geocode theo TÊN venue. Luôn nối ", Nha Trang, Việt Nam" để khoá vùng. Tọa độ phải
    // lọt khung Việt Nam (R3), ngoài khung → bỏ. Ghi nguồn (geocode-address/geocode-name) vào
    // warnings (R5). KHÔNG bịa address: geocode chỉ sinh geo (R6).
    if (!parsed.geo) {
      const hasAddress = !!(parsed.address && (parsed.address.street || parsed.address.ward))
      let query: string | undefined
      let geoSource: 'geocode-address' | 'geocode-name' | undefined
      if (hasAddress) {
        query = [parsed.address!.street, parsed.address!.ward, 'Nha Trang', 'Khánh Hòa', 'Việt Nam']
          .filter(Boolean)
          .join(', ')
        geoSource = 'geocode-address'
      } else if (input.name && input.name.trim()) {
        query = [input.name.trim(), 'Nha Trang', 'Việt Nam'].join(', ')
        geoSource = 'geocode-name'
      }

      if (query && geoSource) {
        const coords = await geocodeAddress(query, parsed.warnings)
        if (coords) {
          if (inVietnamFrame(coords.lat, coords.lng)) {
            parsed.geo = coords
            parsed.warnings.push(`Geo từ ${geoSource} (query: "${query}", lat=${coords.lat}, lng=${coords.lng})`)
          } else {
            parsed.warnings.push(
              `Geocode (${geoSource}) trả geo ngoài khung Việt Nam (lat=${coords.lat}, lng=${coords.lng}) → bỏ (R3)`,
            )
          }
        }
      }
    }

    return parsed
  },
}
