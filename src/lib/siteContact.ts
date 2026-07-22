// siteContact.ts — fetch kênh liên hệ (siteSettings.contact) độc lập,
// dùng ở nơi chưa fetch cả siteSettings (RouteDispatch, Footer). Cache
// module-level để build không lặp query cho mỗi trang.
import { getClient } from './sanity'
import type { SiteContact } from './types'

const CONTACT_QUERY = `*[_type == "siteSettings" && _id == "siteSettings"][0].contact{
  hotline,
  zaloUrl,
  whatsapp,
  email
}`

let cached: Promise<SiteContact | null> | null = null

export function fetchSiteContact(): Promise<SiteContact | null> {
  if (!cached) {
    cached = getClient()
      .fetch<SiteContact | null>(CONTACT_QUERY)
      .then((result) => result ?? null)
      .catch(() => null)
  }
  return cached
}
