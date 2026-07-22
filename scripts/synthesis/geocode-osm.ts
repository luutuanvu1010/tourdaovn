// N3 — Geocode adapter: address text → tọa độ qua OSM Nominatim (miễn phí).
// CHỈ là fallback (R3): harvester gọi khi có address nhưng thiếu geo. KHÔNG Google Maps (Cấm).
// Điều khoản Nominatim: bắt buộc User-Agent định danh + tối đa 1 request/giây.
import { FETCH_TIMEOUT_MS } from './config'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'nhatrangtravel-synthesis/1.0 (+https://nhatrangtravel.net)'
const MIN_INTERVAL_MS = 1000 // 1 req/s — điều khoản Nominatim

// Rate-limit ở mức module: tuần tự hoá mọi lời gọi cách nhau ≥1s.
let lastCallAt = 0
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function rateLimit(): Promise<void> {
  const wait = MIN_INTERVAL_MS - (Date.now() - lastCallAt)
  if (wait > 0) await sleep(wait)
  lastCallAt = Date.now()
}

/**
 * Trả {lat,lng} từ Nominatim hoặc null. Khung Việt Nam do caller (harvester) kiểm (R4).
 * Đẩy cảnh báo vào `warnings` thay vì throw — luồng synthesis không vỡ vì geocode lỗi.
 */
export async function geocodeAddress(
  query: string,
  warnings: string[],
): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim()
  if (!q) {
    warnings.push('Geocode: query rỗng → bỏ qua')
    return null
  }

  await rateLimit()

  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '1',
    countrycodes: 'vn', // khoá Việt Nam, giảm nhầm địa danh trùng tên nước ngoài
    addressdetails: '0',
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    })
    clearTimeout(timer)

    if (!res.ok) {
      warnings.push(`Geocode HTTP ${res.status} từ Nominatim cho "${q}"`)
      return null
    }

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      warnings.push(`Geocode: Nominatim không có kết quả cho "${q}"`)
      return null
    }

    const lat = Number(data[0]?.lat)
    const lng = Number(data[0]?.lon)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      warnings.push(`Geocode: lat/lon không hợp lệ từ Nominatim cho "${q}"`)
      return null
    }

    return { lat, lng }
  } catch (err: any) {
    clearTimeout(timer)
    const reason = err?.name === 'AbortError' ? `timeout sau ${FETCH_TIMEOUT_MS}ms` : err?.message
    warnings.push(`Geocode lỗi gọi Nominatim cho "${q}": ${reason}`)
    return null
  }
}
