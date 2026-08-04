/**
 * Entity Type Registry — nguồn sự thật duy nhất cho nhãn Entity Type trong menu,
 * điều hướng, language filter, và mọi nơi cần mapping schemaType → tên hiển thị.
 *
 * Khi thêm/bớt entity trong schemas/index.ts, chỉ cần cập nhật ENTITY_TYPES ở đây,
 * mọi component khác tự động cập nhật.
 */
import {
  EarthGlobeIcon,
  PinIcon,
  TagIcon,
  HomeIcon,
  SunIcon,
  RocketIcon,
  BoltIcon,
  CalendarIcon,
  UsersIcon,
  DocumentTextIcon,
  UserIcon,
  CogIcon,
  TagsIcon,
} from '@sanity/icons'
import type { ComponentType } from 'react'

export interface EntityTypeMeta {
  /** schemaType name trong Sanity (trùng với name trong defineType) */
  schemaType: string
  /** Tên tiếng Việt hiển thị ở menu và sidebar */
  labelVi: string
  /**
   * Tên Entity tiếng Anh theo 01-CONTENT_MODEL.md §2 — KHÔNG phải @type của
   * schema.org. Hai thứ này khác nhau và không được lẫn: CONTENT_MODEL là nguồn
   * sự thật về mô hình dữ liệu, schema.org chỉ là vocabulary đích lúc serialize
   * (§5.1, P4). Ví dụ Entity `Attraction` serialize ra @type `TouristAttraction`,
   * Entity `Place` với placeType=ward serialize ra @type `AdministrativeArea`.
   * Bảng map Entity → @type nằm ở src/lib/serialize/, không nằm ở đây.
   *
   * Dùng để ghi chú tên Entity cạnh nhãn tiếng Việt trong menu, giúp biên tập
   * viên đối chiếu thẳng với đặc tả khi đọc tài liệu dự án.
   */
  entityTypeEn: string
  /** Phân nhóm để hiển thị có tổ chức trong menu */
  group: 'destination' | 'place' | 'stay' | 'dining' | 'activity' | 'event' | 'content' | 'system'
  /** Icon từ @sanity/icons */
  icon: ComponentType
  /** Có phải là entity có thể cào nội dung không */
  scrapable: boolean
}

/**
 * Registry trung tâm của tất cả entity type.
 * Thứ tự trong mảng = thứ tự hiển thị trong menu sidebar.
 */
export const ENTITY_TYPE_REGISTRY: EntityTypeMeta[] = [
  // === HỆ THỐNG ===
  {
    schemaType: 'siteSettings',
    labelVi: 'Trang chủ',
    entityTypeEn: 'SiteSettings',
    group: 'system',
    icon: CogIcon,
    scrapable: false,
  },

  // === ĐIỂM ĐẾN ===
  {
    schemaType: 'touristDestination',
    labelVi: 'Điểm đến',
    entityTypeEn: 'TouristDestination',
    group: 'destination',
    icon: EarthGlobeIcon,
    scrapable: false,
  },

  // === ĐỊA DANH & THAM QUAN ===
  {
    schemaType: 'place',
    labelVi: 'Địa danh',
    entityTypeEn: 'Place',
    group: 'place',
    icon: PinIcon,
    scrapable: true,
  },
  {
    schemaType: 'attraction',
    labelVi: 'Điểm tham quan',
    // CONTENT_MODEL §2.3 gọi Entity này là `Attraction`. `TouristAttraction` là
    // @type schema.org lúc serialize, không phải tên Entity — sửa 2026-08-04.
    entityTypeEn: 'Attraction',
    group: 'place',
    icon: TagIcon,
    scrapable: true,
  },

  // === LƯU TRÚ ===
  {
    schemaType: 'hotel',
    labelVi: 'Khách sạn',
    entityTypeEn: 'Hotel',
    group: 'stay',
    icon: HomeIcon,
    scrapable: true,
  },
  {
    schemaType: 'resort',
    // Khớp với tiêu đề document trong schemas/resort.ts ('Khu nghỉ dưỡng (Resort)')
    // — một entity một tên, menu và form không gọi khác nhau.
    labelVi: 'Khu nghỉ dưỡng',
    entityTypeEn: 'Resort',
    group: 'stay',
    icon: SunIcon,
    scrapable: true,
  },

  // === HOẠT ĐỘNG ===
  {
    schemaType: 'experience',
    labelVi: 'Trải nghiệm',
    // CONTENT_MODEL §2.4 gọi Entity này là `Experience`. `TouristExperience`
    // thậm chí không phải type có thật của schema.org — sửa 2026-08-04.
    entityTypeEn: 'Experience',
    group: 'activity',
    icon: RocketIcon,
    scrapable: false,
  },
  {
    schemaType: 'tour',
    labelVi: 'Tour',
    entityTypeEn: 'Tour',
    group: 'activity',
    icon: BoltIcon,
    scrapable: true,
  },

  // === SỰ KIỆN & TỔ CHỨC ===
  {
    schemaType: 'event',
    labelVi: 'Sự kiện',
    entityTypeEn: 'Event',
    group: 'event',
    icon: CalendarIcon,
    scrapable: false,
  },
  {
    schemaType: 'organization',
    labelVi: 'Tổ chức',
    entityTypeEn: 'Organization',
    group: 'event',
    icon: UsersIcon,
    scrapable: false,
  },

  // === NỘI DUNG ===
  {
    schemaType: 'article',
    labelVi: 'Bài viết',
    entityTypeEn: 'Article',
    group: 'content',
    icon: DocumentTextIcon,
    scrapable: false,
  },
  {
    schemaType: 'person',
    labelVi: 'Tác giả',
    entityTypeEn: 'Person',
    group: 'content',
    icon: UserIcon,
    scrapable: false,
  },

  // === HỆ THỐNG ===
  {
    schemaType: 'category',
    labelVi: 'Danh mục',
    entityTypeEn: 'Category',
    group: 'system',
    icon: TagsIcon,
    scrapable: false,
  },
]

/** Map nhanh schemaType → EntityTypeMeta */
const ENTITY_MAP = new Map(ENTITY_TYPE_REGISTRY.map(e => [e.schemaType, e]))

export function getEntityMeta(schemaType: string): EntityTypeMeta | undefined {
  return ENTITY_MAP.get(schemaType)
}

export function getEntityLabel(schemaType: string): string {
  return ENTITY_MAP.get(schemaType)?.labelVi ?? schemaType
}

export function getEntityTypeEn(schemaType: string): string {
  return ENTITY_MAP.get(schemaType)?.entityTypeEn ?? schemaType
}

/**
 * Nhãn menu: "Tên tiếng Việt (EntityEn)" — vd "Điểm đến (TouristDestination)".
 *
 * Ghi kèm tên Entity tiếng Anh để biên tập viên đối chiếu thẳng với
 * 01-CONTENT_MODEL.md §2 khi tra đặc tả, và để tên gọi trong menu khớp với tiêu đề
 * document (`title` trong cms/schemas/*.ts vốn đã theo dạng này). Một entity một tên,
 * không để menu gọi kiểu này còn form gọi kiểu khác.
 */
export function getEntityMenuLabel(schemaType: string): string {
  const meta = ENTITY_MAP.get(schemaType)
  if (!meta) return schemaType
  // Nhãn tiếng Việt trùng luôn tên Entity (vd Tour) thì không ghi ngoặc — tránh
  // "Tour (Tour)".
  if (meta.labelVi.toLowerCase() === meta.entityTypeEn.toLowerCase()) return meta.labelVi
  return `${meta.labelVi} (${meta.entityTypeEn})`
}

/** Danh sách schemaType có thể cào nội dung */
export function getScrapableTypes(): string[] {
  return ENTITY_TYPE_REGISTRY.filter(e => e.scrapable).map(e => e.schemaType)
}

/** Danh sách schemaType cho document-level i18n (chỉ Article) */
export function getDocI18nTypes(): string[] {
  return ['article']
}

/** Danh sách schemaType cho field-level i18n */
export function getFieldI18nTypes(): string[] {
  return ENTITY_TYPE_REGISTRY
    .filter(e => e.schemaType !== 'article' && e.schemaType !== 'siteSettings' && e.schemaType !== 'faqItem')
    .map(e => e.schemaType)
}

/** Nhóm các entity theo group để hiển thị trong menu */
export function getEntitiesByGroup() {
  const groups = new Map<string, EntityTypeMeta[]>()
  for (const entity of ENTITY_TYPE_REGISTRY) {
    if (!groups.has(entity.group)) groups.set(entity.group, [])
    groups.get(entity.group)!.push(entity)
  }
  return groups
}
