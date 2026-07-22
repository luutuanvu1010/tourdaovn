// serialize/resort.ts — JSON-LD serialize cho Resort
// Nguồn: 01-CONTENT_MODEL.md §2.0b, §2.7
// @type Resort (subtype LodgingBusiness)

import { UI_COPY } from '../uiCopy'
import type { ResortResult, Lang } from '../types'
import { lodgingToJsonLdBase } from './lodgingBase'
import { sanitizeLd } from './utils'

/**
 * Serialize Resort → JSON-LD Resort.
 * Dùng chung lodgingBase logic.
 * Resort-specific: beachfront, onSiteActivities, landArea.
 * - beachfront, landArea: không có property schema.org sạch, nhập description
 * - onSiteActivities: nhập amenityFeature
 */
export function resortToJsonLd(
  resort: ResortResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const ld = lodgingToJsonLdBase(resort, baseUrl, 'Resort', lang)

  const L = UI_COPY[lang ?? 'vi'] ?? UI_COPY.vi
  // Resort-specific: nối vào description
  if (resort.beachfront || resort.landArea != null) {
    const extras: string[] = []
    if (typeof resort.beachfront === 'boolean') {
      extras.push(resort.beachfront ? L.beachfront : L.notBeachfront)
    }
    if (resort.landArea != null) {
      extras.push(`${L.area}: ${resort.landArea}m²`)
    }
    if (extras.length > 0) {
      ld['description'] = (ld['description'] || '') + '\n\n' + extras.join('. ')
    }
  }

  // onSiteActivities → amenityFeature
  if (resort.onSiteActivities && resort.onSiteActivities.length > 0) {
    const activities = resort.onSiteActivities.map(a => ({
      '@type': 'LocationFeatureSpecification',
      name: a
    }))
    ld['amenityFeature'] = [
      ...(ld['amenityFeature'] as Array<unknown> || []),
      ...activities
    ]
  }

  // sanitize lại vì đã append text sau lodgingToJsonLdBase
  return sanitizeLd(ld)
}
