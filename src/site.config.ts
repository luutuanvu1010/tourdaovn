/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  site.config.ts — BẢNG ĐIỀU KHIỂN CỦA SITE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Đây là NƠI DUY NHẤT khai báo "site này gồm những gì".
 *  Mọi phần khác của code phải đọc từ đây, không được tự khai lại.
 *  (Hiến pháp P6 + N7 — một nguồn sự thật cho mỗi thứ.)
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  SỬA Ở ĐÂU?
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *   Loại thông tin              Sửa ở đâu                Hiệu lực khi nào
 *   ─────────────────────────   ──────────────────────   ──────────────────
 *   Bật/tắt một danh mục        FILE NÀY                 sau khi build lại
 *   Bật/tắt một hub             FILE NÀY                 sau khi build lại
 *   Ngôn ngữ của site           FILE NÀY                 sau khi build lại
 *   Tên miền                    FILE NÀY                 sau khi build lại
 *   ─────────────────────────   ──────────────────────   ──────────────────
 *   Tên site, mô tả site        Sanity Studio            ~2 phút, tự động
 *   Điện thoại, email, Zalo     Sanity Studio            ~2 phút, tự động
 *   Nội dung mọi trang          Sanity Studio            ~2 phút, tự động
 *
 *  Nguyên tắc phân chia: thứ gì đổi thì URL đổi theo (phải build lại) thì nằm
 *  ở file này. Thứ gì chỉ là chữ nghĩa hiển thị thì nằm trong Sanity để người
 *  quản trị tự sửa, không cần lập trình viên.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  AI ĐƯỢC SỬA GÌ  (chủ dự án chốt 2026-07-27)
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *   CHỦ DỰ ÁN — và chỉ chủ dự án:
 *     • File này: bật/tắt danh mục, thêm/bớt ngôn ngữ, đổi tên miền
 *
 *   BIÊN TẬP VIÊN (được mời vào Sanity Studio):
 *     • Nhập và sửa nội dung mọi danh mục
 *     • Sửa siteSettings: lời chào, kênh liên hệ, ẩn/hiện khối trang chủ
 *     • KHÔNG được bật/tắt danh mục, KHÔNG được thêm ngôn ngữ
 *
 *  Ranh giới này được bảo đảm bằng cấu trúc, không bằng lời nhắc: file này
 *  sống trong git và chỉ vào site qua một lần build. Biên tập viên không có
 *  quyền git cũng không có quyền deploy, nên không có đường nào chạm tới nó
 *  từ trong Studio. Ngược lại, siteSettings trong Sanity cố ý KHÔNG chứa bất
 *  kỳ công tắc bật/tắt danh mục hay ngôn ngữ nào — nếu sau này ai định thêm
 *  một công tắc như vậy vào Studio, đó là vi phạm quyết định này.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  CÁCH SỬA FILE NÀY
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *   1. Chỉ đổi giá trị sau dấu hai chấm. Đừng xoá dòng, đừng đổi tên bên trái.
 *   2. Bật một mục:  true    Tắt một mục:  false
 *   3. Sau khi sửa, chạy:  npm run build
 *      Nếu sửa sai (ví dụ bật một danh mục chưa có địa chỉ URL), build sẽ
 *      DỪNG và in ra đúng chỗ sai. Không có chuyện sai mà vẫn lên site.
 *
 *  Tài liệu quyết định: docs/adr/ADR-0021-site-config-nguon-su-that.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Lang } from './lib/types'

// ═══════════════════════════════════════════════════════════════════════════
//  1. THƯƠNG HIỆU VÀ TÊN MIỀN
// ═══════════════════════════════════════════════════════════════════════════
//
//  ⚠️  ĐÂY LÀ NƠI DUY NHẤT khai tên site. Không nơi nào trong code được viết
//      lại tên này — kể cả logo, footer, thẻ chia sẻ Facebook, hay JSON-LD.
//      Đổi ở đây là đổi toàn bộ site (chủ dự án chốt 2026-07-27, ADR-0021 QĐ8).
//
//  Tên site KHÔNG nằm trong Sanity: nó xuất hiện trong JSON-LD và thẻ meta ở
//  mọi trang, nên phải cố định lúc build. Biên tập viên không đổi được tên site.

export const brand = {
  /** Tên hiển thị: logo, footer, og:site_name, tiêu đề trang chủ */
  name: 'Tour Đảo',

  /** Tên pháp nhân đầy đủ — footer và node Organization trong JSON-LD */
  legalName: 'Công ty TNHH Tour Đảo',

  /** Năm thành lập — dòng bản quyền ở footer tự tính "© <năm nay> …" */
  foundedYear: 2026,
} as const

export const site = {
  /** Địa chỉ site khi chạy thật. `astro.config.mjs` import trực tiếp giá trị này
   *  (`site: site.url`) — không có bản chép tay thứ hai nào (P6 + N7, PHA 2). */
  url: 'https://tourdao.vn',

  /** Tên Sanity Studio (phần đầu của <ten>.sanity.studio) */
  studioHost: 'tourdaovn',
} as const

// ═══════════════════════════════════════════════════════════════════════════
//  2. NGÔN NGỮ
// ═══════════════════════════════════════════════════════════════════════════
//
//  Site hiện chỉ chạy TIẾNG VIỆT.
//
//  Bộ khung đa ngữ vẫn còn trong code (di sản từ engine gốc) nhưng đã bị khoá
//  bằng đúng danh sách dưới đây. Muốn mở thêm một ngôn ngữ thì phải có bản dịch
//  đầy đủ trước — thêm mã ngôn ngữ vào đây là site lập tức sinh URL cho nó.
//
//  Mã hợp lệ: 'vi' | 'en' | 'zh' | 'ko' | 'ru'

export const langs: Lang[] = ['vi']

/** Ngôn ngữ mặc định — trang không có tiền tố /xx/ */
export const defaultLang: Lang = 'vi'

// ═══════════════════════════════════════════════════════════════════════════
//  3. DANH MỤC NỘI DUNG (ENTITY) — BẬT/TẮT
// ═══════════════════════════════════════════════════════════════════════════
//
//  true  = có trang riêng trên site, có trong sitemap, Google thấy được
//  false = không có URL, không hiển thị, dù trong Sanity có dữ liệu
//
//  ⚠️  Tắt một danh mục đang có nội dung đã lên Google = mất thứ hạng của các
//      trang đó. Cân nhắc kỹ, và nếu tắt thì nên khai báo chuyển hướng 301.

export const entities = {
  // ── Điểm đến & trải nghiệm ────────────────────────────────────────────
  place:        true,   // Địa danh          → /dia-danh/
  attraction:   true,   // Điểm tham quan    → /diem-tham-quan/
  experience:   true,   // Trải nghiệm       → /trai-nghiem/

  // ── Lưu trú ───────────────────────────────────────────────────────────
  hotel:        true,   // Khách sạn         → /khach-san/
  resort:       true,   // Resort            → /resort/

  // ── Sản phẩm ──────────────────────────────────────────────────────────
  tour:         true,   // Tour              → /tour/

  // ── Nội dung ──────────────────────────────────────────────────────────
  article:      true,   // Cẩm nang          → /cam-nang/

  // ── Thẩm quyền (E-E-A-T) ──────────────────────────────────────────────
  person:       true,   // Tác giả           → /tac-gia/  (chỉ trang chi tiết)
  organization: true,   // Công ty           → /cong-ty/  (chỉ trang chi tiết)

  // ── ĐANG TẮT ──────────────────────────────────────────────────────────
  //  Ba mục dưới thuộc engine gốc (site du lịch Nha Trang), site này không
  //  dùng. Code và schema vẫn còn để không gãy tham chiếu chéo.
  restaurant:   false,  // Nhà hàng
  specialty:    false,  // Đặc sản
  event:        false,  // Sự kiện
} as const

// ═══════════════════════════════════════════════════════════════════════════
//  4. HUB ĐIỀU HƯỚNG — BẬT/TẮT
// ═══════════════════════════════════════════════════════════════════════════
//
//  Hub là trang gom nhiều danh mục lại theo chủ đề, hiện ở menu chính.
//
//  Ghi chú: hub Ẩm thực đã được XOÁ HẲN ngày 2026-07-27 (ADR-0021). Nội dung
//  về ẩm thực nay viết dưới dạng bài Cẩm nang (article), không có hub riêng.

export const hubs = {
  'hub-kham-pha': true,   // Khám phá  → /kham-pha/   (địa danh, tham quan, trải nghiệm)
  'hub-luu-tru':  true,   // Lưu trú   → /luu-tru/    (khách sạn, resort)
  'hub-di-lai':   true,   // Đi lại    → /di-lai/     (cẩm nang di chuyển)
  'hub-all':      true,   // Tất cả    → /tat-ca/     (trang gom, không hiện ở lưới trang chủ)
} as const

// ═══════════════════════════════════════════════════════════════════════════
//  5. TRANG ĐANG PHÁT TRIỂN — BẬT/TẮT
// ═══════════════════════════════════════════════════════════════════════════
//
//  Trang tĩnh đã viết xong code nhưng CHƯA muốn cho lên site thật.
//
//   false  → chỉ xem được khi chạy `npm run dev` trên máy bạn.
//            Bản `npm run build` KHÔNG sinh ra trang, sitemap KHÔNG liệt kê,
//            nên deploy lên Cloudflare cũng không có địa chỉ này.
//   true   → trang lên site thật ở lần deploy kế tiếp.
//
//  Khác với `entities` và `hubs` ở trên: hai bảng đó khai "site này gồm những
//  gì" lâu dài; bảng này chỉ là trạng thái tạm của một tính năng đang làm dở.
//  Khi tính năng chốt xong, chuyển cờ sang true và xoá dòng ghi chú trạng thái.

export const devPages = {
  /**
   * Lộ trình đón khách → /lo-trinh-don-khach/
   * Dữ liệu: siteSettings.pickupPoints (CONTENT_MODEL §2.15 v1.0.13).
   * Trạng thái 2026-08-04: chủ dự án chốt giữ ở chế độ phát triển, chưa lên
   * production. Field trong Sanity Studio vẫn mở để nhập thử dữ liệu.
   */
  'lo-trinh-don-khach': false,
} as const

// ═══════════════════════════════════════════════════════════════════════════
//  6. ĐIỂM ĐẾN CHÍNH CỦA TRANG CHỦ
// ═══════════════════════════════════════════════════════════════════════════
//
//  Trang chủ lấy nội dung từ một document "Điểm đến" trong Sanity.
//  Giá trị dưới đây là địa chỉ (slug) của document đó.
//
//  ⚠️  Điền sai thì trang chủ trắng nội dung. Kiểm bằng cách mở Sanity Studio,
//      vào Điểm đến, xem trường "Đường dẫn" của mục muốn dùng.
//
//  Ghi chú: trường này sẽ chuyển sang Sanity ở bước sau (chọn từ danh sách
//  thay vì gõ tay), xem ADR-0021.

export const primaryDestinationSlug = 'nha-trang'

// ═══════════════════════════════════════════════════════════════════════════
//  ── HẾT PHẦN CẤU HÌNH ──
//  Phần dưới là phần máy tự tính từ các khai báo trên. KHÔNG cần sửa.
// ═══════════════════════════════════════════════════════════════════════════

export type EntityKey = keyof typeof entities
export type HubKey = keyof typeof hubs
export type DevPageKey = keyof typeof devPages

/**
 * Trang đang phát triển có được sinh ra ở lần build này không.
 *
 * Cờ bật (true) → luôn sinh, kể cả bản production.
 * Cờ tắt (false) → chỉ sinh khi đang chạy `npm run dev`.
 *
 * Dùng optional chaining vì file này còn được nạp bởi Sanity Studio và các
 * script chạy bằng tsx — những môi trường đó không có `import.meta.env`.
 */
export function isDevPageBuilt(key: DevPageKey): boolean {
  if (devPages[key]) return true
  return import.meta.env?.DEV === true
}

/** Trang đang phát triển đã bật hẳn — chỉ những trang này mới vào sitemap. */
export const publishedDevPages: string[] = (Object.keys(devPages) as DevPageKey[])
  .filter((k) => devPages[k])

/** Danh sách danh mục đang bật */
export const enabledEntities = (Object.keys(entities) as EntityKey[])
  .filter((k) => entities[k])

/** Danh sách hub đang bật */
export const enabledHubs = (Object.keys(hubs) as HubKey[])
  .filter((k) => hubs[k])

/**
 * Hub hiện ở lưới điều hướng (trang chủ, trang điểm đến).
 * Bỏ `hub-all` vì đó là trang gom toàn bộ, không phải một lối vào chủ đề.
 */
export const navHubs: string[] = enabledHubs.filter((k) => k !== 'hub-all')

/** Tất cả mục có URL trên site = danh mục bật + hub bật */
export const enabledRoutes: string[] = [...enabledEntities, ...enabledHubs]

/**
 * Danh mục lưu bản dịch theo TỪNG TRƯỜNG (title.vi, slug.vi.current…).
 * Riêng `article` lưu mỗi ngôn ngữ một document nên không nằm ở đây.
 * Đây là đặc điểm mô hình dữ liệu, không phải công tắc — xem ADR-0013.
 */
const DOC_LEVEL_ENTITIES: string[] = ['article']

/** Danh mục bật, kiểu field-level — dùng cho truy vấn Sanity lúc build */
export const fieldLevelEntities: string[] = enabledEntities
  .filter((e) => !DOC_LEVEL_ENTITIES.includes(e))

/** Hỏi nhanh: danh mục này có đang bật không? */
export function isEntityEnabled(entity: string): boolean {
  return (entities as Record<string, boolean>)[entity] === true
}

/** Hỏi nhanh: hub này có đang bật không? */
export function isHubEnabled(hub: string): boolean {
  return (hubs as Record<string, boolean>)[hub] === true
}

/** Hỏi nhanh: mục này (danh mục hoặc hub) có URL trên site không? */
export function isRouteEnabled(key: string): boolean {
  return isEntityEnabled(key) || isHubEnabled(key)
}
