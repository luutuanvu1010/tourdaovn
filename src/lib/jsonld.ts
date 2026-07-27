import type { JsonLdObject as JsonLd } from './types'

// Gán property JSON-LD an toàn: bỏ qua string rỗng, mảng rỗng, null/undefined.
// Mảng rỗng và string rỗng trong JSON-LD gây invalid schema.org.
export function put(ld: JsonLd, key: string, value: unknown): void {
  if (value == null) return
  if (typeof value === 'string' && value.trim() === '') return
  if (Array.isArray(value) && value.length === 0) return
  ld[key] = value
}

// Tạo node JSON-LD với @context + @type, rồi gán các field không rỗng.
export function ldNode(type: string | string[], fields: Record<string, unknown> = {}): JsonLd {
  const ld: JsonLd = { '@context': 'https://schema.org', '@type': type }
  for (const [k, v] of Object.entries(fields)) put(ld, k, v)
  return ld
}

export function serialize(ld: JsonLd | JsonLd[]): string {
  return JSON.stringify(ld)
}
