// Dịch MỘT field localized — gọi extractProse (synthesis/llm), KHÔNG gọi provider trực tiếp (R1).
// Bảo toàn cấu trúc tuyệt đối (R3): LLM chỉ thấy/trả mảng chuỗi phẳng, mọi _key/_type/markDefs/marks
// do CODE giữ nguyên khi ghép lại — không giao cấu trúc cho LLM tự suy đoán.
import { extractProse } from '../synthesis/llm/index'
import { TRANSLATE_INSTRUCTION } from './prompt'

const INSTRUCTION = TRANSLATE_INSTRUCTION

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese (Simplified)',
  ko: 'Korean',
  ru: 'Russian',
}

export interface TranslateResult {
  value: any
  provider?: string | null
  warning?: string
}

type Shape = 'empty' | 'string' | 'stringArray' | 'portableText' | 'objectArray' | 'object' | 'unknown'

// Nguồn duy nhất cho điều kiện "field trống" — batch.ts import lại, không định nghĩa bản thứ hai.
export function isFieldEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value as object).length === 0) return true
  return false
}

function detectShape(value: unknown): Shape {
  if (isFieldEmptyValue(value)) return 'empty'
  if (typeof value === 'string') return 'string'
  if (Array.isArray(value)) {
    if (value.every(v => typeof v === 'string')) return 'stringArray'
    if (value.some((v: any) => v && typeof v === 'object' && v._type === 'block')) {
      if (value.every((v: any) => v && typeof v === 'object' && typeof v._type === 'string')) {
        return 'portableText'
      }
      return 'unknown'
    }
    if (value.every(v => v && typeof v === 'object' && '_key' in (v as object))) return 'objectArray'
    return 'unknown'
  }
  if (typeof value === 'object') return 'object'
  return 'unknown'
}

async function translateTexts(
  fieldName: string,
  texts: string[],
  targetLang: string,
): Promise<{ translations: string[] | null; provider: string | null; warning?: string }> {
  if (texts.length === 0) return { translations: [], provider: null }

  const langName = LANG_NAMES[targetLang] || targetLang
  const content = JSON.stringify({ field: fieldName, targetLang, targetLangName: langName, texts })
  const result = await extractProse(INSTRUCTION, content)

  if (!result.data) {
    return { translations: null, provider: null, warning: `${fieldName}: ${result.warnings.join('; ') || 'không provider trả kết quả'}` }
  }

  const translations = (result.data as any).translations
  if (!Array.isArray(translations) || translations.length !== texts.length) {
    return { translations: null, provider: result.provider, warning: `${fieldName}: số phần tử dịch lệch nguồn (${Array.isArray(translations) ? translations.length : 'n/a'} != ${texts.length})` }
  }
  if (!translations.every(t => typeof t === 'string')) {
    return { translations: null, provider: result.provider, warning: `${fieldName}: phần tử dịch không phải chuỗi` }
  }

  return { translations, provider: result.provider }
}

function structureMatchesPortableText(original: any[], translated: any[]): boolean {
  if (original.length !== translated.length) return false
  for (let i = 0; i < original.length; i++) {
    const o = original[i]
    const t = translated[i]
    if (o._key !== t._key || o._type !== t._type) return false
    if (o._type === 'block') {
      if (o.style !== t.style) return false
      if (JSON.stringify(o.markDefs || []) !== JSON.stringify(t.markDefs || [])) return false
      const oc = o.children || []
      const tc = t.children || []
      if (oc.length !== tc.length) return false
      for (let j = 0; j < oc.length; j++) {
        if (oc[j]._key !== tc[j]._key || oc[j]._type !== tc[j]._type) return false
        if (JSON.stringify(oc[j].marks || []) !== JSON.stringify(tc[j].marks || [])) return false
      }
    }
  }
  return true
}

export async function translateField(
  fieldName: string,
  viValue: unknown,
  targetLang: string,
): Promise<TranslateResult> {
  const shape = detectShape(viValue)

  switch (shape) {
    case 'empty':
      return { value: null }

    case 'string': {
      const { translations, provider, warning } = await translateTexts(fieldName, [viValue as string], targetLang)
      if (!translations) return { value: null, provider, warning }
      return { value: translations[0], provider }
    }

    case 'stringArray': {
      const arr = viValue as string[]
      const { translations, provider, warning } = await translateTexts(fieldName, arr, targetLang)
      if (!translations) return { value: null, provider, warning }
      return { value: translations, provider }
    }

    case 'portableText': {
      const blocks = viValue as any[]
      const spanRefs: { text: string }[] = []
      for (const block of blocks) {
        if (block?._type !== 'block' || !Array.isArray(block.children)) continue
        for (const child of block.children) {
          if (child?._type === 'span' && typeof child.text === 'string') spanRefs.push(child)
        }
      }
      const texts = spanRefs.map(s => s.text)
      const { translations, provider, warning } = await translateTexts(fieldName, texts, targetLang)
      if (!translations) return { value: null, provider, warning }

      const cloned = JSON.parse(JSON.stringify(blocks))
      let i = 0
      for (const block of cloned) {
        if (block?._type !== 'block' || !Array.isArray(block.children)) continue
        for (const child of block.children) {
          if (child?._type === 'span' && typeof child.text === 'string') {
            child.text = translations[i]
            i += 1
          }
        }
      }

      if (!structureMatchesPortableText(blocks, cloned)) {
        return { value: null, provider, warning: `${fieldName}: cấu trúc lệch nguồn sau dịch (portable text), đã bỏ field` }
      }
      return { value: cloned, provider }
    }

    case 'objectArray': {
      const items = viValue as Record<string, any>[]
      const positions: { itemIndex: number; key: string }[] = []
      const texts: string[] = []
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx]
        for (const key of Object.keys(item)) {
          if (key === '_key' || key === '_type') continue
          if (typeof item[key] === 'string' && item[key].trim() !== '') {
            positions.push({ itemIndex: idx, key })
            texts.push(item[key])
          }
        }
      }
      const { translations, provider, warning } = await translateTexts(fieldName, texts, targetLang)
      if (!translations) return { value: null, provider, warning }

      const cloned = JSON.parse(JSON.stringify(items))
      positions.forEach((pos, i) => {
        cloned[pos.itemIndex][pos.key] = translations[i]
      })

      const keyMismatch = cloned.length !== items.length || cloned.some((c: any, idx: number) => c._key !== items[idx]._key)
      if (keyMismatch) {
        return { value: null, provider, warning: `${fieldName}: mất _key sau dịch (mảng object), đã bỏ field` }
      }
      return { value: cloned, provider }
    }

    case 'object': {
      const obj = viValue as Record<string, any>
      const keys = Object.keys(obj).filter(k => typeof obj[k] === 'string' && obj[k].trim() !== '')
      if (keys.length === 0) return { value: null }
      const texts = keys.map(k => obj[k])
      const { translations, provider, warning } = await translateTexts(fieldName, texts, targetLang)
      if (!translations) return { value: null, provider, warning }
      const result: Record<string, string> = {}
      keys.forEach((k, i) => { result[k] = translations[i] })
      return { value: result, provider }
    }

    default:
      return { value: null, warning: `dạng field lạ: ${fieldName}` }
  }
}
