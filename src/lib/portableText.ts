/**
 * Portable Text → cây khối để `Body.astro` render.
 *
 * ## Vì sao có file này
 *
 * `Body.astro` trước đây nhận ĐÚNG BA thứ: khối `image`, `style` khớp
 * `/^h[2-4]$/`, và "mọi thứ còn lại" → `<p>`. Portable Text mang nhiều hơn thế,
 * nên nhánh "mọi thứ còn lại" nuốt lặng lẽ:
 *
 *   - `listItem: 'bullet' | 'number'` (+ `level`) — gạch đầu dòng và danh sách
 *     đánh số. Mỗi mục ra một `<p>` rời, mất hẳn `<ul>/<ol>/<li>`.
 *   - `style: 'blockquote'` — mất `<blockquote>`.
 *   - `style: 'h1'` — mất luôn vai tiêu đề, tụt xuống chữ thường.
 *   - decorator `code` và `strike-through` — mất `<code>`, `<s>`.
 *
 * Đo trên dataset đang phát hành ngày 2026-08-29: 1 845 khối bullet, 12 khối
 * number, 49 blockquote, 94 h1 trong `body.vi` của 108 document; thêm 508 khối
 * bullet trong `article.body` và 9 trong `person.bio`. HTML vẫn hợp lệ nên
 * không cổng nào thấy — cùng loại lỗi câm với vụ link mất thẻ `<a>` ghi ở
 * docblock `renderInline` bên dưới.
 *
 * Tách khỏi `.astro` để kiểm được bằng test thuần (`scripts/audit/__tests__/
 * portable-text.test.ts`); `.astro` không nạp được vào `node:test`. Đây vẫn là
 * NGUỒN DUY NHẤT dịch Portable Text sang HTML — `Body.astro` là chỗ render duy
 * nhất của toàn site, không mở nhánh thứ hai.
 */

export type BodyNode =
  | { kind: 'image'; block: any }
  | { kind: 'heading'; tag: string; html: string }
  | { kind: 'paragraph'; html: string }
  | { kind: 'quote'; html: string }
  | { kind: 'list'; html: string }

export const esc = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Gỡ rác `(cite index="…">` do công cụ sinh nội dung để lại trong `body`.
 *
 * Trước khi có escape, trình duyệt lặng lẽ nuốt chúng như thẻ không biết. Sau
 * khi escape, chúng thành CHỮ HIỆN RA — đo được **25 thẻ trên 2 trang**
 * (`dia-danh/noi-thanh-nha-trang` 24, `dia-danh/cang-cap-treo-vinpearl` 1).
 * Tức bản vá escape đúng về bảo mật nhưng làm lộ một nợ dữ liệu có sẵn.
 *
 * Gỡ ở tầng render là chữa triệu chứng: nguồn vẫn bẩn. Nợ dọn hai tài liệu đó
 * trong Sanity ghi ở QĐ-2026-08-25-03. Làm ở đây vì không có nó thì đợt phát
 * hành này đẩy rác lên trang sống.
 */
export const goRac = (t: string) => t.replace(/<\/?cite\b[^>]*>/gi, '')

/**
 * Link trong Portable Text là ANNOTATION, không phải mark đơn giản: `marks` của
 * một span chứa `_key` trỏ vào `block.markDefs[]`.
 *
 * Bản cũ chỉ so chuỗi với 'strong' và 'em', nên mọi `_key` rơi vào nhánh
 * không-khớp và **link biến thành chữ thường** — 11 trang đã phát hành mất link
 * mà không cổng nào thấy, vì HTML vẫn hợp lệ, chỉ thiếu một thẻ `<a>`.
 *
 * Bản cũ cũng nhả thẳng `c.text` vào `set:html` mà không escape. Nay escape
 * trước rồi mới bọc thẻ.
 *
 * `code` và `strike-through` thêm ngày 2026-08-29: đó là hai decorator còn lại
 * trong bộ mặc định của `{type: 'block'}` (schema dự án không tuỳ biến danh
 * sách này), và `code` CÓ THẬT trong dữ liệu đang phát hành. Không thêm thì mỗi
 * lần biên tập bấm chúng lại tái diễn đúng lỗi câm ở trên.
 */
export function renderInline(children: any[], markDefs: any[] = []): string {
  return (children || []).map((c: any) => {
    if (!c || typeof c !== 'object') return ''
    const text = goRac(c.text || '')
    if (!text) return ''
    if (!c.marks || c.marks.length === 0) return esc(text)
    let out = esc(text)
    for (const mark of c.marks) {
      if (mark === 'strong') out = `<strong>${out}</strong>`
      else if (mark === 'em') out = `<em>${out}</em>`
      else if (mark === 'underline') out = `<u>${out}</u>`
      else if (mark === 'code') out = `<code>${out}</code>`
      else if (mark === 'strike-through') out = `<s>${out}</s>`
      else {
        const def = (markDefs || []).find((d: any) => d && d._key === mark)
        if (def && def._type === 'link' && def.href) {
          const href = String(def.href)
          // Link ra ngoài site mở tab mới kèm rel bảo vệ; link nội bộ thì không.
          const raNgoai = /^https?:\/\//i.test(href) && !href.includes('tourdao.vn')
          const them = raNgoai ? ' target="_blank" rel="noopener nofollow"' : ''
          out = `<a href="${esc(href)}"${them}>${out}</a>`
        }
      }
    }
    return out
  }).join('')
}

/** Chữ trần của một khối, sau khi gỡ rác — dùng để bỏ khối rỗng. */
const chuTran = (block: any): string =>
  goRac((block.children || []).map((c: any) => (c && c.text) || '').join(''))

const laMucDanhSach = (b: any): boolean =>
  Boolean(b && typeof b === 'object' && b._type === 'block' && b.listItem)

const cap = (b: any): number => {
  const n = Number(b.level)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

const loai = (b: any): 'bullet' | 'number' => (b.listItem === 'number' ? 'number' : 'bullet')

/**
 * Dựng MỘT list từ `items[start]` trở đi, trả về chỉ số dừng.
 *
 * Quy ước lồng của Portable Text: mục cấp sâu hơn đi NGAY SAU mục cha và
 * `<ul>` con nằm TRONG `<li>` cha — không phải list anh em. Đặt sai chỗ thì
 * trình duyệt vẫn vẽ được nhưng cây tài liệu sai và trình đọc màn hình đọc
 * thành hai danh sách rời.
 *
 * Dừng khi gặp cấp NÔNG hơn (trả về cho lời gọi cha) hoặc cùng cấp mà khác
 * loại (bullet ↔ number) — chỗ đó là một list mới.
 */
function dungList(items: any[], start: number): { html: string; next: number } {
  const capGoc = cap(items[start])
  const loaiGoc = loai(items[start])
  const cacLi: string[] = []
  let i = start

  while (i < items.length) {
    const it = items[i]
    const c = cap(it)
    if (c < capGoc) break
    if (c > capGoc) {
      const con = dungList(items, i)
      if (con.html) {
        if (cacLi.length > 0) cacLi[cacLi.length - 1] += con.html
        else cacLi.push(con.html)
      }
      i = con.next
      continue
    }
    if (loai(it) !== loaiGoc) break
    if (chuTran(it).trim()) cacLi.push(renderInline(it.children, it.markDefs))
    i++
  }

  const the = loaiGoc === 'number' ? 'ol' : 'ul'
  const html = cacLi.length > 0 ? `<${the}>${cacLi.map((c) => `<li>${c}</li>`).join('')}</${the}>` : ''
  return { html, next: i }
}

/**
 * Hạ cấp tiêu đề thân bài — `06` §3 hàng "Thân bài" (N15b, v2.2).
 *
 * `headingOffset = 1` đẩy h2→h3, h3→h4, h4→h5; kẹp ở h5, không hạ sâu hơn.
 *
 * `h1` bị NÂNG lên h2 trước khi cộng offset. Mọi trang chi tiết đã có đúng một
 * `<h1>` là tiêu đề trang (`DetailLayout.astro:132`, `TouristDestinationHub
 * .astro:106`, `ArticleDetail` qua `DetailLayout`), nên một `<h1>` thứ hai
 * trong thân bài làm hỏng dàn bài tài liệu. Trước đây h1 rơi về `<p>` — mất
 * sạch vai tiêu đề, tệ hơn. Kết quả: cẩm nang h1→`<h2>`, entity h1→`<h3>`,
 * tức đúng bằng chỗ mà một h2 biên tập gõ sẽ ra. Đánh đổi phải nói rõ: trên
 * cùng một trang, h1 và h2 của biên tập từ nay render CÙNG một cấp thẻ.
 */
const capTieuDe = (style: string, headingOffset: 0 | 1): string => {
  const n = Number(style.slice(1))
  if (!Number.isFinite(n)) return 'p'
  return 'h' + Math.min(Math.max(n, 2) + headingOffset, 5)
}

/**
 * Phẳng → cây. Không đụng DOM, không đụng CSS: `Body.astro` quyết định thẻ bọc
 * và style, file này chỉ quyết định CẤU TRÚC.
 */
export function planBody(
  blocks: any[] | undefined | null,
  opts: { headingOffset?: 0 | 1 } = {},
): BodyNode[] {
  const headingOffset = opts.headingOffset ?? 0
  const nodes: BodyNode[] = []
  if (!Array.isArray(blocks)) return nodes

  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]

    if (!block || typeof block !== 'object') {
      i++
      continue
    }

    if (laMucDanhSach(block)) {
      // Gom trọn dải mục danh sách liền nhau, rồi cắt thành các list theo cấp
      // và theo loại. Một dải có thể ra nhiều list (bullet xong tới number).
      let het = i
      while (het < blocks.length && laMucDanhSach(blocks[het])) het++
      const dai = blocks.slice(i, het)
      let j = 0
      while (j < dai.length) {
        const built = dungList(dai, j)
        if (built.html) nodes.push({ kind: 'list', html: built.html })
        if (built.next <= j) break
        j = built.next
      }
      i = het
      continue
    }

    if (block._type === 'image') {
      nodes.push({ kind: 'image', block })
      i++
      continue
    }

    if (block._type === 'block' && block.children) {
      if (!chuTran(block).trim()) {
        i++
        continue
      }
      const html = renderInline(block.children, block.markDefs)
      const style = block.style || 'normal'

      if (style === 'blockquote') nodes.push({ kind: 'quote', html })
      else if (/^h[1-6]$/.test(style)) {
        nodes.push({ kind: 'heading', tag: capTieuDe(style, headingOffset), html })
      } else nodes.push({ kind: 'paragraph', html })

      i++
      continue
    }

    i++
  }

  return nodes
}
