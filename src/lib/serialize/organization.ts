// serialize/organization.ts — JSON-LD serialize cho Organization
// Nguồn: 01-CONTENT_MODEL.md §2.9
// @type theo bảng map orgType

import { UI_COPY } from '../uiCopy'
import type { OrganizationResult, Lang } from '../types'
import {
  ldRoot, imageToLd, geoToLd, addressToLd, sameAsToLd,
  portableTextToDescription, sanitizeLd
} from './utils'

/**
 * Bảng map orgType → @type (đóng, 5.3).
 */
const ORG_TYPE_MAP: Record<string, string> = {
  travelAgency: 'TravelAgency',
  transportCompany: 'Organization',
  diveOperator: 'Organization',
  dmc: 'Organization',
  organization: 'Organization'
}

/**
 * Serialize Organization → JSON-LD Organization (hoặc TravelAgency).
 *
 * Mapping:
 *   title → name
 *   summary + body → description
 *   logo → logo (ImageObject)
 *   url → url
 *   sameAs → sameAs
 *   geo, address → geo, address
 *   telephone → telephone
 *   licenseInfo → nhập description (§5.1)
 */
export function organizationToJsonLd(
  org: OrganizationResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const ldType = ORG_TYPE_MAP[org.orgType] ?? 'Organization'
  const ld = ldRoot(baseUrl, ldType, 'organization', org.slug, lang)

  // name
  ld['name'] = org.title

  // description
  const descParts: string[] = []
  if (org.summary) descParts.push(org.summary)
  if (org.body) {
    const bodyText = portableTextToDescription(org.body)
    if (bodyText) descParts.push(bodyText)
  }
  // licenseInfo: tầng 4, nhập description (§5.1)
  const L = UI_COPY[lang ?? 'vi'] ?? UI_COPY.vi
  if (org.licenseInfo) descParts.push(`${L.license}: ${org.licenseInfo}`)
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // logo
  const logo = imageToLd(org.logo, lang)
  if (logo) ld['logo'] = logo
  // mainImage cũng có thể có
  const img = imageToLd(org.mainImage, lang)
  if (img && !logo) ld['image'] = img

  // url — guard rỗng trước khi gán (quy ước JSON-LD empty guard, CLAUDE.md §5)
  if (org.url) ld['url'] = org.url

  // sameAs
  if (org.sameAs && org.sameAs.length > 0) {
    ld['sameAs'] = sameAsToLd(org.sameAs)
  }

  // geo + address
  const geo = geoToLd(org.geo)
  if (geo) ld['geo'] = geo
  const addr = addressToLd(org.address)
  if (addr) ld['address'] = addr

  // telephone
  if (org.telephone) ld['telephone'] = org.telephone

  return sanitizeLd(ld)
}
