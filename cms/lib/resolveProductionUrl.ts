import { site } from '../../src/site.config'

const BASE_URL = site.url

const SEGMENT_MAP: Record<string, string> = {
  place: 'dia-danh',
  attraction: 'diem-tham-quan',
  experience: 'trai-nghiem',
  restaurant: 'nha-hang',
  specialty: 'dac-san',
  hotel: 'khach-san',
  resort: 'resort',
  tour: 'tour',
  event: 'su-kien',
  article: 'cam-nang',
  person: 'tac-gia',
  organization: 'cong-ty',
}

export function resolveProductionUrl(
  doc: { _type: string; slug?: { vi?: { _type?: string; current?: string } } }
): string | null {
  const slugValue = doc.slug?.vi?.current ?? null

  if (doc._type === 'touristDestination') {
    return slugValue ? `${BASE_URL}/${slugValue}/` : null
  }

  if (doc._type === 'category') return null

  const segment = SEGMENT_MAP[doc._type]
  if (!segment) return null

  if (!slugValue) return null

  return `${BASE_URL}/${segment}/${slugValue}/`
}
