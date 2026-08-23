/**
 * Luật 1 (06-BINDING_MAP §6) — một thông tin, một vùng, một lần.
 *
 * Tầng A (bật ở Task 2) — LẶP VÙNG: một field xuất hiện ở nhiều vùng hơn mức
 *   §3.1 cho phép. Ngoại lệ duy nhất là giá (thanh dính + khối hành động).
 * Tầng B (bật ở Task 8, 2026-08-23) — SAI VÙNG: field render ở vùng khác vùng
 *   §3.1 khai, dù không lặp (vd chỉ render đúng 1 lần nhưng ở nhầm vùng).
 *   Tầng B chỉ bật sau khi tầng A đã xanh trên toàn kho — bật sớm hơn thì mọi
 *   trang đỏ vì `info-bar`/`info-card` không phải vùng §3.1 khai, baseline
 *   thật bị chìm trong nhiễu. Tầng B XÉT THEO CỘT ENTITY của §3.1 (bốn cột:
 *   Điểm tham quan, Địa danh, Trải nghiệm, Tour) — chỉ phán một trang khi
 *   entity của trang đó có cột thật trong §3.1; entity không có cột (vd
 *   Organization, Person, Khách sạn) nằm ngoài thẩm quyền của tầng B, dù
 *   field cùng tên có cột ở entity khác (xem docMaTran/entityCuaTrang, và
 *   phần "Sửa entity-scope" bên dưới cho lý do).
 *
 * GIỚI HẠN CỦA TẦNG B — đọc trước khi coi tầng B là "bắt hết sai vùng". Một
 * giới hạn vẫn còn (bucket `'section'` bên dưới); một defect khác đã có
 * trong lần bật đầu tiên nay đã vá (đoạn "SỬA ENTITY-SCOPE" bên dưới) —
 * đọc cả hai để biết đúng biên hiện tại của tầng B.
 *
 *   §3.1 đặt tên nhiều vùng bằng văn xuôi trỏ vào một MỤC NỘI DUNG cụ thể
 *   (`highlights`, `body`, `accessInfo`, `faq`, `seasonNote`, `includes`,
 *   `excludes`, `itinerary`, `sameAs`, rollup `experiences` — mỗi ô đọc
 *   "mục ..." hoặc "dòng ..."). idTuTenVung() gom TẤT CẢ các ô đó về một id
 *   chung duy nhất là `'section'` (nhánh `key.startsWith('mục')` /
 *   `startsWith('dòng')` bên dưới) — HTML cũng không tách mục nào ra id
 *   riêng. Hệ quả: tầng B phân biệt được field render ở `fact-strip` thay vì
 *   `hero-badge` (id khác nhau), nhưng KHÔNG phân biệt được field render ở
 *   mục "Câu hỏi thường gặp" thay vì mục "Nguồn tham khảo" — cả hai đều chỉ
 *   là `'section'`, nên một field cho sai mục nội dung này sang mục nội dung
 *   khác sẽ lọt qua tầng B mà không hiện đỏ. Đây không phải lỗi cần vá ở đợt
 *   này: mở rộng parser để tách id cho từng mục nội dung là việc khác phạm
 *   vi Task 8 (chờ §3.1 được sửa để gán id riêng cho từng mục — đề xuất đó
 *   đang chờ chủ dự án duyệt bản sửa spec, chưa có ở đây). Tầng B vẫn có giá
 *   trị thật trong biên đã nêu; chỉ đừng đọc nó rộng hơn biên đó.
 *
 * GIỚI HẠN THỨ HAI CỦA TẦNG B — bốn id vùng ALIAS đọc được từ §3.1 nhưng
 * KHÔNG component nào từng phát ra (review toàn nhánh, 2026-08-23). ALIAS ở
 * dưới đọc được TÁM id ngắn từ §3.1 (`hero-badge`, `hero`, `breadcrumb`,
 * `fact-strip`, `sticky-bar`, `action-block`, `map-card`, `footer-meta`) cộng
 * bucket `'section'` ở trên. Nhưng chỉ NĂM trong số đó có mặt thật trong HTML
 * (`grep -rhoE 'data-region="[a-z-]+"' src/components/*.astro` — tự chạy lại
 * lệnh này để xác nhận, đừng tin danh sách chép tay ở đây):
 * `action-block`, `fact-strip`, `sticky-bar`, `map-card` (thẻ bản đồ, C1 vá
 * xong cùng đợt sửa này), và bucket `'section'`. BỐN id còn lại — `hero`,
 * `hero-badge`, `breadcrumb`, `footer-meta` — không component nào gắn, nên
 * BỐN hàng §3.1 tương ứng nằm HOÀN TOÀN ngoài thẩm quyền của cả hai tầng, dù
 * field có cột hợp lệ: hàng nhãn loại entity (`attractionType` ·
 * `placeType` · `experienceType` · `tourFormat` → `hero-badge`), hàng
 * `summary` (→ `hero`), hàng `containedInPlace` · `venue` (→ `breadcrumb`),
 * và hàng `_updatedAt` · `updatedAt` (→ `footer-meta`). Field nào chỉ render
 * ở một trong bốn vùng CHƯA GẮN THẺ này thì cả tầng A lẫn tầng B đều mù —
 * không đỏ dù đúng dù sai, vì HTML không mang manh mối nào để đối chiếu.
 * Đây chính là lỗ đã để lọt C1 (`hasMap` bị bỏ rơi không render ở đâu) và I1
 * (`duration` lặp sang `hero-badge`) qua tám vòng review việc — cả hai field
 * đó đứng cạnh một vùng KHÔNG GẮN THẺ (`hero-badge`), nên phần lặp/mất không
 * hề lên báo cáo dù render thật trên trang. Gắn `data-region`/`data-field`
 * cho bốn vùng còn lại (Hero.astro, Breadcrumb.astro, DetailLayout.astro
 * phần "Cập nhật") là việc NGOÀI PHẠM VI đợt sửa này — chỉ khai giới hạn
 * trung thực ở đây, không tự vá. Xem DR-047 (bản mở rộng) cho log đầy đủ.
 *
 *   SỬA ENTITY-SCOPE (Task 8, cùng ngày, sau khi phát hiện thật ở trên).
 *   Lần bật đầu tiên, docMaTran() gộp vùng theo TÊN FIELD, không theo
 *   entity/cột — nên khi `OrganizationDetail.astro`/`PersonDetail.astro`
 *   dùng lại đúng TÊN field (`address`, `telephone`, `officialSource`,
 *   `licenseInfo`, `sameAs`) mà §3.1 đã khai vùng cho Điểm tham quan/Địa
 *   danh/Tour, tầng B mượn NHẦM ràng buộc của entity khác — đỏ giả 15 lần
 *   trên 5 trang Organization/Person dù `info-card` là vùng hợp lệ (duy
 *   nhất) cho hai entity đó, vì chúng không có hàng nào ở §3.1 (DR-046).
 *   Đây là defect có sẵn từ Task 2 review (deferred minor: "allowed region
 *   count is a union across entity columns rather than per-entity cell"),
 *   tầng A chịu được vì nó chỉ ĐẾM, tầng B thì không vì nó SO SÁNH vùng cụ
 *   thể.
 *
 *   Bản vá: docMaTran() nay trả thêm `theoEntity` (Field → entity key →
 *   đúng vùng CỦA CỘT đó) và `entityCoCot` (tập entity có cột thật trong
 *   §3.1). `entityCuaTrang()` suy entity của một trang từ segment URL đầu,
 *   tra qua `ROUTE_MAP` (src/lib/routes.ts) — KHÔNG tự liệt "4 tiền tố URL"
 *   bằng tay (đúng loại lỗi DR-027: một bản sao thứ hai của ánh xạ đã có
 *   chủ). Tầng B nay chỉ phán một field khi (a) field có cột trong §3.1 VÀ
 *   (b) entity của trang có cột trong §3.1 (`entityCoCot`); ở đó nó tra
 *   đúng `theoEntity` của CỘT đó, không lấy hợp nhất nữa. Entity không có
 *   cột — Organization, Person, Khách sạn, Resort, Nhà hàng, Đặc sản, Sự
 *   kiện, Bài viết — nằm ngoài thẩm quyền tầng B, y hệt cách field không có
 *   hàng nào trong §3.1 đã luôn nằm ngoài thẩm quyền (`if (chophep)`). Tầng
 *   A KHÔNG đổi — vẫn dùng map hợp nhất `hopNhat`, vẫn chỉ đếm số vùng.
 *   Xem DR-046 (đoạn cập nhật Task 8) cho log đầy đủ của lần đỏ giả này.
 *
 * Vì sao có file này: Luật 1 là luật duy nhất trong 06 không có bộ kiểm máy.
 * g3 kiểm field CÓ được render không, không kiểm được render MẤY LẦN — và §3.1
 * tự ghi "bộ kiểm g3 không đọc". Một đợt rà tay trước đó (lọc sitemap theo 4
 * tiền tố URL, không xem trang lưu trú) từng đếm 44/58 trang chi tiết lặp
 * vùng. Bộ kiểm máy này quét TOÀN BỘ dist/ và đo đúng hơn: 58/58 trang có
 * data-region ở diem-tham-quan · dia-danh · trai-nghiem · tour · khach-san
 * đều lặp vùng (132 vi phạm) — bắt thêm cả khach-san (starRating,
 * beachAccess, checkinTime) mà đợt rà tay bỏ sót. Đây chính là lý do cần bộ
 * kiểm máy thay vì đếm tay (chốt kiểm soát 2026-08-23).
 *
 * ĐỌC THẲNG §3.1 TỪ MARKDOWN, không chép tay bảng vào đây — DR-027.
 *
 * Ghi chú vá lỗi phân tích bảng (so với bản nháp task-2-brief.md, thấy khi
 * chạy thật trên 06-BINDING_MAP.md v2.2 — không phải một bảng "chép tay"
 * mới, chỉ là parser tổng quát hơn để đọc đúng văn xuôi ô bảng thật):
 *   1. Dòng phân cách markdown `|---|---|...|` từng lọt qua bộ lọc (regex
 *      cũ so `line.slice(1)` với mẫu đòi `|` ở đầu — không bao giờ khớp).
 *      Sửa: nhận diện dòng phân cách bằng nội dung ô (toàn dấu `-`/`:`),
 *      không so chuỗi cụ thể của bảng này.
 *   2. Cột Field "giá (`bookingRef`)" chưa bỏ ngoặc đơn trước khi so
 *      `=== 'giá'`, nên field không bao giờ quy về khoá `gia`. Sửa: áp cùng
 *      phép bỏ ngoặc đã dùng cho ô giá trị.
 *   3. Nhiều ô vùng trong v2.2 là văn xuôi dài hơn ALIAS gốc dự liệu ("mắt
 *      cha trong breadcrumb", "ghi chú trong khối hành động", "khối hành
 *      động (`BookingForm`); …", "— (Tour không có mắt cha; …)"). ALIAS
 *      vẫn CHỈ ánh xạ cách viết tên vùng → id ngắn (không phải field→vùng);
 *      chỉ tổng quát hoá so khớp từ "bằng hệt" sang "chứa cụm đã biết", và
 *      chuẩn hoá ô rặt dấu gạch ngang (có hoặc không có chú thích sau nó)
 *      thành "không có vùng". Không field→vùng nào được gán tay.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
// Nguồn DUY NHẤT cho "entity nào có URL nào" — không tự liệt tiền tố URL ở
// đây (đúng loại lỗi DR-027 cảnh báo: một bản sao thứ hai của một ánh xạ đã
// có chủ). g3-binding-map-vs-template.ts đã đặt tiền lệ import thẳng từ
// src/ cho việc này; scripts/tsconfig.json cũng đã khai riêng
// `../src/lib/**/*.ts` cho đúng mục đích này.
import { ROUTE_MAP } from '../../src/lib/routes'
import { langs, defaultLang } from '../../src/site.config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const BINDING_MAP = resolve(REPO_ROOT, 'docs', 'core-specs', '06-BINDING_MAP.md')
const DIST = resolve(REPO_ROOT, 'dist')
const REPORT_DIR = resolve(REPO_ROOT, 'scripts', 'reports')

/**
 * Sàn cỡ kho trang — chống "xanh giả" khi build hỏng giữa chừng.
 *
 * Phát hiện thật, 2026-08-23: dist/ bị cắt tay xuống còn 2 trang (mô phỏng
 * build chết nửa chừng — Sanity API ở đây có timeout thật), rồi chạy
 * validator này KHÔNG sửa gì khác. Kết quả in ra:
 *
 *     [pass] Luật 1 — 2 trang, 0 field lặp vùng
 *
 * Đó là XANH GIẢ: dist/ méo, không phải dist/ sạch. Task 3 sắp đăng ký
 * validator này vào gate:all — một cổng bị build hỏng làm xanh còn tệ hơn
 * không có cổng, vì nó cấp "chứng nhận sạch" cho thứ chưa từng được soi.
 *
 * Sàn 80: build đầy đủ đo được là 105 trang; 80 chừa dư địa cho nội dung co
 * lại tự nhiên (gỡ trang, gộp mục) mà vẫn bắt được cắt-build thảm hoạ. Đây
 * KHÔNG phải nguồn sự thật thứ hai kiểu DR-027 cảnh báo — nó không nói field
 * nào thuộc vùng nào, chỉ nói "kho trang này nhỏ tới mức không kết luận được
 * gì cả", nên phải dừng trước khi tính vi phạm, không lẫn vào kết quả Luật 1.
 */
const CORPUS_FLOOR = 80

/**
 * Lớp phiên dịch tên vùng: §3.1 gọi vùng bằng tiếng Việt, HTML gắn id ngắn.
 * Đây KHÔNG phải nguồn sự thật thứ hai về "field nào ở vùng nào" — nó chỉ
 * chuẩn hoá CÁCH VIẾT. Bằng chứng: mọi tên vùng đọc được từ §3.1 mà không có
 * trong bảng này đều làm validator đỏ (xem ktraVungLa).
 */
const ALIAS: Record<string, string> = {
  'huy hiệu hero': 'hero-badge',
  'hero': 'hero',
  'breadcrumb': 'breadcrumb',
  'thông tin nhanh': 'fact-strip',
  'thanh dính': 'sticky-bar',
  'khối hành động': 'action-block',
  'thẻ bản đồ': 'map-card',
  'cuối nội dung': 'footer-meta',
  'bookingform': 'action-block',
}

function chuanHoa(s: string): string {
  return s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[`*]/g, '').trim()
}

// Thứ tự thử "chứa cụm" trong idTuTenVung phải là DÀI NHẤT TRƯỚC, không phải
// thứ tự khai báo trong ALIAS. Lý do: nếu một alias ngắn (vd "hero") lại là
// chuỗi con của một alias dài hơn xuất hiện cùng ô ("huy hiệu hero"), thử theo
// thứ tự khai báo có thể khớp nhầm alias ngắn trước — sai âm thầm, không lỗi.
// Hôm nay không cell nào rơi vào ca đó (mọi ô khớp bằng-hệt trước khi tới
// nhánh này), nhưng đây là bảo đảm mà comment idTuTenVung/ktraVungLa hứa:
// "tên vùng lạ ⇒ đỏ" chỉ đúng nếu match không phụ thuộc thứ tự khai báo.
const ALIAS_DAI_TOI_NGAN = Object.entries(ALIAS).sort((a, b) => b[0].length - a[0].length)

/** Tên vùng → id ngắn. So bằng hệt trước; rồi "chứa cụm ALIAS đã biết" cho
 *  văn xuôi dài hơn (vd "ghi chú trong khối hành động" chứa "khối hành động"),
 *  thử alias DÀI NHẤT trước để khớp không phụ thuộc thứ tự khai báo ALIAS. */
function idTuTenVung(key: string): string | null {
  if (ALIAS[key]) return ALIAS[key]
  if (key.startsWith('mục') || key.startsWith('dòng')) return 'section'
  for (const [aliasKey, id] of ALIAS_DAI_TOI_NGAN) {
    if (key.includes(aliasKey)) return id
  }
  return null
}

/**
 * Lớp phiên dịch entity, cùng tinh thần ALIAS ở trên nhưng cho trục entity
 * thay vì trục vùng: §3.1 đặt tên cột bằng nhãn tiếng Việt ("Điểm tham
 * quan"…), HTML/URL gọi bằng entity key ngắn ("attraction"…). Nguồn DUY NHẤT
 * là `ROUTE_MAP` (src/lib/routes.ts) — không gán tay cặp nhãn↔entity ở đây.
 * Nhãn cột nào không khớp `labels.vi` của ROUTE_MAP thì đỏ to (xem cotLa
 * trong docMaTran/main), không âm thầm bỏ qua — cùng nguyên tắc ktraVungLa.
 */
const ENTITY_BY_LABEL = new Map(ROUTE_MAP.map(r => [r.labels.vi, r.entity]))

/**
 * Segment URL đầu tiên (sau tiền tố ngôn ngữ nếu có) → entity key. Cũng lấy
 * thẳng từ `ROUTE_MAP`, gộp mọi ngôn ngữ đang bật (`langs`) — không tự liệt
 * "4 tiền tố URL" bằng tay (đúng loại lỗi DR-027).
 */
// Set<string> (không phải Set<Lang>) có chủ đích: vế kiểm là một segment URL
// bất kỳ đọc từ tên thư mục thật (string trần), không phải một giá trị đã
// được xác nhận là Lang hợp lệ — đó chính là điều .has() ở entityCuaTrang()
// đang hỏi.
const LANG_PREFIXES = new Set<string>(langs.filter(l => l !== defaultLang))
const ENTITY_BY_SEGMENT = new Map<string, string>()
for (const r of ROUTE_MAP) for (const lang of langs) ENTITY_BY_SEGMENT.set(r.segments[lang], r.entity)

/** Entity key của một trang, suy từ đường dẫn file trong dist/. `null` nếu
 *  segment đầu không khớp entity nào trong ROUTE_MAP (vd trang tĩnh, hub). */
function entityCuaTrang(p: string): string | null {
  const parts = relative(DIST, p).split(/[\\/]/)
  const seg = LANG_PREFIXES.has(parts[0]) ? parts[1] : parts[0]
  return seg ? (ENTITY_BY_SEGMENT.get(seg) ?? null) : null
}

interface KetQuaMaTran {
  /** Field → hợp của MỌI vùng được khai qua mọi cột entity — tầng A (đếm số
   *  vùng) dùng nguyên map này, KHÔNG đổi so với trước Task 8. */
  hopNhat: Map<string, Set<string>>
  /** Field → entity key → đúng vùng §3.1 khai CHO ĐÚNG CỘT đó — tầng B dùng,
   *  để không mượn nhầm ràng buộc của entity khác (điều làm tầng B sai ở lần
   *  bật đầu tiên). */
  theoEntity: Map<string, Map<string, Set<string>>>
  /** Entity key nào có cột thật trong §3.1 hôm nay (Điểm tham quan, Địa danh,
   *  Trải nghiệm, Tour). Entity không có mặt ở đây — Organization, Person,
   *  Khách sạn, … — §3.1 không nói gì về vùng của chúng, nên tầng B không có
   *  thẩm quyền phán trên trang thuộc entity đó. */
  entityCoCot: Set<string>
  /** Nhãn cột đọc được từ dòng tiêu đề mà KHÔNG map được sang entity key nào
   *  qua ENTITY_BY_LABEL — phải luôn rỗng; khác rỗng nghĩa là §3.1 đổi tên
   *  cột hoặc ROUTE_MAP thiếu entity, main() phải đỏ to, không âm thầm bỏ cột. */
  cotLa: string[]
}

/** Đọc ma trận §3.1 → vừa map hợp nhất (tầng A) vừa map theo cột entity (tầng B). */
function docMaTran(): KetQuaMaTran {
  const doc = readFileSync(BINDING_MAP, 'utf-8')
  const m = doc.match(/### 3\.1[\s\S]*?\n(\|[\s\S]*?)\n\n/)
  if (!m) throw new Error('Khong doc duoc ma tran §3.1 trong 06-BINDING_MAP.md')

  const hopNhat = new Map<string, Set<string>>()
  const theoEntity = new Map<string, Map<string, Set<string>>>()
  const cotLa: string[] = []
  // cotEntity[i] = entity key của cột giá trị thứ i (0-based, sau cột Field),
  // đọc một lần từ dòng tiêu đề rồi dùng lại cho mọi dòng field bên dưới.
  let cotEntity: (string | null)[] = []

  for (const line of m[1].split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map(c => c.trim())
    if (cells.length < 2) continue

    if (cells[0] === 'Field') {
      cotEntity = cells.slice(1).map(nhan => {
        const ent = ENTITY_BY_LABEL.get(nhan) ?? null
        if (!ent) cotLa.push(nhan)
        return ent
      })
      continue
    }
    // Dòng phân cách markdown: mọi ô chỉ gồm dấu gạch ngang (có thể kèm ':').
    if (cells.every(c => /^:?-+:?$/.test(c))) continue

    // Cột 0 có thể gộp nhiều field: "`a` · `b` · `c`"; có thể kèm chú thích
    // trong ngoặc đơn ("giá (`bookingRef`)") — phải bỏ ngoặc trước khi so.
    const fields = cells[0]
      .split('·')
      .map(f => f.replace(/\(.*?\)/g, '').replace(/[`*]/g, '').trim())
      .filter(Boolean)

    const vungsHopNhat = new Set<string>()
    const vungsTheoCot: Set<string>[] = cells.slice(1).map(cell => {
      const vungsOCay = new Set<string>()
      const oChuan = chuanHoa(cell)
      if (oChuan && oChuan !== '—') { // "—" hoặc "— (chú thích)" đều là không có vùng
        for (const phan of oChuan.split('+')) {
          const key = phan.replace(/,.*$/, '').trim()
          if (!key || key === '—') continue
          const id = idTuTenVung(key)
          vungsOCay.add(id ?? `?${key}`)
          vungsHopNhat.add(id ?? `?${key}`)
        }
      }
      return vungsOCay
    })

    for (const f of fields) {
      const k = f === 'giá' ? 'gia' : f
      hopNhat.set(k, new Set([...(hopNhat.get(k) ?? []), ...vungsHopNhat]))

      if (!theoEntity.has(k)) theoEntity.set(k, new Map())
      const theoCotCuaField = theoEntity.get(k)!
      cotEntity.forEach((ent, i) => {
        if (!ent) return
        theoCotCuaField.set(ent, new Set([...(theoCotCuaField.get(ent) ?? []), ...vungsTheoCot[i]]))
      })
    }
  }

  const entityCoCot = new Set(cotEntity.filter((e): e is string => !!e))
  return { hopNhat, theoEntity, entityCoCot, cotLa }
}

function ktraVungLa(maTran: Map<string, Set<string>>): string[] {
  const la: string[] = []
  for (const [field, vungs] of maTran)
    for (const v of vungs) if (v.startsWith('?')) la.push(`${field} → ${v.slice(1)}`)
  return la
}

function moiTrangHtml(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = resolve(dir, e)
    if (statSync(p).isDirectory()) moiTrangHtml(p, acc)
    else if (e === 'index.html') acc.push(p)
  }
  return acc
}

/** Gom (field, vùng) của một trang. Vùng là data-region gần nhất bao ô đó. */
function docTrang(html: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  // Nhóm field CỐ Ý rộng ([^"]+), không phải [A-Za-z]+: §3.1 (06-BINDING_MAP.md
  // dòng 122) khai `_updatedAt` · `updatedAt`, tên field có gạch dưới đứng đầu —
  // [A-Za-z]+ không khớp, data-field="_updatedAt" sẽ bị bỏ qua ÂM THẦM, không lỗi,
  // không đếm, không lên báo cáo. Đây đúng kiểu lỗi rơi-lặng mà nhánh ALIAS đã
  // cố tình dựng để nổ ra (ktraVungLa) — không được để mở lại ở phía HTML.
  const rx = /data-region="([a-z-]+)"|data-field="([^"]+)"/g
  let vungHienTai = ''
  let m: RegExpExecArray | null
  while ((m = rx.exec(html))) {
    if (m[1]) { vungHienTai = m[1]; continue }
    const field = m[2]
    if (!vungHienTai) continue
    if (!out.has(field)) out.set(field, new Set())
    out.get(field)!.add(vungHienTai)
  }
  return out
}

function main() {
  const { hopNhat: maTran, theoEntity, entityCoCot, cotLa } = docMaTran()

  const la = ktraVungLa(maTran)
  if (la.length > 0) {
    console.log(`[FAIL] §3.1 có ${la.length} tên vùng chưa khai trong ALIAS:`)
    for (const x of la) console.log(`       ${x}`)
    console.log('       Sửa ALIAS trong luat1-post.ts, KHÔNG sửa 06 để né bộ kiểm.')
    process.exit(1)
  }

  // Cùng nguyên tắc với ktraVungLa ở trên, áp cho trục entity: tên cột lạ
  // (§3.1 đổi tên, hoặc ROUTE_MAP thiếu entity) phải đỏ to, không âm thầm
  // rớt cột đó khỏi tầng B.
  if (cotLa.length > 0) {
    console.log(`[FAIL] §3.1 có ${cotLa.length} tên cột chưa map được sang entity trong ROUTE_MAP:`)
    for (const x of cotLa) console.log(`       "${x}"`)
    console.log('       Sửa ENTITY_BY_LABEL/ROUTE_MAP (src/lib/routes.ts) cho khớp §3.1,')
    console.log('       KHÔNG đổi tên cột trong 06 để né bộ kiểm.')
    process.exit(1)
  }

  const trangs = moiTrangHtml(DIST)

  // Sàn cỡ kho trang — PHẢI chạy trước khi tính vi phạm. Đây không phải kết
  // quả Luật 1 (không nói field/vùng gì cả), nên không được lẫn vào [pass]
  // hay [FAIL] vi phạm lặp vùng — phải là nhánh thoát riêng, rõ ràng khác.
  if (trangs.length < CORPUS_FLOOR) {
    console.log(
      `[REFUSE] Luật 1 — chỉ thấy ${trangs.length} trang trong dist/, dưới sàn ${CORPUS_FLOOR}.`,
    )
    console.log('         Build trông như bị cắt (dở dang hoặc lỗi giữa chừng), không phải dist/ sạch.')
    console.log('         Từ chối phán quyết Luật 1 trên kho trang này — đây KHÔNG phải "0 vi phạm".')
    console.log('         Sửa: build lại (npm run build) rồi chạy lại validator.')
    process.exit(1)
  }

  const viPham: { page: string; field: string; regions: string[] }[] = []
  for (const p of trangs) {
    const pageEntity = entityCuaTrang(p)
    const duLieu = docTrang(readFileSync(p, 'utf-8'))
    for (const [field, vungs] of duLieu) {
      const chophep = maTran.get(field)
      // Vùng cũ chưa có trong §3.1 vẫn tính vào số vùng — đó là điểm của tầng A.
      // Tầng A giữ nguyên map hợp nhất theo TÊN field (không theo entity) —
      // không đổi so với trước Task 8.
      const soVungChoPhep = chophep ? chophep.size : 1
      if (vungs.size > soVungChoPhep)
        viPham.push({ page: relative(REPO_ROOT, p), field, regions: [...vungs].sort() })

      // Tầng B — SAI VÙNG, đúng theo CỘT ENTITY của §3.1 (không lấy hợp nhất
      // như tầng A). Chỉ phán khi (a) field có ít nhất một cột khai trong
      // §3.1 (chophep) VÀ (b) entity của trang này có cột trong §3.1
      // (entityCoCot). Entity không có cột — Organization, Person, Khách
      // sạn, … — §3.1 không nói gì về vùng của chúng, nên tầng B không có
      // thẩm quyền phán, y hệt lý do `if (chophep)` tránh phán field §3.1
      // chưa từng nhắc tới. Đây là bản vá cho phát hiện Task 8: trước bản vá
      // này, tầng B mượn nhầm ràng buộc của Điểm tham quan/Địa danh/Tour cho
      // field trùng TÊN trên Organization/Person (15 vi phạm giả — xem
      // DR-046). Field có cột nhưng Ô cụ thể ghi "—" (không có vùng) vẫn
      // đúng đắn: `chophepEntity` rỗng, field render ở BẤT KỲ vùng nào cũng
      // là sai — đúng nghĩa "§3.1 nói field này không có mặt ở entity đó".
      if (chophep && pageEntity && entityCoCot.has(pageEntity)) {
        const chophepEntity = theoEntity.get(field)?.get(pageEntity) ?? new Set<string>()
        const sai = [...vungs].filter(v => !chophepEntity.has(v))
        if (sai.length > 0)
          viPham.push({ page: relative(REPO_ROOT, p), field, regions: [`SAI VUNG: ${sai.sort().join(' + ')}`] })
      }
    }
  }

  mkdirSync(REPORT_DIR, { recursive: true })
  writeFileSync(
    resolve(REPORT_DIR, 'luat1-post.json'),
    JSON.stringify({ pages: trangs.length, violations: viPham }, null, 2),
  )

  if (viPham.length > 0) {
    const soTrang = new Set(viPham.map(v => v.page)).size
    // Tách đếm theo tầng chỉ để in đúng chữ — không đổi cách tính viPham.
    const soSaiVung = viPham.filter(v => v.regions[0]?.startsWith('SAI VUNG:')).length
    const soLapVung = viPham.length - soSaiVung
    console.log(
      `[FAIL] Luật 1 — ${viPham.length} vi phạm (${soLapVung} lặp vùng, ${soSaiVung} sai vùng) trên ${soTrang} trang:`,
    )
    for (const v of viPham.slice(0, 20))
      console.log(`       ${v.page}  ${v.field}  →  ${v.regions.join(' + ')}`)
    if (viPham.length > 20) console.log(`       … và ${viPham.length - 20} vi phạm nữa (xem scripts/reports/luat1-post.json)`)
    process.exit(1)
  }

  console.log(`[pass] Luật 1 — ${trangs.length} trang, 0 field lặp vùng, 0 field sai vùng`)
}

main()
