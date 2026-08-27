// Đơn vị giá — enum đóng khớp SAD §3.1
export type PriceUnit = 'perPax' | 'perRoomNight' | 'perTicket'

// Dữ liệu thô từ prices.yaml
export type PriceEntry =
  | { unit: 'perPax'; amount: number }
  | { unit: 'perPax'; tiers: { maxPax: number; amount: number }[] }
  | { unit: 'perRoomNight'; from: number; asOf: string }
  | { unit: 'perTicket'; tickets: { name: string; amount: number }[] }

export type Offer = {
  price: number
  priceCurrency: 'VND'
  name?: string
  identifier?: string
}

// View model sau resolve — cho template dùng
// null = ẩn vùng giá (không CTA giả, không bookingRef, hoặc trỏ hụt)
export type PriceView = {
  label: string      // theo lang trang (PRICE_LABEL_TEMPLATES): vi "850.000₫/người", en "from 1,200,000₫/night · updated 06/2026", "Miễn phí"/"Free"...
  offers: Offer[]    // cho JSON-LD
  isFree: boolean
  asOf?: string      // tháng/năm cập nhật giá đã format theo lang (vd vi "06/2026"), gán từ resolver, không parse từ label
} | null

// ============================================================
// GROQ query result types & JSON-LD — B8.5
// Nguồn: 01-CONTENT_MODEL.md §2, cms/schemas/
// ============================================================
//
// QUY ƯỚC `| null` CHO FIELD MẢNG (SPEC-2026-08-05, hướng B)
//
// GROQ trả `null` — KHÔNG phải `undefined` — cho field không tồn tại trên document.
// Khai `?: T[]` (tức `T[] | undefined`) là nói sai sự thật, và lời nói dối đó vô hiệu
// hoá hai lớp phòng vệ cùng lúc: default của destructuring (`= []`) chỉ kích hoạt với
// `undefined`, còn `astro check` thì tin kiểu nên báo xanh. Lỗi vì vậy chỉ nổ lúc
// prerender, trên Cloudflare. Đã xảy ra ở `278b287` (HomeMetaBar, field `sameAs`).
//
// Ba hình dạng chiếu đều trả `null` khi field vắng mặt:
//   - chiếu thẳng:        `sameAs,`
//   - lọc/deref mảng:     `gallery[]{…}`, `about[]->{…}`
//   - coalesce không nền: `coalesce(faq.en, faq.vi)` → null khi CẢ HAI vắng
//
// Ngoại lệ duy nhất là sub-query `*[…]{…}`: GROQ luôn trả mảng (có thể rỗng), không bao
// giờ null. Các field đó cố ý KHÔNG mang `| null`, và có ghi chú tại chỗ.
//
// Cách xử lý ở nơi dùng: `?? []` hoặc phép kiểm chân trị. Cấm `!` và cấm `as` — hai thứ
// đó chỉ chuyển lời nói dối sang chỗ khác.
//
// Phạm vi đợt này là field MẢNG. Field vô hướng và object lồng còn nợ, xem ND-006.

// ---------- Shared primitives ----------

export type Lang = 'vi' | 'en' | 'zh' | 'ko' | 'ru'

export interface GeoPoint {
  lat: number
  lng: number
  alt?: number
}

export interface ImageAsset {
  _type: 'image'
  // GROQ deref asset->{ _id, url, metadata } (mainImageFragment/galleryFragment)
  asset: {
    _id: string
    url: string
    // Chỉ những truy vấn cần phân biệt SVG với ảnh raster mới deref field này
    // (siteSettings.branding). Sanity CDN KHÔNG biến đổi được SVG, nên
    // `imageUrl()` phải biết để không gắn tham số vô nghĩa vào URL.
    mimeType?: string
    metadata?: { dimensions?: { width: number; height: number } }
  }
  hotspot?: { x: number; y: number; width: number; height: number }
  alt?: string
}

export interface FAQItem {
  question: string
  answer: string
}


export interface NearbyEntity {
  _id: string
  _type: string
  title: string
  slug: string
  mainImage?: ImageAsset
  categoryBadge?: string
  distance?: string
}

export interface OpeningHours {
  open?: string
  close?: string
  note?: string
}

export interface KeyFact {
  label: string
  value: string
}

export interface RelatedDestination {
  name: string
  url: string
}

export interface HomepageBanner {
  _key: string
  title: string
  description?: string
  linkLabel?: string
  linkUrl?: string
  image?: ImageAsset
  variant: 'vinpearl' | 'island-tour' | 'first-time' | 'guide' | 'custom'
  theme: 'ocean' | 'sand' | 'pearl' | 'image'
  isActive: boolean
  priority: number
}

// Reference rút gọn — dùng khi deref trong GROQ
export interface EntityRef {
  _id: string
  _type: string
  title: string
  slug: string
  summary?: string
  mainImage?: ImageAsset
}

export interface HomepagePlaceCard extends EntityRef {
  _type: 'place'
  placeType?: 'province' | 'ward' | 'commune' | 'island' | 'beach' | 'landform' | 'area'
}

export interface HomepageArticleCard extends EntityRef {
  _type: 'article'
  language: Lang
  articleType: 'guide' | 'list' | 'news' | 'review' | 'itinerary' | 'transport-guide'
  publishedAt?: string
  updatedAt?: string
  author?: {
    _id: string
    title: string
    slug?: string
  }
}

/** Card điểm đến trên trang chủ — khối "Điểm đến khác" (ADR-0028). */
export interface DestinationCard extends EntityRef {
  _type: 'touristDestination'
}

// ---------- Base types cho query result ----------

// Cho entity field-level i18n (13/14 entity)
export interface BaseEntityFields {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  title: string
  slug: string
  summary: string
  mainImage?: ImageAsset
  seo?: { metaTitle?: string; metaDescription?: string }
  // `sameAs` và `inDefinedTermSet` chỉ có khi projection của truy vấn lấy — nuôi
  // additionalType (01 §2.13) và việc lọc term theo bộ. Optional để không bắt mọi
  // truy vấn phải lấy đủ.
  category?: Array<{ _id: string; name: string; termCode: string; _type: 'category'; sameAs?: string; inDefinedTermSet?: string }> | null
  reviewStatus?: 'draft' | 'inReview' | 'approved'
  approvedBy?: string
  contentProvenance?: 'human' | 'ai-t1' | 'mixed'
  publishedAt?: string
  updatedAt?: string
}

// Cho Article (document-level i18n)
export interface BaseDocEntityFields {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  title: string
  slug: string
  language: string
  translationGroup?: { _ref: string }
  summary: string
  mainImage?: ImageAsset
  seo?: { metaTitle?: string; metaDescription?: string }
  category?: Array<{ _id: string; name: string; termCode: string; _type: 'category' }> | null
  reviewStatus?: 'draft' | 'inReview' | 'approved'
  approvedBy?: string
  contentProvenance?: 'human' | 'ai-t1' | 'mixed'
  publishedAt?: string
  updatedAt?: string
}

// ---------- Entity query results (B8.5.1) ----------

export interface CategoryResult {
  _id: string
  _type: 'category'
  name: string
  description: string
  inDefinedTermSet: 'general-category' | 'experience-type' | 'tour-type'
  termCode: string
  slug?: string
  sameAs?: string
  publishedAt?: string
  updatedAt?: string
}

export interface PersonResult extends BaseEntityFields {
  _type: 'person'
  sameAs: string[] | null
  jobTitle?: string
  knowsAbout?: string[] | null
  url?: string
  bio?: unknown[] | null
  imageProvenance?: string
}

export interface TouristDestinationResult extends BaseEntityFields {
  _type: 'touristDestination'
  sameAs: string[] | null
  geo?: GeoPoint
  containedInPlaceRef: string[] | null
  body?: unknown[] | null
  keyFacts?: KeyFact[] | null
  homepageBanners?: HomepageBanner[] | null
  // homepagePlaces/homepageArticles là sub-query `*[…]` → GROQ luôn trả mảng, không null.
  homepagePlaces?: HomepagePlaceCard[]
  homepageArticles?: HomepageArticleCard[]
  highlights?: string[] | null
  faq?: FAQItem[] | null
  gallery?: ImageAsset[] | null
  featuredAttractions?: EntityRef[] | null
  featuredStays?: EntityRef[] | null
  featuredExperiences?: EntityRef[] | null
  featuredSpecialties?: EntityRef[] | null
  featuredTours?: EntityRef[] | null
  relatedDestinations?: RelatedDestination[] | null
  safetyNote?: string
  imageProvenance?: string
}

export interface TouristDestinationHubProps {
  td: TouristDestinationResult | null
  lang: Lang
  areaPlaces?: HomepagePlaceCard[]
  guideArticles?: HomepageArticleCard[]
  stampText?: string
}

export interface PlaceResult extends BaseEntityFields {
  _type: 'place'
  placeType?: 'province' | 'ward' | 'commune' | 'island' | 'beach' | 'landform' | 'area'
  sameAs: string[] | null
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  containedInPlace: EntityRef & { sameAs?: string[] | null; containedInPlaceRef?: string[] | null }
  hasMap?: string
  accessInfo?: unknown[] | null
  openingHours?: OpeningHours
  isAccessibleForFree?: boolean
  body?: unknown[] | null
  gallery?: ImageAsset[] | null
  highlights?: string[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
  // sub-query `*[…]` → luôn là mảng.
  experiences?: { title: string; slug: string; summary: string; mainImage?: ImageAsset; experienceType?: string; isAccessibleForFree?: boolean }[]
}

// ---------- B8.5.2: Attraction, Experience, Restaurant, Specialty ----------

export interface AttractionResult extends BaseEntityFields {
  _type: 'attraction'
  // 01-CONTENT_MODEL §2.3 v1.0.19 — enum đóng 14 giá trị.
  attractionType:
    | 'historic' | 'temple' | 'church' | 'museum'
    | 'beach' | 'island' | 'nature'
    | 'theme-park' | 'aquarium' | 'mud-spa' | 'market' | 'park'
    | 'craft-village' | 'general'
  sameAs?: string[] | null
  officialSource?: string
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  containedInPlace: EntityRef
  bookingRef?: { key?: string }
  openingHours?: OpeningHours
  isAccessibleForFree?: boolean
  accessInfo?: unknown[] | null
  hasMap?: string
  telephone?: string
  body?: unknown[] | null
  gallery?: ImageAsset[] | null
  highlights?: string[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
  // sub-query `*[…]` → luôn là mảng.
  experiences?: { title: string; slug: string; summary: string; mainImage?: ImageAsset; experienceType?: string; isAccessibleForFree?: boolean }[]
}

export interface ExperienceResult extends BaseEntityFields {
  _type: 'experience'
  experienceType: { _id: string; name: string; termCode: string; sameAs?: string; _type: 'category' }
  venue: EntityRef
  isAccessibleForFree?: boolean
  duration?: string
  includes?: string[] | null
  touristType?: string[] | null
  geo?: GeoPoint
  bookingRef?: { key?: string }
  body?: unknown[] | null
  gallery?: ImageAsset[] | null
  highlights?: string[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
}

export interface RestaurantResult extends BaseEntityFields {
  _type: 'restaurant'
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  officialSource: string
  sameAs?: string[] | null
  servesCuisine?: string[] | null
  servesSpecialty?: EntityRef[] | null
  containedInPlace: EntityRef
  openingHours?: OpeningHours
  acceptsReservations?: boolean
  hasMenu?: string
  telephone?: string
  body?: unknown[] | null
  gallery?: ImageAsset[] | null
  highlights?: string[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
}

export interface SpecialtyResult extends BaseEntityFields {
  _type: 'specialty'
  specialtyType: 'dish' | 'product'
  sameAs: string[] | null
  originNote?: string
  season?: string
  whereToTry?: EntityRef[] | null
  body?: unknown[] | null
  gallery?: ImageAsset[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
}
// ---------- B8.5.3: Hotel, Resort, Tour, Organization, Event, Article ----------

export interface HotelResult extends BaseEntityFields {
  _type: 'hotel'
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  officialSource: string
  sameAs?: string[] | null
  starRating?: number
  amenityFeature?: string[] | null
  checkinTime?: string
  checkoutTime?: string
  numberOfRooms?: number
  petsAllowed?: boolean
  containedInPlace: EntityRef
  bookingRef?: { key?: string }
  beachAccess?: string
  accessInfo?: unknown[] | null
  body?: unknown[] | null
  gallery?: ImageAsset[] | null
  highlights?: string[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
}

export interface ResortResult extends BaseEntityFields {
  _type: 'resort'
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  officialSource: string
  sameAs?: string[] | null
  starRating?: number
  amenityFeature?: string[] | null
  checkinTime?: string
  checkoutTime?: string
  numberOfRooms?: number
  petsAllowed?: boolean
  containedInPlace: EntityRef
  bookingRef?: { key?: string }
  beachAccess?: string
  accessInfo?: unknown[] | null
  body?: unknown[] | null
  gallery?: ImageAsset[] | null
  highlights?: string[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
  beachfront?: boolean
  onSiteActivities?: string[] | null
  landArea?: number
}

export interface TourStop {
  place?: EntityRef & { geo?: GeoPoint }
  externalStop?: { name: string; geo?: GeoPoint; sameAs?: string }
  note?: string
  durationAtStop?: string
}

export interface TourResult extends BaseEntityFields {
  _type: 'tour'
  itinerary: TourStop[] | null
  // url/officialSource của Organization (§2.9) cho CTA fallback khi tour chưa có giá
  // `licenseInfo` (§4.12): số giấy phép lữ hành của đơn vị vận hành. Đây là
  // trang chốt đơn, nên tín hiệu tin cậy này phải nằm cạnh nút đặt.
  operator: (EntityRef & { url?: string; officialSource?: string; licenseInfo?: string | null }) | null
  tourFormat: 'join-in' | 'private' | 'both'
  tripOrigin?: EntityRef & { geo?: GeoPoint }
  departureNote?: string
  duration?: string
  includes?: string[] | null
  excludes?: string[] | null
  touristType?: string[] | null
  seasonNote?: string
  bookingRef?: { key?: string }
  body?: unknown[] | null
  gallery?: ImageAsset[] | null
  highlights?: string[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
}

export interface OrganizationResult extends BaseEntityFields {
  _type: 'organization'
  orgType: 'travelAgency' | 'transportCompany' | 'diveOperator' | 'dmc' | 'organization'
  url: string
  officialSource: string
  sameAs?: string[] | null
  logo?: ImageAsset
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  telephone?: string
  licenseInfo?: string
  body?: unknown[] | null
  imageProvenance?: string
}

export interface EventResult extends BaseEntityFields {
  _type: 'event'
  eventType: 'festival' | 'sports' | 'music' | 'food' | 'exhibition' | 'other'
  startDate: string
  endDate?: string
  location: EntityRef
  organizer?: EntityRef
  eventStatus?: 'EventScheduled' | 'EventPostponed' | 'EventRescheduled' | 'EventCancelled'
  isAccessibleForFree?: boolean
  bookingRef?: { key?: string }
  ticketUrl?: string
  body?: unknown[] | null
  gallery?: ImageAsset[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
}

export interface ArticleResult extends BaseDocEntityFields {
  _type: 'article'
  articleType: 'guide' | 'list' | 'news' | 'review' | 'itinerary' | 'transport-guide'
  author: EntityRef & { sameAs?: string[] | null; url?: string; jobTitle?: string }
  body?: unknown[] | null
  about?: EntityRef[] | null
  mentions?: EntityRef[] | null
  faq?: FAQItem[] | null
  howTo?: Array<{ step: string; text: string }> | null
  imageProvenance?: string
}

// siteSettings singleton
export interface SiteSettingsSection {
  _key: string
  key: string
  hidden: boolean
}

export interface SiteContact {
  hotline?: string
  zaloUrl?: string
  whatsapp?: string
  email?: string
}

// Điểm đón khách (CONTENT_MODEL §2.15 v1.0.13) — thứ tự trong mảng LÀ thứ tự lộ trình.
export interface PickupPoint {
  _key: string
  stopName?: string
  stopAddress?: string
  geo?: GeoPoint
  pickupTime?: string
  pickupNote?: string
  hidden?: boolean
}

// Nội dung trang /ho-tro (CONTENT_MODEL §2.15 v1.0.14, ADR-0023).
// Ba phần độc lập — phần nào null thì khối đó không render và node JSON-LD
// tương ứng không phát.
export interface SiteSupport {
  bookingGuide: Array<{ step?: string; text?: string }> | null
  cancellationPolicy: unknown[] | null
  faq: FAQItem[] | null
}

/** Bộ giao diện — enum đóng, xem 07-DESIGN_TOKENS §1b. */
export type SiteTheme = 'bien-sau' | 'cat-bien' | 'ngoc-lam'

/** Một ô trong dải số liệu. `value` là CHUỖI — xem CONTENT_MODEL §2.15 v1.0.16. */
export interface SiteStat {
  value?: string
  label?: string
  note?: string
}

export interface SitePartner {
  name?: string
  logo?: ImageAsset
  url?: string
}

/** Đánh giá khách. KHÔNG serialize ra JSON-LD — xem QĐ-2026-08-06-09. */
export interface SiteTestimonial {
  quote?: string
  authorName?: string
  authorNote?: string
  sourceName?: string
  sourceUrl?: string
}

export interface SiteGroupQuote {
  heading?: string
  text?: string
  ctaLabel?: string
}

/**
 * Ảnh nhận diện thương hiệu (CONTENT_MODEL §2.15 v1.0.17).
 *
 * Ranh giới với `brand` trong `src/site.config.ts` (ADR-0021 QĐ8): CHỮ thương
 * hiệu — tên, tên pháp nhân, mô tả — ở lại file config vì nó vào JSON-LD và thẻ
 * meta của mọi trang, phải cố định lúc build. ẢNH thương hiệu ở Sanity vì site
 * chỉ tham chiếu chúng bằng URL; biên tập viên đổi ảnh không đổi cấu trúc trang
 * nào. Xem QĐ-2026-08-14-01.
 *
 * Field nào trống thì lớp dự phòng trong code gánh — site không vỡ.
 */
export interface SiteBranding {
  logo?: ImageAsset
  /** Ẩn chữ tên site cạnh logo. Chỉ có hiệu lực khi ĐÃ có `logo`. */
  hideWordmark?: boolean
  favicon?: ImageAsset
  ogImage?: ImageAsset
}

/**
 * Chữ và ảnh của Hero trang chủ (CONTENT_MODEL §2.15 v1.0.18, QĐ-2026-08-14-03).
 *
 * Ranh giới với `brand` trong `src/site.config.ts`: đây là chữ NGƯỜI ĐỌC thấy.
 * Chữ MÁY đọc — `brand.name`, `brand.legalName`, và `brand.description` khi nó
 * làm `<meta name="description">` — vẫn cố định lúc build. Hệ quả có chủ ý:
 * `summary` ở đây CÓ THỂ khác meta description của trang chủ.
 *
 * Sáu ô chữ trong `hero`/`footer` là TIẾNG VIỆT (một tầng, không phải object 5
 * ngôn ngữ). Nơi render phải bỏ qua chúng khi `lang !== 'vi'` và dùng bản dịch
 * trong HOME_COPY/uiCopy — xem `heroCopy()` trong SiteHome.astro.
 */
export interface SiteHero {
  eyebrow?: string
  heading?: string
  summary?: string
  image?: ImageAsset
  imageCredit?: string
  ctaPrimaryLabel?: string
  ctaSecondaryLabel?: string
}

/** Một huy hiệu ở chân trang: chứng nhận, logo thanh toán, hoặc mạng xã hội. */
export interface SiteFooterBadge {
  _key: string
  kind?: 'chung-nhan' | 'thanh-toan' | 'mang-xa-hoi'
  image?: ImageAsset
  alt?: string
  url?: string
}

/**
 * Chữ và ảnh chân trang (CONTENT_MODEL §2.15 v1.0.18, QĐ-2026-08-14-03).
 *
 * Tiêu đề cột và danh sách liên kết CỐ Ý không có ở đây — chúng sinh từ
 * `ROUTE_MAP` (ADR-0023). Đưa vào Sanity là dựng nguồn thứ hai cho điều hướng.
 */
export interface SiteFooter {
  tagline?: string
  disclaimer?: string
  backgroundImage?: ImageAsset
  badges?: SiteFooterBadge[]
}

// `branding` và `footer` CỐ Ý không có trong kiểu này — chúng được đọc qua đúng
// một đường, `fetchSiteBranding()` / `fetchSiteFooter()`, không qua
// `siteSettingsQuery()`. Lý do: cả hai render ở MỌI trang, còn truy vấn đầy đủ
// chỉ chạy ở trang chủ. `hero` thì ngược lại — chỉ trang chủ có, nên đi cùng
// truy vấn đầy đủ, không cần đường đọc riêng. Xem ghi chú ở BRANDING_PROJECTION
// trong src/lib/queries/siteSettings.ts.
export interface SiteSettingsResult {
  title: string
  theme: SiteTheme | null
  sections: SiteSettingsSection[] | null
  hero: SiteHero | null
  contact: SiteContact | null
  pickupPoints: PickupPoint[] | null
  support: SiteSupport | null
  stats: SiteStat[] | null
  partners: SitePartner[] | null
  testimonials: SiteTestimonial[] | null
  groupQuote: SiteGroupQuote | null
}

// ---------- JSON-LD ----------

export interface JsonLdObject {
  '@context': string
  '@type': string | string[]
  '@id'?: string
  [key: string]: unknown
}
