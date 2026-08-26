import type { StructureResolver } from 'sanity/structure'
import { CogIcon } from '@sanity/icons'
import {
  ENTITY_TYPE_REGISTRY,
  getEntityMeta,
  getEntityMenuLabel,
  type EntityTypeMeta,
} from './entityTypes'

/**
 * Build menu structure từ ENTITY_TYPE_REGISTRY — tự động cập nhật
 * khi thêm/bớt entity. Không còn hardcode từng label nữa.
 */
export const structure: StructureResolver = (S) => {
  // Nhóm entity theo group để tạo divider
  const grouped = new Map<string, EntityTypeMeta[]>()
  for (const entity of ENTITY_TYPE_REGISTRY) {
    if (entity.schemaType === 'siteSettings') continue // xử lý riêng
    if (!grouped.has(entity.group)) grouped.set(entity.group, [])
    grouped.get(entity.group)!.push(entity)
  }

  const items: any[] = []

  // Singleton: Trang chủ
  items.push(
    S.listItem()
      .title(getEntityMenuLabel('siteSettings'))
      .icon(CogIcon)
      .child(
        S.document()
          .schemaType('siteSettings')
          .documentId('siteSettings')
      ),
    S.divider()
  )

  // TouristDestination: danh sách, KHÔNG còn singleton (ADR-0028).
  //
  // Trước 2026-08-26 mục này ghim cứng `documentId('seed.nha-trang')`, nên bấm vào là
  // mở thẳng form Nha Trang — không danh sách, không nút tạo mới. Cardinality đã đổi
  // 1 → N ở 01-CONTENT_MODEL, schema đã có field, định tuyến vốn đã đa điểm đến, nhưng
  // chỗ này còn sót lại và chặn đúng việc mà ADR-0028 sinh ra để cho phép: nhập điểm
  // đến thứ hai. Nó cũng làm document `touristDestination` thứ hai đã có trong dataset
  // trở nên không với tới được qua menu.
  //
  // Dùng đúng khuôn `documentTypeListItem` như chín entity kia — không đặc cách, không
  // ghim cứng _id nào. Điểm đến trụ là cấu hình (`primaryDestinationSlug` trong
  // site.config), không phải một vị trí đặc biệt trong menu.
  const tdMeta = getEntityMeta('touristDestination')
  if (tdMeta) {
    items.push(
      S.documentTypeListItem('touristDestination')
        .title(getEntityMenuLabel('touristDestination'))
        .icon(tdMeta.icon),
      S.divider()
    )
  }

  // Tự động sinh menu item từ registry, bỏ qua system, destination
  const menuOrder: Array<{ group: string; divider: boolean }> = [
    { group: 'place', divider: false },
    { group: 'stay', divider: true },
    { group: 'dining', divider: true },
    { group: 'activity', divider: true },
    { group: 'event', divider: true },
    { group: 'content', divider: true },
    { group: 'system', divider: true },
  ]

  for (const { group, divider } of menuOrder) {
    const entries = grouped.get(group) || []
    if (entries.length === 0) continue // nhóm rỗng (vd 'dining' sau PHA 5) → bỏ, khỏi thừa divider
    if (divider) items.push(S.divider())
    for (const entity of entries) {
      const item = S.documentTypeListItem(entity.schemaType)
        .title(getEntityMenuLabel(entity.schemaType))
        .icon(entity.icon)
      items.push(item)
    }
  }

  return S.list()
    .title('Nội dung')
    .items(items)
}
