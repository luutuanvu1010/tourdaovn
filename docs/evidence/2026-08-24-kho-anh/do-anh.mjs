// Đo kho ảnh của các trang ĐANG LÊN SÓNG trên tourdao.vn.
// Bằng chứng cho hạng mục "ảnh" thêm vào SPEC vòng 5.
//
// Bộ lọc "lên sóng" chép đúng src/lib/sanity.ts:162 —
//   reviewStatus == "approved" && defined(slug.vi.current) && defined(title.vi)
// Field là i18n: title.vi, slug.vi.current.
//
// Chạy: node do-anh.mjs <đường dẫn .env>
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(process.argv[2] || '.env', 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => {
      const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)
const PID = env.SANITY_STUDIO_PROJECT_ID, DS = env.SANITY_STUDIO_DATASET, TOK = env.SANITY_READ_TOKEN
const TYPES = ['tour', 'attraction', 'place', 'experience', 'hotel', 'resort']
const LANG = 'vi'

const groq = `*[_type in ${JSON.stringify(TYPES)} && !(_id in path("drafts.**"))
  && reviewStatus == "approved" && defined(slug.${LANG}.current) && defined(title.${LANG})]{
  "t":_type, "slug":slug.${LANG}.current, "title":title.${LANG},
  "main":mainImage.asset._ref, "alt":mainImage.alt,
  "gal":gallery[defined(asset)]{"r":asset._ref,"alt":alt}
}`
const url = `https://${PID}.api.sanity.io/v2026-06-01/data/query/${DS}?query=${encodeURIComponent(groq)}`
const res = await fetch(url, { headers: { Authorization: `Bearer ${TOK}` } })
if (!res.ok) { console.error('HTTP', res.status, await res.text()); process.exit(1) }
const docs = (await res.json()).result

// ref dạng: image-<hash>-<W>x<H>-<ext>
const parse = (r) => {
  const m = /^image-[0-9a-f]+-(\d+)x(\d+)-(\w+)$/.exec(r || '')
  return m ? { w: +m[1], h: +m[2], ext: m[3] } : null
}

// Mốc lấy từ chính mã, không tự đặt:
//   SiteHome.astro:121 + HomeHero.astro:27 + Footer.astro:57 → width 1800
//   Hero.astro:20 (hero trang chi tiết)                      → width 1200
//   Hero.astro:29 (ô mosaic) / Card.astro                    → width 640
const HERO_HOME_W = 1800
const HERO_W = 1200
const CARD_W = 640

const use = new Map(), extCount = {}, ratios = [], byType = {}
let noAlt = 0, galNoAlt = 0, galTotal = 0
const noMainList = []
for (const d of docs) {
  byType[d.t] ??= { n: 0, main: 0 }
  byType[d.t].n++
  if (!d.main) { noMainList.push(`${d.t}/${d.slug} — ${d.title}`); continue }
  byType[d.t].main++
  if (!d.alt) noAlt++
  const p = parse(d.main)
  use.set(d.main, (use.get(d.main) || 0) + 1)
  extCount[p?.ext || '?'] = (extCount[p?.ext || '?'] || 0) + 1
  if (p) ratios.push({ ...d, ...p, ar: p.w / p.h })
  for (const g of d.gal || []) {
    galTotal++
    if (!g.alt) galNoAlt++
    use.set(g.r, (use.get(g.r) || 0) + 1)
  }
}

const dup = [...use.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])
const pct = (n, d) => `${n}/${d} = ${d ? Math.round(n / d * 100) : 0}%`
const withMain = docs.length - noMainList.length

console.log(`Trang chi tiết ĐANG LÊN SÓNG, 6 loại entity: ${docs.length}`)
for (const [t, v] of Object.entries(byType).sort((a, b) => b[1].n - a[1].n))
  console.log(`  ${t.padEnd(11)} ${String(v.main).padStart(3)}/${String(v.n).padEnd(3)} có ảnh chính`)
console.log()
console.log(`Không có ảnh chính:            ${pct(noMainList.length, docs.length)}`)
console.log(`Có ảnh chính nhưng thiếu alt:  ${pct(noAlt, withMain)}`)
console.log(`Ảnh gallery thiếu alt:         ${pct(galNoAlt, galTotal)}`)
console.log()
console.log(`--- Độ phân giải ảnh chính (n=${ratios.length}) ---`)
console.log(`Hẹp hơn ${HERO_W}px — Hero trang chi tiết xin: ${pct(ratios.filter(r => r.w < HERO_W).length, ratios.length)}`)
console.log(`Hẹp hơn ${HERO_HOME_W}px — hero trang chủ xin:    ${pct(ratios.filter(r => r.w < HERO_HOME_W).length, ratios.length)}`)
console.log(`Hẹp hơn ${CARD_W}px — thẻ lưới xin:            ${pct(ratios.filter(r => r.w < CARD_W).length, ratios.length)}`)
console.log(`Bề rộng nhỏ nhất ${Math.min(...ratios.map(r => r.w))}px · lớn nhất ${Math.max(...ratios.map(r => r.w))}px`)
console.log()
console.log(`--- Hướng khung ---`)
console.log(`Ảnh dọc (ar<1), cắt nặng ở khung ngang: ${pct(ratios.filter(r => r.ar < 1).length, ratios.length)}`)
console.log(`Gần vuông (1<=ar<1.2):                  ${pct(ratios.filter(r => r.ar >= 1 && r.ar < 1.2).length, ratios.length)}`)
console.log(`Định dạng: ${JSON.stringify(extCount)}`)
console.log()
console.log(`--- Dùng lại cùng một tấm ảnh (ảnh chính + gallery) ---`)
console.log(dup.length ? dup.map(([r, n]) => `  ${n}x ${r}`).join('\n') : '  không có')
console.log()
console.log(`--- Trang lên sóng KHÔNG có ảnh chính (${noMainList.length}) ---`)
console.log(noMainList.length ? '  ' + noMainList.join('\n  ') : '  không có')
console.log()
console.log(`--- 12 ảnh chính hẹp nhất ---`)
for (const r of ratios.slice().sort((a, b) => a.w - b.w).slice(0, 12))
  console.log(`  ${String(r.w).padStart(4)}x${String(r.h).padEnd(5)} ar=${r.ar.toFixed(2)}  ${r.t}/${r.slug}`)
