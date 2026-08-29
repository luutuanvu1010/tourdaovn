import { site } from '../../src/site.config'
import { ROUTE_MAP } from '../../src/lib/routes'
import { getDocI18nTypes } from './entityTypes'

const BASE_URL = site.url

// Type dùng i18n CẤP DOCUMENT (ADR-0004) lưu slug ở `slug.current`; mọi type còn lại
// dùng i18n cấp field và lưu ở `slug.vi.current`. Đọc nhầm chỗ thì hàm này trả null và
// nút "Xem trang live" biến mất — đó chính là lỗi Article mắc từ đầu (DR-074).
const DOC_I18N = new Set(getDocI18nTypes())

type SlugShape = {
  current?: string
  vi?: { current?: string }
}

export function resolveProductionUrl(
  doc: { _type: string; slug?: SlugShape }
): string | null {
  const slugValue = DOC_I18N.has(doc._type)
    ? doc.slug?.current ?? null
    : doc.slug?.vi?.current ?? null

  if (!slugValue) return null

  // Điểm đến ở gốc site, không qua segment danh mục nào (ADR-0028).
  if (doc._type === 'touristDestination') return `${BASE_URL}/${slugValue}/`

  // Segment lấy từ ROUTE_MAP — nguồn sự thật DUY NHẤT cho địa chỉ URL, và nó đã lọc
  // sẵn theo route đang bật. Trước đây chỗ này chép tay một bảng segment riêng, và
  // bảng đó trôi khỏi thực tế: nó khai `restaurant → /nha-hang/`, `specialty →
  // /dac-san/`, `event → /su-kien/` trong khi ba trang đó KHÔNG TỒN TẠI trong bản
  // dựng. Nút "Xem trang live" khi ấy mở thẳng vào 404. Suy từ ROUTE_MAP thì type
  // không có route sẽ tự trả null, và bảng không thể trôi được nữa.
  const route = ROUTE_MAP.find((r) => r.entity === doc._type)
  if (!route) return null

  const segment = route.segments.vi
  if (!segment) return null

  return `${BASE_URL}/${segment}/${slugValue}/`
}
