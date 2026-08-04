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
  category?: Array<{ _id: string; name: string; termCode: string; _type: 'category' }>
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
  category?: Array<{ _id: string; name: string; termCode: string; _type: 'category' }>
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
  sameAs: string[]
  jobTitle?: string
  knowsAbout?: string[]
  url?: string
  bio?: unknown[]
  imageProvenance?: string
}

export interface TouristDestinationResult extends BaseEntityFields {
  _type: 'touristDestination'
  sameAs: string[]
  geo?: GeoPoint
  containedInPlaceRef: string[]
  body?: unknown[]
  keyFacts?: KeyFact[]
  homepageBanners?: HomepageBanner[]
  homepagePlaces?: HomepagePlaceCard[]
  homepageArticles?: HomepageArticleCard[]
  highlights?: string[]
  faq?: FAQItem[]
  gallery?: ImageAsset[]
  featuredAttractions?: EntityRef[]
  featuredStays?: EntityRef[]
  featuredExperiences?: EntityRef[]
  featuredSpecialties?: EntityRef[]
  featuredTours?: EntityRef[]
  relatedDestinations?: RelatedDestination[]
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
  sameAs: string[]
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  containedInPlace: EntityRef & { sameAs?: string[]; containedInPlaceRef?: string[] }
  hasMap?: string
  accessInfo?: unknown[]
  openingHours?: OpeningHours
  isAccessibleForFree?: boolean
  body?: unknown[]
  gallery?: ImageAsset[]
  highlights?: string[]
  faq?: FAQItem[]
  imageProvenance?: string
  experiences?: { title: string; slug: string; summary: string; mainImage?: ImageAsset; experienceType?: string; isAccessibleForFree?: boolean }[]
}

// ---------- B8.5.2: Attraction, Experience, Restaurant, Specialty ----------

export interface AttractionResult extends BaseEntityFields {
  _type: 'attraction'
  attractionType: 'historic' | 'temple' | 'church' | 'museum' | 'theme-park' | 'aquarium' | 'mud-spa' | 'market' | 'park'
  sameAs?: string[]
  officialSource?: string
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  containedInPlace: EntityRef
  bookingRef?: { key?: string }
  openingHours?: OpeningHours
  isAccessibleForFree?: boolean
  accessInfo?: unknown[]
  hasMap?: string
  telephone?: string
  body?: unknown[]
  gallery?: ImageAsset[]
  highlights?: string[]
  faq?: FAQItem[]
  imageProvenance?: string
  experiences?: { title: string; slug: string; summary: string; mainImage?: ImageAsset; experienceType?: string; isAccessibleForFree?: boolean }[]
}

export interface ExperienceResult extends BaseEntityFields {
  _type: 'experience'
  experienceType: { _id: string; name: string; termCode: string; sameAs?: string; _type: 'category' }
  venue: EntityRef
  isAccessibleForFree?: boolean
  duration?: string
  includes?: string[]
  touristType?: string[]
  geo?: GeoPoint
  bookingRef?: { key?: string }
  body?: unknown[]
  gallery?: ImageAsset[]
  highlights?: string[]
  faq?: FAQItem[]
  imageProvenance?: string
}

export interface RestaurantResult extends BaseEntityFields {
  _type: 'restaurant'
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  officialSource: string
  sameAs?: string[]
  servesCuisine?: string[]
  servesSpecialty?: EntityRef[]
  containedInPlace: EntityRef
  openingHours?: OpeningHours
  acceptsReservations?: boolean
  hasMenu?: string
  telephone?: string
  body?: unknown[]
  gallery?: ImageAsset[]
  highlights?: string[]
  faq?: FAQItem[]
  imageProvenance?: string
}

export interface SpecialtyResult extends BaseEntityFields {
  _type: 'specialty'
  specialtyType: 'dish' | 'product'
  sameAs: string[]
  originNote?: string
  season?: string
  whereToTry?: EntityRef[]
  body?: unknown[]
  gallery?: ImageAsset[]
  faq?: FAQItem[]
  imageProvenance?: string
}
// ---------- B8.5.3: Hotel, Resort, Tour, Organization, Event, Article ----------

export interface HotelResult extends BaseEntityFields {
  _type: 'hotel'
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  officialSource: string
  sameAs?: string[]
  starRating?: number
  amenityFeature?: string[]
  checkinTime?: string
  checkoutTime?: string
  numberOfRooms?: number
  petsAllowed?: boolean
  containedInPlace: EntityRef
  bookingRef?: { key?: string }
  beachAccess?: string
  accessInfo?: unknown[]
  body?: unknown[]
  gallery?: ImageAsset[]
  highlights?: string[]
  faq?: FAQItem[]
  imageProvenance?: string
}

export interface ResortResult extends BaseEntityFields {
  _type: 'resort'
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  officialSource: string
  sameAs?: string[]
  starRating?: number
  amenityFeature?: string[]
  checkinTime?: string
  checkoutTime?: string
  numberOfRooms?: number
  petsAllowed?: boolean
  containedInPlace: EntityRef
  bookingRef?: { key?: string }
  beachAccess?: string
  accessInfo?: unknown[]
  body?: unknown[]
  gallery?: ImageAsset[]
  highlights?: string[]
  faq?: FAQItem[]
  imageProvenance?: string
  beachfront?: boolean
  onSiteActivities?: string[]
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
  itinerary: TourStop[]
  // url/officialSource của Organization (§2.9) cho CTA fallback khi tour chưa có giá
  operator: (EntityRef & { url?: string; officialSource?: string }) | null
  tourFormat: 'join-in' | 'private' | 'both'
  tripOrigin?: EntityRef & { geo?: GeoPoint }
  departureNote?: string
  duration?: string
  includes?: string[]
  excludes?: string[]
  touristType?: string[]
  seasonNote?: string
  bookingRef?: { key?: string }
  body?: unknown[]
  gallery?: ImageAsset[]
  highlights?: string[]
  faq?: FAQItem[]
  imageProvenance?: string
}

export interface OrganizationResult extends BaseEntityFields {
  _type: 'organization'
  orgType: 'travelAgency' | 'transportCompany' | 'diveOperator' | 'dmc' | 'organization'
  url: string
  officialSource: string
  sameAs?: string[]
  logo?: ImageAsset
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  telephone?: string
  licenseInfo?: string
  body?: unknown[]
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
  body?: unknown[]
  gallery?: ImageAsset[]
  faq?: FAQItem[]
  imageProvenance?: string
}

export interface ArticleResult extends BaseDocEntityFields {
  _type: 'article'
  articleType: 'guide' | 'list' | 'news' | 'review' | 'itinerary' | 'transport-guide'
  author: EntityRef & { sameAs?: string[]; url?: string; jobTitle?: string }
  body?: unknown[]
  about?: EntityRef[]
  mentions?: EntityRef[]
  faq?: FAQItem[]
  howTo?: Array<{ step: string; text: string }>
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

export interface SiteSettingsResult {
  title: string
  sections: SiteSettingsSection[] | null
  heroText: Record<'vi' | 'en' | 'zh' | 'ko' | 'ru', string | undefined> | null
  contact: SiteContact | null
  pickupPoints: PickupPoint[] | null
}

// ---------- JSON-LD ----------

export interface JsonLdObject {
  '@context': string
  '@type': string | string[]
  '@id'?: string
  [key: string]: unknown
}
