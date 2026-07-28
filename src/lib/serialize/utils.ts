// utils.ts — Hàm tiện ích serialize JSON-LD
// Nguồn: 01-CONTENT_MODEL.md §5 (nguyên tắc serialize), schema.org

import type {
  Lang, ImageAsset, GeoPoint, FAQItem, OpeningHours, PriceView,
  KeyFact, EntityRef, JsonLdObject
} from '../types'
import { imageUrl } from '../sanity-image'
import { ROUTE_MAP } from '../routes'
import { defaultLang } from '../../site.config'

export interface EntityPageMeta {
  _type: string
  title: string
  slug: string
  summary?: string
  mainImage?: ImageAsset
  seo?: { metaTitle?: string; metaDescription?: string }
  publishedAt?: string
  updatedAt?: string
  _updatedAt?: string
  language?: string
}

// ---------- URL helpers ----------

/**
 * Đường dẫn của các entity KHÔNG nằm trong bảng route (`src/lib/routes.ts`).
 *
 * Trước 2026-07-27 chỗ này chép lại toàn bộ bảng đường dẫn, và bản chép đã lệch
 * với bản gốc. Nay chỉ giữ đúng hai mục mà bảng route không có, mọi mục còn lại
 * tra thẳng từ ROUTE_MAP (ADR-0021, trả nợ EXC-2026-001).
 *
 *  - touristDestination: nằm ngay gốc site, không có tiền tố → chuỗi rỗng
 *  - category: trang listing theo thẻ, không phải một danh mục nội dung
 */
const OFF_ROUTE_PATHS: Record<string, string> = {
  touristDestination: '',
  category: 'the-loai',
}

/**
 * Map entity _type → @type schema.org khi entity xuất hiện làm node tham chiếu
 * (containedInPlace, provider, location, organizer, about, mentions, itemList...).
 * Node tham chiếu không có @type là node "mù" với parser — Google không biết
 * nó là gì. Bảng đóng, bám bảng map @type của từng serializer (CONTENT_MODEL §2).
 */
export const TYPE_LD_MAP: Record<string, string> = {
  touristDestination: 'TouristDestination',
  place: 'Place',
  attraction: 'TouristAttraction',
  experience: 'TouristAttraction',
  restaurant: 'Restaurant',
  specialty: 'Product',
  hotel: 'Hotel',
  resort: 'Resort',
  tour: 'TouristTrip',
  organization: 'Organization',
  event: 'Event',
  article: 'Article',
  person: 'Person',
  category: 'DefinedTerm'
}

function pathForEntity(entityType: string, lang?: Lang): string {
  const route = ROUTE_MAP.find(r => r.entity === entityType)
  if (route) return route.segments[lang ?? defaultLang]
  return OFF_ROUTE_PATHS[entityType] ?? entityType
}

/** Sinh URL đầy đủ cho một entity, dùng cho @id trong JSON-LD. */
export function urlForEntity(
  baseUrl: string,
  entityType: string,
  slug: string,
  lang?: Lang
): string {
  const base = baseUrl.replace(/\/$/, '')
  const path = pathForEntity(entityType, lang)

  if (entityType === 'touristDestination') {
    if (lang && lang !== 'vi') return `${base}/${lang}/${slug}/`
    return `${base}/${slug}/`
  }

  if (entityType === 'category') {
    // Trang listing term
    if (lang && lang !== 'vi') return `${base}/${lang}/${path}/${slug}/`
    return `${base}/${path}/${slug}/`
  }

  if (lang && lang !== 'vi') {
    return `${base}/${lang}/${path}/${slug}/`
  }
  return `${base}/${path}/${slug}/`
}

// ---------- JSON-LD root ----------

/** Tạo skeleton @context + @type + @id. */
export function ldRoot(
  baseUrl: string,
  type: string | string[],
  entityType: string,
  slug: string,
  lang?: Lang
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': urlForEntity(baseUrl, entityType, slug, lang)
  }
}

/**
 * WebPage node cho trang detail entity.
 * datePublished/dateModified thuộc CreativeWork/WebPage, không thuộc các entity
 * như Resort, Place, TouristAttraction, Hotel, Restaurant, Organization...
 */
export function entityWebPageToLd(
  entity: EntityPageMeta,
  baseUrl: string,
  lang?: Lang,
  mainEntityId?: string
): Record<string, unknown> {
  const pageLang = (lang ?? entity.language) as Lang | undefined
  const pageUrl = urlForEntity(baseUrl, entity._type, entity.slug, pageLang)
  const ld: Record<string, unknown> = {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: entity.seo?.metaTitle || entity.title,
    mainEntity: { '@id': mainEntityId || pageUrl },
  }

  const description = entity.seo?.metaDescription || entity.summary
  if (description) ld['description'] = description
  if (pageLang) ld['inLanguage'] = pageLang

  // Article là document-level i18n: alt đúng ngôn ngữ document nên giữ caption;
  // entity field-level có alt đơn ngữ vi → truyền pageLang để bỏ caption trên trang non-vi (R6)
  const img = imageToLd(entity.mainImage, entity._type === 'article' ? undefined : pageLang)
  if (img) ld['primaryImageOfPage'] = img

  if (entity.publishedAt) ld['datePublished'] = entity.publishedAt
  const modified = entity._updatedAt || entity.updatedAt
  if (modified) ld['dateModified'] = modified

  return ld
}

/**
 * Giữ entity detail làm root schema chính, còn metadata trang nằm trong
 * mainEntityOfPage. Pattern này tránh phát dateModified/datePublished trên
 * entity không phải CreativeWork, nhưng vẫn để parser thấy ngay @type chính
 * như Resort/Hotel/TouristAttraction ở top-level.
 */
export function entityPageGraphToLd(
  entityLd: Record<string, unknown>,
  entity: EntityPageMeta,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const { '@context': _context, ...entityNode } = entityLd
  const pageNode = entityWebPageToLd(entity, baseUrl, lang, String(entityNode['@id'] || ''))
  return sanitizeLd({
    '@context': 'https://schema.org',
    ...entityNode,
    mainEntityOfPage: pageNode,
  })
}

// ---------- Sub-object serializers ----------

/**
 * Ảnh → ImageObject (schema.org).
 * caption lấy từ alt — alt là string đơn ngữ nhập tiếng Việt (schema baseFields),
 * nên chỉ emit trên trang vi (R6: JSON-LD một trang một ngôn ngữ). Trang non-vi
 * bỏ property caption theo pattern guard rỗng. Article là document-level i18n
 * (alt đúng ngôn ngữ document) nên caller không truyền lang để giữ caption.
 */
export function imageToLd(image: ImageAsset | undefined, lang?: Lang): Record<string, unknown> | null {
  // Dùng helper tối ưu ảnh — JSON-LD cần ảnh ≥1200px cho Google
  const url = imageUrl(image, { width: 1200 })
  if (!url) return null
  const keepCaption = !lang || lang === 'vi'
  return {
    '@type': 'ImageObject',
    url,
    caption: keepCaption ? (image?.alt ?? undefined) : undefined
  }
}

/** Gallery → mảng ImageObject. */
export function galleryToLd(images: ImageAsset[] | undefined, lang?: Lang): Record<string, unknown>[] {
  if (!images || images.length === 0) return []
  return images.map(img => imageToLd(img, lang)).filter(Boolean) as Record<string, unknown>[]
}

/**
 * mainImage + gallery → giá trị cho property `image`.
 * Google khuyến nghị image dạng mảng nhiều ảnh; property `photo` chỉ tồn tại
 * trên Place nên không dùng (CONTENT_MODEL loại photo có chủ ý ở mọi entity).
 * Dedupe theo url. Trả về 1 object khi chỉ có mainImage, mảng khi có gallery,
 * null khi không có ảnh nào.
 */
export function imagesToLd(
  main: ImageAsset | undefined,
  gallery: ImageAsset[] | undefined,
  lang?: Lang
): Record<string, unknown> | Record<string, unknown>[] | null {
  const all: Record<string, unknown>[] = []
  const seen = new Set<string>()
  for (const img of [main, ...(gallery ?? [])]) {
    const ld = imageToLd(img, lang)
    if (!ld) continue
    const url = String(ld.url)
    if (seen.has(url)) continue
    seen.add(url)
    all.push(ld)
  }
  if (all.length === 0) return null
  return all.length === 1 ? all[0] : all
}

/** GeoPoint → GeoCoordinates. */
export function geoToLd(geo: GeoPoint | undefined): Record<string, unknown> | null {
  if (!geo || geo.lat == null || geo.lng == null) return null
  return {
    '@type': 'GeoCoordinates',
    latitude: Number(geo.lat.toFixed(5)),
    longitude: Number(geo.lng.toFixed(5))
  }
}

/** Address → PostalAddress. */
export function addressToLd(
  address: { street?: string; ward?: string } | undefined
): Record<string, unknown> | null {
  if (!address) return null
  const parts: Record<string, string> = {}
  if (address.street) parts['streetAddress'] = address.street
  if (address.ward) parts['addressLocality'] = address.ward
  if (Object.keys(parts).length === 0) return null
  return { '@type': 'PostalAddress', ...parts }
}

/** FAQ → mảng Question (FAQPage render riêng). */
export function faqToLd(faq: FAQItem[] | undefined): Record<string, unknown>[] {
  if (!faq || faq.length === 0) return []
  return faq.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
}

/** FAQ → FAQPage (wrapper schema.org). */
export function faqPageToLd(
  faq: FAQItem[] | undefined,
  baseUrl: string,
  entityType: string,
  slug: string,
  lang?: Lang
): Record<string, unknown> | null {
  const questions = faqToLd(faq)
  if (questions.length === 0) return null
  return {
    '@type': 'FAQPage',
    '@id': `${urlForEntity(baseUrl, entityType, slug, lang)}#faq`,
    mainEntity: questions,
    // speakable hợp lệ trên FAQPage (subtype WebPage), không hợp lệ trên
    // Place/Product/Trip — vì vậy sống ở đây thay vì trên entity gốc.
    // Selector data-speakable do FAQ.astro render.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable]']
    }
  }
}

/** Attach resolved price offers to a JSON-LD root. */
export function applyPriceToJsonLd(
  ld: Record<string, unknown>,
  priceView: PriceView,
  bookingKey?: string
): Record<string, unknown> {
  if (!priceView || priceView.isFree || priceView.offers.length === 0) return ld

  if (priceView.offers.length === 1) {
    const offer = priceView.offers[0]
    ld['offers'] = {
      '@type': 'Offer',
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      ...(offer.name ? { name: offer.name } : {}),
      ...(bookingKey ? { identifier: bookingKey } : {}),
    }
    return ld
  }

  const prices = priceView.offers.map((offer) => offer.price)
  ld['offers'] = {
    '@type': 'AggregateOffer',
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
    offerCount: priceView.offers.length,
    priceCurrency: priceView.offers[0].priceCurrency || 'VND',
    ...(bookingKey ? { identifier: bookingKey } : {}),
  }
  return ld
}

/** OpeningHours → OpeningHoursSpecification (đơn giản hóa). */
export function openingHoursToLd(
  oh: OpeningHours | undefined
): Record<string, unknown> | null {
  if (!oh || (!oh.open && !oh.close)) return null
  const spec: Record<string, unknown> = { '@type': 'OpeningHoursSpecification' }
  if (oh.open) spec['opens'] = oh.open
  if (oh.close) spec['closes'] = oh.close
  if (oh.note) spec['description'] = oh.note
  return spec
}

/** KeyFacts → mảng PropertyValue (TouristDestination). */
export function keyFactsToLd(kf: KeyFact[] | undefined): Record<string, unknown>[] {
  if (!kf || kf.length === 0) return []
  return kf.map(f => ({
    '@type': 'PropertyValue',
    name: f.label,
    value: f.value
  }))
}

/** sameAs → mảng URL (giữ nguyên). */
export function sameAsToLd(urls: string[] | undefined): string[] {
  if (!urls || urls.length === 0) return []
  return urls.filter(u => u && u.startsWith('http'))
}

// ---------- Internal helpers ----------

/** EntityRef → URL trên site của entity được deref. */
export function refToUrl(
  baseUrl: string,
  ref: EntityRef | undefined,
  lang?: Lang
): string | null {
  if (!ref || !ref._type || !ref.slug) return null
  return urlForEntity(baseUrl, ref._type, ref.slug, lang)
}

/** Deref entity → { @type, @id, name, url } để nhúng làm reference trong JSON-LD. */
export function refToLdRef(
  baseUrl: string,
  ref: EntityRef | undefined,
  lang?: Lang
): Record<string, unknown> | null {
  if (!ref || !ref._type || !ref.slug || !ref.title) return null
  const url = urlForEntity(baseUrl, ref._type, ref.slug, lang)
  return {
    '@type': TYPE_LD_MAP[ref._type] ?? 'Thing',
    '@id': url,
    name: ref.title,
    url
  }
}

/**
 * Gỡ marker citation [cite:NN] mà module tổng hợp (LLM) để sót lại trong text.
 * Defense-in-depth: nguồn gốc được chặn ở scripts/synthesis/field-mapper.ts,
 * nhưng dữ liệu cũ trong Sanity có thể còn marker — không để lộ ra JSON-LD.
 */
export function stripCiteMarkers(text: string): string {
  return text
    .replace(/\[cite:[^\]]*\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
}

/**
 * Serialize object JSON-LD thành string để nhúng vào <script set:html>.
 * Escape `<` thành `<` — JSON.parse đọc lại đúng ký tự cũ, nhưng chuỗi
 * `</script>` trong dữ liệu (vd text cào từ web ngoài) không còn phá được tag.
 */
export function jsonLdScriptContent(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

/**
 * Làm sạch toàn bộ string trong một object JSON-LD (đệ quy).
 * Gọi ở cuối mỗi serializer: return sanitizeLd(ld).
 */
export function sanitizeLd<T>(value: T): T {
  if (typeof value === 'string') {
    return stripCiteMarkers(value) as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map(v => sanitizeLd(v)) as unknown as T
  }
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeLd(v)
    }
    return out as unknown as T
  }
  return value
}

/**
 * Nhập text field (tầng 4 như accessInfo, departureNote) vào description.
 * Theo §5.1: cấm phát property tự chế; field không có property schema.org
 * thì nhập vào description hoặc bỏ.
 */
export function portableTextToDescription(
  blocks: unknown[] | undefined
): string | undefined {
  if (!blocks || blocks.length === 0) return undefined
  // Trích xuất text thô từ portable text — phiên bản đơn giản
  const texts: string[] = []
  for (const block of blocks) {
    if (typeof block === 'object' && block !== null) {
      const b = block as Record<string, unknown>
      if (b._type === 'block' && Array.isArray(b.children)) {
        for (const child of b.children as Record<string, unknown>[]) {
          if (child._type === 'span' && typeof child.text === 'string') {
            texts.push(child.text)
          }
        }
      }
    }
  }
  return texts.length > 0 ? texts.join('\n') : undefined
}

/**
 * Tạo speakable (schema.org) từ summary và faq.
 * Dùng cho TouristDestination và Article.
 */
export function speakableToLd(
  summary: string | undefined,
  faq: FAQItem[] | undefined
): Record<string, unknown> | null {
  const parts: string[] = []
  if (summary) parts.push(summary)
  if (faq && faq.length > 0) {
    for (const item of faq) {
      parts.push(`${item.question} ${item.answer}`)
    }
  }
  if (parts.length === 0) return null
  return {
    '@type': 'SpeakableSpecification',
    cssSelector: ['[data-speakable]']
  }
}
