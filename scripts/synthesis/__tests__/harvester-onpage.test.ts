// Golden test (R3) cho on-page harvester (N3) — deterministic, KHÔNG gọi mạng/LLM/Sanity.
// Nạp 3 fixture HTML lưu sẵn: (1) JSON-LD đầy đủ, (2) chỉ OpenGraph, (3) không có gì.
// Chứng minh harvester moi geo/address/officialSource từ chính HTML, KHÔNG bịa, và bỏ geo
// ngoài khung Việt Nam (R4). Không có address → không geocode (cảnh báo). Test gọi parseOnpage
// (thuần, không mạng) và resolve({html}) (nhánh không cần fetch).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseOnpage, onpageHarvester } from '../harvester-onpage'

const FIX_DIR = resolvePath(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'onpage')
const loadFixture = (name: string) => readFileSync(resolvePath(FIX_DIR, name), 'utf8')

const fullJsonld = loadFixture('full-jsonld.html')
const ogOnly = loadFixture('og-only.html')
const none = loadFixture('none.html')

// ── (1) JSON-LD đầy đủ → geo + address + officialSource ──────────────────────
test('harvester — JSON-LD đầy đủ: geo + address + officialSource từ HTML', () => {
  const r = parseOnpage(fullJsonld)

  assert.ok(r.geo, 'phải có geo')
  assert.equal(r.geo!.lat, 12.2388)
  assert.equal(r.geo!.lng, 109.1967)

  assert.ok(r.address, 'phải có address')
  assert.equal(r.address!.street, '60 Trần Phú')
  assert.equal(r.address!.ward, 'Lộc Thọ') // addressLocality → ward (CONTENT_MODEL §2.4, I15)

  assert.equal(r.officialSource, 'https://luxurynhatrang.muongthanh.com/')
})

// ── (2) Chỉ OpenGraph → geo từ og:latitude/longitude, không address ──────────
test('harvester — chỉ OG: geo từ og:lat/lng, officialSource từ og:url, không address', () => {
  const r = parseOnpage(ogOnly)

  assert.ok(r.geo, 'phải có geo từ OG')
  assert.equal(r.geo!.lat, 12.245)
  assert.equal(r.geo!.lng, 109.192)

  assert.equal(r.address, undefined, 'không có PostalAddress → address rỗng')
  assert.equal(r.officialSource, 'https://haisanbonmua.vn/')
})

// ── (3) Không có gì → rỗng + cảnh báo, KHÔNG bịa ─────────────────────────────
test('harvester — không có structured: geo/address rỗng + cảnh báo', () => {
  const r = parseOnpage(none)

  assert.equal(r.geo, undefined)
  assert.equal(r.address, undefined)
  assert.equal(r.officialSource, undefined, 'không truyền pageUrl → officialSource rỗng')
  assert.ok(r.warnings.length > 0, 'phải có cảnh báo không tìm thấy dữ liệu cấu trúc')
})

// ── officialSource fallback về pageUrl khi trang là nguồn chính thức ──────────
test('harvester — officialSource fallback về pageUrl khi không có url khai báo', () => {
  const r = parseOnpage(none, 'https://quanviahe.example/')
  assert.equal(r.officialSource, 'https://quanviahe.example/')
})

// ── R4: geo ngoài khung Việt Nam bị bỏ + cảnh báo ────────────────────────────
test('harvester — geo ngoài khung VN [8,24]×[102,110] bị bỏ + cảnh báo (R4)', () => {
  const paris = `<!DOCTYPE html><html><head>
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Hotel","name":"X",
     "geo":{"@type":"GeoCoordinates","latitude":48.8566,"longitude":2.3522}}
    </script></head><body></body></html>`
  const r = parseOnpage(paris)
  assert.equal(r.geo, undefined, 'geo ngoài khung VN phải bị bỏ')
  assert.ok(r.warnings.some(w => /khung|Việt Nam|ngoài/i.test(w)), 'có cảnh báo geo ngoài khung')
})

// ── microdata (itemprop) → geo + address khi không có JSON-LD/OG ─────────────
test('harvester — microdata itemprop: geo + address từ thẻ itemprop', () => {
  const microdata = `<!DOCTYPE html><html><body>
    <div itemscope itemtype="https://schema.org/Restaurant">
      <span itemprop="latitude" content="12.25100"></span>
      <span itemprop="longitude" content="109.18900"></span>
      <span itemprop="streetAddress">12 Nguyễn Thị Minh Khai</span>
      <span itemprop="addressLocality">Tân Lập</span>
    </div></body></html>`
  const r = parseOnpage(microdata)
  assert.ok(r.geo, 'phải có geo từ microdata')
  assert.equal(r.geo!.lat, 12.251)
  assert.equal(r.geo!.lng, 109.189)
  assert.ok(r.address, 'phải có address từ microdata')
  assert.equal(r.address!.street, '12 Nguyễn Thị Minh Khai')
  assert.equal(r.address!.ward, 'Tân Lập')
})

// ── resolve({html}) không chạm mạng khi đã có html (nhánh test) ───────────────
test('harvester — resolve({html}) dùng html sẵn, conform StructuredResult, không fetch', async () => {
  const r = await onpageHarvester.resolve({ html: fullJsonld, url: 'https://luxurynhatrang.muongthanh.com/' })
  assert.ok(Array.isArray(r.sameAs), 'StructuredResult.sameAs là array')
  assert.ok(r.geo && r.geo.lat === 12.2388, 'geo giữ nguyên qua resolve')
  assert.ok(r.address && r.address.street === '60 Trần Phú')
  assert.equal(r.officialSource, 'https://luxurynhatrang.muongthanh.com/')
})

// ── N3b: trang không có geo lẫn address + có name → geocode theo TÊN (mock) ───
// Mock global.fetch để KHÔNG gọi Nominatim thật (cấm gọi mạng trong test). geocodeAddress
// chạy thật trên response giả → chứng minh harvester build query theo tên + gán geo + log nguồn.
test('harvester — trang rỗng + name: geocode-by-name (mock) gán geo trong khung VN + log nguồn', async (t) => {
  t.mock.method(global, 'fetch', async () =>
    new Response(JSON.stringify([{ lat: '12.224', lon: '109.239' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
  const r = await onpageHarvester.resolve({ html: none, name: 'Vinpearl Resort Nha Trang' })
  assert.ok(r.geo, 'geocode-by-name phải gán geo khi trang không có geo')
  assert.equal(r.geo!.lat, 12.224)
  assert.equal(r.geo!.lng, 109.239)
  assert.ok(r.warnings.some((w) => /geocode-name/.test(w)), 'log nguồn geo = geocode-name (R5)')
})

// ── N3b R3: geocode-by-name trả tọa độ ngoài khung VN → bỏ + cảnh báo ─────────
test('harvester — geocode-by-name trả geo ngoài khung VN [8,24]×[102,110] → bỏ + cảnh báo (R3)', async (t) => {
  t.mock.method(global, 'fetch', async () =>
    new Response(JSON.stringify([{ lat: '48.8566', lon: '2.3522' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
  const r = await onpageHarvester.resolve({ html: none, name: 'Tên trùng địa danh nước ngoài' })
  assert.equal(r.geo, undefined, 'geo ngoài khung VN từ geocode không được gán')
  assert.ok(r.warnings.some((w) => /ngoài khung|geocode-name/.test(w)), 'có cảnh báo bỏ geo ngoài khung')
})
