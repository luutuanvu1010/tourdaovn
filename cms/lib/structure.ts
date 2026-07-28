import type { StructureResolver } from 'sanity/structure'
import { CogIcon } from '@sanity/icons'
import {
  ENTITY_TYPE_REGISTRY,
  getEntityMeta,
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
      .title('Trang chủ')
      .icon(CogIcon)
      .child(
        S.document()
          .schemaType('siteSettings')
          .documentId('siteSettings')
      ),
    S.divider()
  )

  // TouristDestination: Nha Trang (singleton seed)
  const tdMeta = getEntityMeta('touristDestination')
  if (tdMeta) {
    items.push(
      S.listItem()
        .title(tdMeta.labelVi)
        .icon(tdMeta.icon)
        .child(
          S.document()
            .schemaType('touristDestination')
            .documentId('seed.nha-trang')
        ),
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
        .title(entity.labelVi)
        .icon(entity.icon)
      items.push(item)
    }
  }

  return S.list()
    .title('Nội dung')
    .items(items)
}
