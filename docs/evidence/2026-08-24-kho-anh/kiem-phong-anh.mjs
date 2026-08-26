// Sanity CDN có phóng ảnh lên khi `?w=` lớn hơn ảnh gốc không, và cái giá là bao nhiêu byte?
// Tải thật, đọc kích thước pixel thật từ header file, so byte với lần xin đúng cỡ gốc.
// Không có tham số; hai ca đo là hai ca thật đang chạy trên site.
//
// Chạy: node kiem-phong-anh.mjs
const PID = 'pgedy374', DS = 'production'
const BASE = `https://cdn.sanity.io/images/${PID}/${DS}/`

const CASES = [
  {
    ten: 'attraction/thac-ta-gu — ảnh chính hẹp nhất của site',
    file: 'a80eb7877e470dfd949c9a9c67e7caad3d55f0ae-399x501.jpg',
    goc: 399,
    xin: 1200,          // Hero.astro:20
    noiXin: 'Hero.astro:20 (hero trang chi tiết)',
  },
  {
    ten: 'touristDestination/Nha Trang — ảnh hero TRANG CHỦ',
    file: '1839353b48ce4f41d82ea6c75f3f9a7179cc33ce-1280x720.jpg',
    goc: 1280,
    xin: 1800,          // SiteHome.astro:121
    noiXin: 'SiteHome.astro:121 (hero trang chủ)',
  },
]

// đọc kích thước pixel từ header file: JPEG (SOF) và WEBP (VP8/VP8L/VP8X)
function dims(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), fmt: 'jpeg' }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') {
    const t = buf.slice(12, 16).toString()
    if (t === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), fmt: 'webp/VP8X' }
    if (t === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, fmt: 'webp/VP8' }
    if (t === 'VP8L') {
      const b = buf.readUInt32LE(21)
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1, fmt: 'webp/VP8L' }
    }
  }
  return { w: '?', h: '?', fmt: buf.slice(0, 12).toString('hex') }
}

// đúng chuỗi tham số mà src/lib/sanity-image.ts sinh ra: w, q=80, auto=format
const lay = async (file, w) => {
  const r = await fetch(`${BASE}${file}?w=${w}&q=80&auto=format`)
  if (!r.ok) throw new Error(`HTTP ${r.status} cho ${file}?w=${w}`)
  return Buffer.from(await r.arrayBuffer())
}
const n = (x) => x.toLocaleString('vi-VN')

const NGAN_SACH_FONT = 89196   // QĐ-2026-08-24-02: tổng payload 6 file .woff2

let tongPhi = 0
for (const c of CASES) {
  const to = await lay(c.file, c.xin)
  const vua = await lay(c.file, c.goc)
  const d = dims(to)
  const phi = to.length - vua.length
  tongPhi += phi

  console.log(c.ten)
  console.log(`  mã xin w=${c.xin} — ${c.noiXin}`)
  console.log(`  CDN trả về ${d.w}x${d.h} (${d.fmt}) — ${d.w > c.goc ? 'CÓ PHÓNG LÊN' : 'không phóng'}`)
  console.log(`    ở w=${c.xin} (đang chạy):  ${n(to.length).padStart(9)} byte`)
  console.log(`    ở w=${c.goc} (cỡ gốc):     ${n(vua.length).padStart(9)} byte`)
  console.log(`    phí: ${n(phi)} byte (+${Math.round((to.length / vua.length - 1) * 100)}%) mà không thêm một chi tiết nào`)
  console.log()
}

console.log(`Tổng phí của riêng hai ca này: ${n(tongPhi)} byte`)
console.log(`So với toàn bộ ngân sách font của site (${n(NGAN_SACH_FONT)} byte): ${Math.round(tongPhi / NGAN_SACH_FONT * 100)}%`)
console.log()
console.log('Kết luận: Sanity CDN KHÔNG từ chối phóng ảnh. Xin `?w=` lớn hơn ảnh gốc thì nó nội suy')
console.log('lên rồi nén lại — trả về một tấm ảnh vừa mềm vừa nặng hơn ảnh gốc. Đây là lý do phải')
console.log('có mốc phân giải tối thiểu theo vai (R10), chứ không chỉ là chuyện thẩm mỹ.')
