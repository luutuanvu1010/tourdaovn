// Đối chiếu: slug "lên sóng" theo Sanity  ↔  thư mục thật trong dist/
// Mục đích: giải thích chênh lệch giữa số của QĐ-2026-08-24-02 (đếm dist) và số đọc Sanity.
// Chạy: node doi-chieu-dist.mjs <repo> <.env>
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const REPO = process.argv[2]
const env = Object.fromEntries(
  readFileSync(process.argv[3], 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const PID = env.SANITY_STUDIO_PROJECT_ID, DS = env.SANITY_STUDIO_DATASET, TOK = env.SANITY_READ_TOKEN

// nhánh URL theo 05-URL_MAP
const BRANCH = {
  tour: 'tour', attraction: 'diem-tham-quan', place: 'dia-danh',
  experience: 'trai-nghiem', hotel: 'khach-san', resort: 'resort',
}

const groq = `*[_type in ${JSON.stringify(Object.keys(BRANCH))} && !(_id in path("drafts.**"))
  && reviewStatus=="approved" && defined(slug.vi.current) && defined(title.vi)]{"t":_type,"s":slug.vi.current}`
const res = await fetch(`https://${PID}.api.sanity.io/v2026-06-01/data/query/${DS}?query=${encodeURIComponent(groq)}`,
  { headers: { Authorization: `Bearer ${TOK}` } })
if (!res.ok) { console.error('HTTP', res.status, await res.text()); process.exit(1) }
const docs = (await res.json()).result

const distDirs = (branch) => {
  const p = join(REPO, 'dist', branch)
  if (!existsSync(p)) return new Set()
  return new Set(readdirSync(p).filter(d => {
    const q = join(p, d)
    return statSync(q).isDirectory() && existsSync(join(q, 'index.html'))
  }))
}

console.log(`dist/ dựng lúc: ${statSync(join(REPO, 'dist')).mtime.toISOString()}`)
console.log()
let sanityTotal = 0, distTotal = 0
for (const [type, branch] of Object.entries(BRANCH)) {
  const want = docs.filter(d => d.t === type).map(d => d.s)
  const have = distDirs(branch)
  // trang term nằm cùng nhánh nên chỉ so chiều "Sanity có mà dist thiếu"
  const missing = want.filter(s => !have.has(s))
  sanityTotal += want.length
  distTotal += have.size
  console.log(`${branch.padEnd(16)} Sanity ${String(want.length).padStart(3)}  ·  dist ${String(have.size).padStart(3)} (gồm cả trang term)`)
  if (missing.length) console.log(`   THIẾU trong dist (${missing.length}): ${missing.join(', ')}`)
}
console.log()
console.log(`Tổng Sanity lên sóng: ${sanityTotal}`)
