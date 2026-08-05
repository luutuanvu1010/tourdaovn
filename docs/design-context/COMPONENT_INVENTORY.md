# Danh mục component — Tour Đảo

> File sinh tự động bởi `scripts/gen-component-inventory.mjs`. Không sửa tay.
> Sinh lại: `npm run gen:design-context`

Hợp đồng API của thư viện component đang chạy production. Mỗi mục là interface
`Props` nguyên văn trong code, không diễn giải lại.

## Primitive dùng chung (27)

### AuthorityMeta

`src/components/AuthorityMeta.astro`

```ts
export interface Props {
  data: {
    _updatedAt?: string
    updatedAt?: string
    approvedBy?: string
    contentProvenance?: 'human' | 'ai-t1' | 'mixed'
    officialSource?: string
    sameAs?: string[]
    author?: { title?: string; url?: string; sameAs?: string[] }
  }
  lang: Lang
}
```

### Body

`src/components/Body.astro`

```ts
export interface Props {
  blocks: any[] | undefined
  class?: string
}
```

### BookingCTA

`src/components/BookingCTA.astro`

```ts
export interface Props {
  /** Nhãn giá; bỏ trống ở variant fallback (chỉ có nút trỏ nguồn chính thức). */
  priceText?: string
  ctaUrl?: string
  ctaLabel: string
  asOf?: string
}
```

### Breadcrumb

`src/components/Breadcrumb.astro`

```ts
export interface Props {
  containedInPlace?: EntityRef
  entityType: string
  lang: Lang
  hubEntity?: string
  currentTitle?: string
  inverse?: boolean
}
```

### Card

`src/components/Card.astro`

```ts
export interface Props {
  title: string;
  summary: string;
  href: string;
  image?: string;
  imageAlt?: string;
  badge?: string;
  badgeVariant?: 'default' | 'author' | 'free' | 'past';
  priceLabel?: string;
  authorLabel?: string;
}
```

### ContactCTA

`src/components/ContactCTA.astro`

```ts
export interface Props {
  telephone: string
  lang: Lang
}
```

### ContactChannels

`src/components/ContactChannels.astro`

```ts
export interface Props {
  contact?: SiteContact | null
  lang: Lang
}
```

### DetailLayout

`src/components/DetailLayout.astro`

```ts
export interface Props {
  title: string
  lang: Lang
  entityType: string
  image?: string | ImageAsset
  gallery?: ImageAsset[]
  containedInPlace?: EntityRef
  infoBarItems?: InfoBarItem[]
  sidebarSlots: Slot[]
  nearbyTitle: string
  nearby: NearbyEntity[]
  updatedAt: string
}
```

Type phụ trợ:

```ts
export interface InfoBarItem {
  icon: string
  label: string
  value: string
  visible: boolean
} // khai ở InfoBar.astro
export interface Slot {
  name: string
  component: 'BookingCTA' | 'InfoCard' | 'Map' | 'Article' | 'custom'
  visible: boolean
  props: Record<string, any>
} // khai ở Sidebar.astro
```

### EmptyState

`src/components/EmptyState.astro`

```ts
export interface Props {
  entityType: string
  lang: Lang
  message?: string
}
```

### FAQ

`src/components/FAQ.astro`

```ts
export interface Props {
  faq: FAQItem[]
  heading?: string
  lang?: Lang
  contained?: boolean
}
```

### Footer

`src/components/Footer.astro`

```ts
export interface Props {
  lang?: string
}
```

### Gallery

`src/components/Gallery.astro`

```ts
export interface Props {
  images: ImageAsset[]
  lang?: Lang
}
```

### Header

`src/components/Header.astro`

```ts
export interface Props {
  currentPath?: string;
  lang?: string;
  /**
   * Map ngôn ngữ → URL bản dịch CÓ THẬT cho trang hiện tại. Ngôn ngữ vắng trong map =
   * chưa có bản dịch (track QĐ3) → render disable, KHÔNG link chết (audit G5, prompt R5).
   */
  alternates?: Record<string, string>;
}
```

### Hero

`src/components/Hero.astro`

```ts
export interface Props {
  image?: string | ImageAsset
  gallery?: ImageAsset[]
  imageAlt?: string
}
```

### InfoBar

`src/components/InfoBar.astro`

```ts
export interface Props {
  items: InfoBarItem[]
}
```

Type phụ trợ:

```ts
export interface InfoBarItem {
  icon: string
  label: string
  value: string
  visible: boolean
}
```

### InfoCard

`src/components/InfoCard.astro`

```ts
export interface Props {
  rows: InfoRow[]
  lang?: Lang
}
```

Type phụ trợ:

```ts
export interface InfoRow {
  icon: string
  label: string
  value: string
  href?: string
  visible: boolean
}
```

### MapView

`src/components/MapView.astro`

```ts
export interface Props {
  geo: { lat: number; lng: number }
  title: string
  height?: number
  markers?: { lat: number; lng: number; title: string }[]
}
```

### NearbySection

`src/components/NearbySection.astro`

```ts
export interface Props {
  title: string
  entities: NearbyEntity[]
  viewAllUrl?: string
  lang?: Lang
}
```

### PriceDisplay

`src/components/PriceDisplay.astro`

```ts
export interface Props {
  bookingRef?: { key?: string }
  isAccessibleForFree?: boolean
  entityType: string
  lang: Lang
}
```

### RouteDispatch

`src/components/RouteDispatch.astro`

```ts
export interface Props {
  kind: 'detail' | 'index' | 'hub' | 'term' | 'destination' | 'notfound'
  entity: string
  slug?: string
  lang: Lang
}
```

### RouteMap

`src/components/RouteMap.astro`

```ts
export interface Props {
  points: PickupPoint[]
  height?: number
}
```

### Section

`src/components/Section.astro`

```ts
export interface Props {
  heading?: string
  id?: string
  contained?: boolean
}
```

### Sidebar

`src/components/Sidebar.astro`

```ts
export interface Props {
  slots: Slot[]
}
```

Type phụ trợ:

```ts
export interface Slot {
  name: string
  component: 'BookingCTA' | 'InfoCard' | 'Map' | 'Article' | 'custom'
  visible: boolean
  props: Record<string, any>
}
```

### SiteHome

`src/components/SiteHome.astro`

```ts
export interface Props {
  td: TouristDestinationResult | null
  lang: Lang
  destinationHref: string
  config: SiteSettingsResult | null
}
```

### SkeletonCard

`src/components/SkeletonCard.astro`

```ts
export interface Props {
  count?: number
}
```

### TouristDestinationHub

`src/components/TouristDestinationHub.astro`

```ts
export interface Props extends TouristDestinationHubProps {}
```

### WaveDivider

`src/components/WaveDivider.astro`

```ts
export interface Props {
  fill?: string     // CSS color value, mặc định --c-primary
  flip?: boolean    // lật ngược wave (dùng cho top của hubs section)
  opacity?: number  // opacity của wave, mặc định 0.08
  noSecond?: boolean // bỏ wave thứ hai (đường mờ hơn)
}
```

## Template entity detail (13)

### ArticleDetail

`src/components/ArticleDetail.astro`

```ts
export interface Props {
  data: ArticleResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### AttractionDetail

`src/components/AttractionDetail.astro`

```ts
export interface Props {
  data: AttractionResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### EventDetail

`src/components/EventDetail.astro`

```ts
export interface Props {
  data: EventResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### ExperienceDetail

`src/components/ExperienceDetail.astro`

```ts
export interface Props {
  data: ExperienceResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

### HotelDetail

`src/components/HotelDetail.astro`

```ts
export interface Props {
  data: HotelResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

### LodgingDetail

`src/components/LodgingDetail.astro`

```ts
export interface Props {
  data: HotelResult | ResortResult
  entityType: 'hotel' | 'resort'
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

### OrganizationDetail

`src/components/OrganizationDetail.astro`

```ts
export interface Props {
  data: OrganizationResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### PersonDetail

`src/components/PersonDetail.astro`

```ts
export interface Props {
  data: PersonResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### PlaceDetail

`src/components/PlaceDetail.astro`

```ts
export interface Props {
  data: PlaceResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### ResortDetail

`src/components/ResortDetail.astro`

```ts
export interface Props {
  data: ResortResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

### RestaurantDetail

`src/components/RestaurantDetail.astro`

```ts
export interface Props {
  data: RestaurantResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### SpecialtyDetail

`src/components/SpecialtyDetail.astro`

```ts
export interface Props {
  data: SpecialtyResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### TourDetail

`src/components/TourDetail.astro`

```ts
export interface Props {
  data: TourResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

## Trang danh sách (5)

### EntityIndex

`src/components/EntityIndex.astro`

```ts
export interface Props {
  entities: ListingEntity[]
  entityType: string
  lang: Lang
  title: string
  description: string
  terms?: { name: string; slug: string }[]
  totalCount?: number
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface ListingEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  attractionType?: string
  experienceType?: string
  servesCuisine?: string[]
  specialtyType?: string
  starRating?: number
  tourFormat?: string
  articleType?: string
  bookingRef?: { key?: string }
  author?: { title: string }
}
```

### EventIndex

`src/components/EventIndex.astro`

```ts
export interface Props {
  upcoming: EventEntity[]
  past: EventEntity[]
  lang: Lang
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface EventEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  eventType: string
  startDate: string
  bookingRef?: { key?: string }
}
```

### HubIndex

`src/components/HubIndex.astro`

```ts
export interface Props {
  sections: HubSection[]
  lang: Lang
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface HubSection {
  title: string
  description?: string
  entityType: string
  entities: ListingEntity[]
  href?: string
}
interface ListingEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  attractionType?: string
  experienceType?: string
  servesCuisine?: string[]
  specialtyType?: string
  starRating?: number
  tourFormat?: string
  articleType?: string
  bookingRef?: { key?: string }
  author?: { title: string }
} // khai ở EntityIndex.astro
```

### TermIndex

`src/components/TermIndex.astro`

```ts
export interface Props {
  term: TermData
  entities: ListingEntity[]
  entityType: 'experience' | 'tour'
  lang: Lang
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface TermData {
  name: string
  description: string
  slug: string
  sameAs?: string
}
interface ListingEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  attractionType?: string
  experienceType?: string
  servesCuisine?: string[]
  specialtyType?: string
  starRating?: number
  tourFormat?: string
  articleType?: string
  bookingRef?: { key?: string }
  author?: { title: string }
} // khai ở EntityIndex.astro
```

### TourIndex

`src/components/TourIndex.astro`

```ts
export interface Props {
  tours: TourEntity[]
  terms: { name: string; slug: string }[]
  lang: Lang
  title?: string
  description?: string
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface TourEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  tourFormat?: string
  bookingRef?: { key?: string }
}
```

## Trang chủ (9)

### HomeAreaGrid

`src/components/HomeAreaGrid.astro`

```ts
export interface Props {
  places?: HomepagePlaceCard[]
  lang: Lang
  heading: string
  viewAllLabel: string
  viewAllHref?: string
}
```

### HomeBannerGrid

`src/components/HomeBannerGrid.astro`

```ts
export interface Props {
  banners?: HomepageBanner[]
  lang: Lang
}
```

### HomeFacts

`src/components/HomeFacts.astro`

```ts
export interface Props {
  facts?: KeyFact[]
}
```

### HomeGuideGrid

`src/components/HomeGuideGrid.astro`

```ts
export interface Props {
  articles?: HomepageArticleCard[]
  lang: Lang
  heading: string
  viewAllLabel: string
  viewAllHref?: string
}
```

### HomeHero

`src/components/HomeHero.astro`

```ts
export interface Props {
  title: string
  summary?: string
  image?: string | ImageAsset
  imageAlt?: string
  eyebrow?: string
  imageCredit?: string
  stampText?: string
  stampYear?: string
}
```

### HomeHubGrid

`src/components/HomeHubGrid.astro`

```ts
export interface Props {
  lang: Lang
  hubCounts?: Record<string, number>
}
```

### HomeMetaBar

`src/components/HomeMetaBar.astro`

```ts
export interface Props {
  // Sanity trả null cho field mảng chưa đặt, không trả undefined, nên default
  // của destructuring không đỡ được. Hợp đồng phải nói rõ là nhận cả null.
  sameAs?: string[] | null
  updatedLabel?: string
  lang: Lang
}
```

### HomeRollupSection

`src/components/HomeRollupSection.astro`

```ts
export interface Props {
  heading: string
  items?: HomeCard[]
  lang: Lang
  viewAllLabel: string
  viewAllHref?: string
  badgeLabel?: string
}
```

Type phụ trợ:

```ts
type HomeCard = EntityRef | HomepagePlaceCard | HomepageArticleCard
```

### HomeTrustBar

`src/components/HomeTrustBar.astro`

```ts
export interface Props {
  items: Array<{ icon: string; title: string; description: string }>
}
```

## Module cần đính kèm để giải hết type

Các `Props` trên tham chiếu type định nghĩa ở những module sau. Đính kèm chúng
cùng inventory, nếu không thì hợp đồng API còn type treo.

- `src/lib/types.ts`

## Tổng kết

| Nhóm | Số component |
|---|---|
| Primitive dùng chung | 27 |
| Template entity detail | 13 |
| Trang danh sách | 5 |
| Trang chủ | 9 |
| **Tổng** | **54** |
