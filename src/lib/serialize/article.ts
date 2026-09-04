// serialize/article.ts — JSON-LD serialize cho Article
// Nguồn: 01-CONTENT_MODEL.md §2.11
// Document-level i18n: inLanguage từ field language
// @type NewsArticle / Article theo articleType

import type { ArticleResult, Lang } from '../types'
import {
  ldRoot, imageToLd, faqPageToLd, speakableToLd,
  portableTextToDescription, refToLdRef, urlForEntity, sanitizeLd
} from './utils'

/**
 * Bảng map articleType → @type.
 */
const ARTICLE_TYPE_MAP: Record<string, string> = {
  news: 'NewsArticle',
  guide: 'Article',
  list: 'Article',
  review: 'Article',
  itinerary: 'Article',
  'transport-guide': 'Article'
}

/**
 * Serialize Article → JSON-LD Article (hoặc NewsArticle).
 *
 * Mapping:
 *   title → headline
 *   summary + body → description (hoặc articleBody)
 *   mainImage → image
 *   publishedAt → datePublished
 *   updatedAt → dateModified
 *   author → author (deref Person, kèm url, sameAs)
 *   about → about (deref entity)
 *   mentions → mentions (deref entity)
 *   language → inLanguage
 *   articleType → articleSection (property thật)
 *   faq → speakable (cùng summary)
 *   howTo → subjectOf HowTo (nếu transport-guide)
 *
 * @param article Kết quả GROQ
 * @param baseUrl Base URL
 */
export function articleToJsonLd(
  article: ArticleResult,
  baseUrl: string
): Record<string, unknown> {
  const ldType = ARTICLE_TYPE_MAP[article.articleType] ?? 'Article'
  const ld = ldRoot(baseUrl, ldType, 'article', article.slug, article.language as Lang)

  // headline
  ld['headline'] = article.title

  // description + articleBody
  if (article.summary) ld['description'] = article.summary
  if (article.body) {
    const bodyText = portableTextToDescription(article.body)
    if (bodyText) ld['articleBody'] = bodyText
  }

  // image
  const img = imageToLd(article.mainImage)
  if (img) ld['image'] = img

  // datePublished / dateModified
  if (article.publishedAt) ld['datePublished'] = article.publishedAt
  if (article._updatedAt) ld['dateModified'] = article._updatedAt

  // author — deref Person, tín hiệu E-E-A-T
  if (article.author) {
    const authorLd: Record<string, unknown> = {
      '@type': 'Person',
      '@id': urlForEntity(baseUrl, 'person', article.author.slug),
      name: article.author.title,
      url: urlForEntity(baseUrl, 'person', article.author.slug)
    }
    // sameAs từ hồ sơ thật (E-E-A-T)
    if (article.author.sameAs && article.author.sameAs.length > 0) {
      authorLd['sameAs'] = article.author.sameAs
    }
    if (article.author.jobTitle) authorLd['jobTitle'] = article.author.jobTitle
    ld['author'] = authorLd
  }

  // about
  if (article.about && article.about.length > 0) {
    ld['about'] = article.about
      .map(a => refToLdRef(baseUrl, a, article.language as Lang))
      .filter(Boolean)
  }

  // mentions
  if (article.mentions && article.mentions.length > 0) {
    ld['mentions'] = article.mentions
      .map(m => refToLdRef(baseUrl, m, article.language as Lang))
      .filter(Boolean)
  }

  // inLanguage
  ld['inLanguage'] = article.language

  // articleSection = articleType. Gán CÓ ĐIỀU KIỆN như mọi field tuỳ chọn khác trong
  // hàm này: bài thiếu articleType mà gán thẳng thì JSON-LD xuất ra `"articleSection":null`,
  // và null trong JSON-LD là dữ liệu hỏng chứ không phải giá trị rỗng — cổng I6 bắt đúng.
  // Đã có một bài như vậy lên tới production ngày 2026-09-04.
  // Nợ "bài thiếu articleType" không bị giấu: nó có cổng publish riêng (I12/I4/I7,
  // 01-CONTENT_MODEL §493). Việc của serializer chỉ là đừng xuất JSON hỏng.
  if (article.articleType) ld['articleSection'] = article.articleType

  // speakable
  const speakable = speakableToLd(article.summary, article.faq)
  if (speakable) ld['speakable'] = speakable

  // faq → subjectOf FAQPage
  const faqPage = faqPageToLd(article.faq, baseUrl, 'article', article.slug, article.language as Lang)
  if (faqPage) {
    ld['subjectOf'] = ld['subjectOf']
      ? [ld['subjectOf'], faqPage]
      : faqPage
  }

  // howTo → subjectOf HowTo (cho transport-guide)
  if (article.howTo && article.howTo.length > 0) {
    const howToLd: Record<string, unknown> = {
      '@type': 'HowTo',
      name: article.title,
      step: article.howTo.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.step,
        text: s.text
      }))
    }
    ld['subjectOf'] = ld['subjectOf']
      ? (Array.isArray(ld['subjectOf']) ? [...ld['subjectOf'] as Array<unknown>, howToLd] : [ld['subjectOf'], howToLd])
      : howToLd
  }

  // translationGroup — không xuất JSON-LD: _ref là ID nội bộ Sanity, không phải
  // URI công khai; @id chứa ID nội bộ là node rác với parser. Quan hệ bản dịch
  // đã được phát chuẩn qua hreflang alternates ở <head>.

  return sanitizeLd(ld)
}
