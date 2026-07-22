import { configureSynthesisEnv, type SynthesisEnv } from '../../scripts/synthesis/config'
import { fetchVia } from '../../scripts/synthesis/fetcher'
import { extractProse } from '../../scripts/synthesis/llm'
import { resolveStructured } from '../../scripts/synthesis/resolver-structured'
import { resolveContainedInPlace } from '../../scripts/synthesis/reference-resolver'
import { handleImage, handleImageCandidates } from '../../scripts/synthesis/image-handler'
import { normalizeI15Deep } from '../../scripts/synthesis/content-guard'
import { mapFields } from '../../scripts/synthesis/field-mapper'
import { validateOutput } from '../../scripts/synthesis/output-validator'
import { writeDraft } from '../../scripts/synthesis/writer'
import { fieldsFor, KNOWN_ENTITY_TYPES } from '../../scripts/synthesis/entity-fields'
import { onpageHarvester } from '../../scripts/synthesis/harvester-onpage'
import { harvestImageCandidates, type ImageCandidate } from '../../scripts/synthesis/rich-harvester'

export interface RunSynthesisInput {
  dryRun: boolean
  entity: string
  name: string
  urls: string[]
  env?: SynthesisEnv
  onLog?: (message: string) => void
}
export interface RunSynthesisResult {
  ok: boolean
  docId?: string
  mapped: Record<string, any>
  fields: {
    filled: string[]
    missing: string[]
  }
  validator: ReturnType<typeof validateOutput>
  warnings: string[]
  report: {
    fetchAdapter: string
    credits: number
    provider: string | null
    geoSource: string
    sameAsSource: string
    officialSourceSource: string
    addressSource: string
    containedInPlaceSource: string
    imageCandidate: string | null
    htmlImageCandidate: string | null
    imageRef: string | null
    imageUploadCount: number
    galleryImageCount: number
  }
  imageCandidates: ImageCandidate[]
  write: {
    success: boolean
    error?: string
  }
}

function pickWikipediaUrl(urls: string[]): string | undefined {
  return urls.find(u => /wikipedia\.org/i.test(u))
}

function pickWikidataId(urls: string[]): string | undefined {
  const wikidataUrl = urls.find(u => /wikidata\.org/i.test(u))
  if (!wikidataUrl) return undefined
  const match = wikidataUrl.match(/Q\d+/)
  return match ? match[0] : undefined
}

function pickVenueUrl(urls: string[]): string | undefined {
  return urls.find(u => !/wikipedia\.org|wikidata\.org/i.test(u))
}

function fieldDiff(entityType: string, mapped: Record<string, any>): string[] {
  return fieldsFor(entityType).filter(f => mapped[f] === undefined)
}

async function loadPrompt(entity: string, name: string): Promise<string> {
  const PROMPT_LOADERS: Record<string, (name: string) => Promise<string>> = {
    place: async (n) => (await import('../../scripts/synthesis/prompts/place')).buildPlacePrompt(n),
    attraction: async (n) => (await import('../../scripts/synthesis/prompts/attraction')).buildAttractionPrompt(n),
    restaurant: async (n) => (await import('../../scripts/synthesis/prompts/restaurant')).buildRestaurantPrompt(n),
    hotel: async (n) => (await import('../../scripts/synthesis/prompts/hotel')).buildHotelPrompt(n),
    resort: async (n) => (await import('../../scripts/synthesis/prompts/hotel')).buildHotelPrompt(n),
    specialty: async (n) => (await import('../../scripts/synthesis/prompts/specialty')).buildSpecialtyPrompt(n),
    tour: async (n) => (await import('../../scripts/synthesis/prompts/tour')).buildTourPrompt(n),
  }
  const loader = PROMPT_LOADERS[entity]
  if (!loader) throw new Error(`Không có prompt builder cho entity "${entity}"`)
  return loader(name)
}

export function validateSynthesisInput(input: Pick<RunSynthesisInput, 'entity' | 'name' | 'urls'>): string | null {
  if (!input.entity) return `Cần entity (${KNOWN_ENTITY_TYPES.join(' | ')})`
  if (!KNOWN_ENTITY_TYPES.includes(input.entity)) return `entity phải là một trong: ${KNOWN_ENTITY_TYPES.join(', ')}`
  if (!input.name || !input.name.trim()) return 'Cần name'
  if (!Array.isArray(input.urls) || input.urls.length === 0) return 'Cần urls'
  for (const url of input.urls) {
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) return `URL phải là http/https: ${url}`
    } catch {
      return `URL không hợp lệ: ${url}`
    }
  }
  return null
}

export async function runSynthesis(input: RunSynthesisInput): Promise<RunSynthesisResult> {
  if (input.env) configureSynthesisEnv(input.env)

  const validationError = validateSynthesisInput(input)
  if (validationError) throw new Error(validationError)

  const log = input.onLog ?? (() => {})
  const warnings: string[] = []

  log(`🔬 Synthesis — ${input.entity} "${input.name}"`)
  const extractionPrompt = await loadPrompt(input.entity, input.name)

  log('🔎 Resolver structured')
  const structured = await resolveStructured({
    wikipediaUrl: pickWikipediaUrl(input.urls),
    wikidataId: pickWikidataId(input.urls),
  })
  warnings.push(...structured.warnings)

  let bestContent = ''
  let totalCredits = 0
  let fetchAdapter = '—'
  const fetchErrors: string[] = []
  const rawHtmlByUrl = new Map<string, string>()
  const imageCandidates: ImageCandidate[] = []

  for (const url of input.urls) {
    log(`📡 Fetch content: ${url.slice(0, 80)}`)
    const result = await fetchVia(url)
    totalCredits += result.creditsUsed ?? 0
    fetchAdapter = result.sourceAdapter
    if (result.success && result.rawHtml) {
      rawHtmlByUrl.set(url, result.rawHtml)
      imageCandidates.push(...harvestImageCandidates(result.rawHtml, url))
    }
    if (result.success && result.content) {
      if (result.content.length > bestContent.length) bestContent = result.content
    } else {
      fetchErrors.push(`${url}: ${result.error}`)
    }
  }

  if (!bestContent) throw new Error(`Không URL nào trả content hợp lệ: ${fetchErrors.join('; ')}`)

  log('🤖 LLM prose')
  const prose = await extractProse(extractionPrompt, bestContent)
  warnings.push(...prose.warnings)
  let bestData = prose.data ?? {}

  const guarded = normalizeI15Deep(bestData)
  bestData = guarded.value
  if (guarded.changed) warnings.push('normalizeI15: đã chuẩn hoá cụm "thành phố Nha Trang"')

  const merged: Record<string, any> = { ...bestData }
  let geoSource = '—'
  let sameAsSource = '—'
  if (structured.geo) {
    merged.geo = structured.geo
    geoSource = 'resolver'
  } else {
    delete merged.geo
  }
  if (structured.sameAs.length > 0) {
    merged.sameAs = structured.sameAs
    sameAsSource = 'resolver'
  } else {
    delete merged.sameAs
  }

  const VENUE_TYPES = new Set(['restaurant', 'hotel', 'resort', 'tour'])
  const ADDRESS_TYPES = new Set(['restaurant', 'hotel', 'resort'])
  let harvestedAddress: { street?: string; ward?: string } | undefined
  let addressSource = '—'
  let officialSourceSource = '—'
  if (VENUE_TYPES.has(input.entity)) {
    const venueUrl = pickVenueUrl(input.urls)
    if (venueUrl) {
      log(`🏬 On-page harvester: ${venueUrl.slice(0, 80)}`)
      const harvested = await onpageHarvester.resolve({
        url: venueUrl,
        html: rawHtmlByUrl.get(venueUrl),
        name: input.name,
      })
      warnings.push(...harvested.warnings)
      if (harvested.geo) {
        merged.geo = harvested.geo
        geoSource = 'harvester'
      }
      if (harvested.officialSource) {
        merged.officialSource = harvested.officialSource
        officialSourceSource = 'harvester'
      }
      if (harvested.address && (harvested.address.street || harvested.address.ward)) {
        harvestedAddress = harvested.address
        addressSource = 'harvester'
      }
    }
  }

  if (!merged.title && input.name) merged.title = input.name
  const cipText = typeof merged.containedInPlace === 'string' ? merged.containedInPlace.trim() : ''

  const { mapped, warnings: mapperWarnings } = mapFields(input.entity, merged)
  warnings.push(...mapperWarnings)

  if (harvestedAddress && ADDRESS_TYPES.has(input.entity)) {
    const addr: { street?: string; ward?: string } = {}
    if (harvestedAddress.street) addr.street = harvestedAddress.street
    if (harvestedAddress.ward) addr.ward = harvestedAddress.ward
    if (Object.keys(addr).length > 0) mapped.address = addr
  }

  let cipSource = '(không có text)'
  if (cipText) {
    log(`🔗 Reference resolver: ${cipText}`)
    const cip = await resolveContainedInPlace(cipText)
    warnings.push(...cip.warnings)
    if (cip.ref) {
      mapped.containedInPlace = cip.ref
      cipSource = `resolved (${cip.matchedTitle})`
    } else {
      cipSource = `không resolve (${cipText})`
    }
  }

  let imageRef: string | null = null
  const htmlImageCandidate = imageCandidates[0]?.url ?? null
  let imageUploadCount = 0
  let galleryImageCount = 0
  if (imageCandidates.length > 0) {
    const img = await handleImageCandidates(imageCandidates, mapped.title?.vi ?? input.name, {
      dryRun: input.dryRun,
      sourceUrl: pickVenueUrl(input.urls),
    })
    warnings.push(...img.warnings)
    imageUploadCount = img.uploadedImageCount ?? 0
    galleryImageCount = img.gallery?.length ?? Math.max(0, imageUploadCount - 1)
    if (!input.dryRun && img.mainImage) {
      mapped.mainImage = img.mainImage
      imageRef = img.mainImage.asset._ref
    } else if (input.dryRun && imageUploadCount > 0) {
      imageRef = `would upload ${imageUploadCount} image(s) (dry-run)`
    }
    if (!input.dryRun && img.gallery && img.gallery.length > 0) {
      mapped.gallery = img.gallery
    }
    if (img.imageProvenance) mapped.imageProvenance = img.imageProvenance
  } else if (structured.imageCandidate?.commonsUrl) {
    const img = await handleImage(structured.imageCandidate.commonsUrl, mapped.title?.vi ?? input.name, {
      dryRun: input.dryRun,
    })
    warnings.push(...img.warnings)
    if (!input.dryRun && img.mainImage) {
      mapped.mainImage = img.mainImage
      imageRef = img.mainImage.asset._ref
    } else if (input.dryRun) {
      imageRef = 'would upload (dry-run)'
    }
    if (img.imageProvenance) mapped.imageProvenance = img.imageProvenance
  }

  const validator = validateOutput(input.entity, mapped)
  const writeResult = await writeDraft(input.entity, mapped, input.urls, {
    dryRun: input.dryRun,
    silent: true,
  })

  return {
    ok: writeResult.success,
    docId: writeResult.docId,
    mapped,
    fields: {
      filled: Object.keys(mapped),
      missing: fieldDiff(input.entity, mapped),
    },
    validator,
    warnings,
    report: {
      fetchAdapter,
      credits: totalCredits,
      provider: prose.provider,
      geoSource,
      sameAsSource,
      officialSourceSource,
      addressSource,
      containedInPlaceSource: cipSource,
      imageCandidate: structured.imageCandidate?.commonsUrl ?? null,
      htmlImageCandidate,
      imageRef,
      imageUploadCount,
      galleryImageCount,
    },
    imageCandidates,
    write: {
      success: writeResult.success,
      error: writeResult.error,
    },
  }
}
