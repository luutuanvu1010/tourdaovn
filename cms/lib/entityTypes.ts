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
  BasketIcon,
  StarIcon,
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
  /** Entity type tiếng Anh (dùng cho SEO, JSON-LD) */
  entityTypeEn: string
  /** Phân nhóm để hiển thị có tổ chức trong menu */
  group: 'destination' | 'place' | 'stay' | 'dining' | 'activity' | 'event' | 'content' | 'system'
  /** Icon từ @sanity/icons */
  icon: ComponentType
  /** Có phải là entity có thể cào nội dung không */
  scrapable: boolean
  /** Slug segment trong URL front-end (đồng bộ với ROUTE_MAP) */
  routeSegment?: string
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
    routeSegment: 'nha-trang',
  },

  // === ĐỊA DANH & THAM QUAN ===
  {
    schemaType: 'place',
    labelVi: 'Địa danh',
    entityTypeEn: 'Place',
    group: 'place',
    icon: PinIcon,
    scrapable: true,
    routeSegment: 'dia-danh',
  },
  {
    schemaType: 'attraction',
    labelVi: 'Điểm tham quan',
    entityTypeEn: 'TouristAttraction',
    group: 'place',
    icon: TagIcon,
    scrapable: true,
    routeSegment: 'diem-tham-quan',
  },

  // === LƯU TRÚ ===
  {
    schemaType: 'hotel',
    labelVi: 'Khách sạn',
    entityTypeEn: 'Hotel',
    group: 'stay',
    icon: HomeIcon,
    scrapable: true,
    routeSegment: 'khach-san',
  },
  {
    schemaType: 'resort',
    labelVi: 'Resort',
    entityTypeEn: 'Resort',
    group: 'stay',
    icon: SunIcon,
    scrapable: true,
    routeSegment: 'resort',
  },

  // === ẨM THỰC ===
  {
    schemaType: 'restaurant',
    labelVi: 'Nhà hàng',
    entityTypeEn: 'Restaurant',
    group: 'dining',
    icon: BasketIcon,
    scrapable: true,
    routeSegment: 'nha-hang',
  },
  {
    schemaType: 'specialty',
    labelVi: 'Đặc sản',
    entityTypeEn: 'Specialty',
    group: 'dining',
    icon: StarIcon,
    scrapable: true,
    routeSegment: 'dac-san',
  },

  // === HOẠT ĐỘNG ===
  {
    schemaType: 'experience',
    labelVi: 'Trải nghiệm',
    entityTypeEn: 'TouristExperience',
    group: 'activity',
    icon: RocketIcon,
    scrapable: false,
    routeSegment: 'trai-nghiem',
  },
  {
    schemaType: 'tour',
    labelVi: 'Tour',
    entityTypeEn: 'Tour',
    group: 'activity',
    icon: BoltIcon,
    scrapable: true,
    routeSegment: 'tour',
  },

  // === SỰ KIỆN & TỔ CHỨC ===
  {
    schemaType: 'event',
    labelVi: 'Sự kiện',
    entityTypeEn: 'Event',
    group: 'event',
    icon: CalendarIcon,
    scrapable: false,
    routeSegment: 'su-kien',
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
    routeSegment: 'bai-viet',
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
