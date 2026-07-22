// Enum đóng cho field phân loại (N5b) — nguồn DUY NHẤT trong module synthesis, trích NGUYÊN từ
// cms/schemas/{place,attraction,specialty}.ts (nguồn chính xác). mapper + validator cùng import từ
// đây để tránh nguồn sự thật thứ hai. KHÔNG thêm giá trị enum mới: thêm enum là cửa hai chiều,
// founder sửa CONTENT_MODEL §2.2/§2.3/§2.14 + schema trước (CLAUDE.md mục 8).
export type ClassifyField = 'placeType' | 'attractionType' | 'specialtyType'

export const CLASSIFY_ENUMS: Record<ClassifyField, readonly string[]> = {
  // cms/schemas/place.ts — placeType quyết @type schema.org (CONTENT_MODEL §2.2)
  placeType: ['beach', 'island', 'landform', 'ward', 'area'],
  // cms/schemas/attraction.ts (CONTENT_MODEL §2.3)
  attractionType: ['historic', 'temple', 'church', 'museum', 'theme-park', 'aquarium', 'mud-spa', 'market', 'park'],
  // cms/schemas/specialty.ts (CONTENT_MODEL §2.14)
  specialtyType: ['dish', 'product'],
}

// Entity → field phân loại bắt buộc (gate I12). Chỉ 3 entity này có field phân loại.
export const CLASSIFY_FIELD_BY_ENTITY: Record<string, ClassifyField> = {
  place: 'placeType',
  attraction: 'attractionType',
  specialty: 'specialtyType',
}

// Nhóm venue thương mại của attraction: cần officialSource; geo/address là optional.
// Trích từ cms/schemas/attraction.ts (validation custom của address + officialSource).
// LƯU Ý drift với spec N5b R3 (liệt kê thêm `aquarium`): schema KHÔNG xếp aquarium vào venue gate
// I3 mà vào nhóm bách khoa cần sameAs (gate I2). Theo schema vì là nguồn enum chính xác.
export const VENUE_ATTRACTION_TYPES: readonly string[] = ['theme-park', 'mud-spa', 'market', 'park']

// Chuẩn hoá + validate một giá trị phân loại từ LLM. Trả {value} nếu khớp enum đóng (đã lowercase
// + trim), hoặc {invalid} kèm chuỗi gốc nếu ngoài enum. KHÔNG đoán bừa (R2): ngoài enum coi như
// không phân loại được, để trống.
export function normalizeClassify(
  field: ClassifyField,
  raw: unknown,
): { value?: string; invalid?: string } {
  if (typeof raw !== 'string') return {}
  const cleaned = raw.toLowerCase().trim()
  if (cleaned === '') return {}
  if (CLASSIFY_ENUMS[field].includes(cleaned)) return { value: cleaned }
  return { invalid: raw }
}
