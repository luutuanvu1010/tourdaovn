// Enum đóng cho field phân loại (N5b) — nguồn DUY NHẤT trong module synthesis, trích NGUYÊN từ
// cms/schemas/{place,attraction,specialty}.ts (nguồn chính xác). mapper + validator cùng import từ
// đây để tránh nguồn sự thật thứ hai. KHÔNG thêm giá trị enum mới: thêm enum là cửa hai chiều,
// founder sửa CONTENT_MODEL §2.2/§2.3/§2.14 + schema trước (CLAUDE.md mục 8).
export type ClassifyField = 'placeType' | 'attractionType' | 'specialtyType'

export const CLASSIFY_ENUMS: Record<ClassifyField, readonly string[]> = {
  // cms/schemas/place.ts — placeType quyết @type schema.org (CONTENT_MODEL §2.2)
  placeType: ['beach', 'island', 'landform', 'ward', 'area'],
  // cms/schemas/attraction.ts (CONTENT_MODEL §2.3)
  attractionType: [
    'historic', 'temple', 'church', 'museum',
    'beach', 'island', 'nature',
    'theme-park', 'aquarium', 'mud-spa', 'market', 'park',
    'craft-village', 'general',
  ],
  // cms/schemas/specialty.ts (CONTENT_MODEL §2.14)
  specialtyType: ['dish', 'product'],
}

// Entity → field phân loại bắt buộc (gate I12). Chỉ 3 entity này có field phân loại.
export const CLASSIFY_FIELD_BY_ENTITY: Record<string, ClassifyField> = {
  place: 'placeType',
  attraction: 'attractionType',
  specialty: 'specialtyType',
}

// I2 ba nhánh (01-CONTENT_MODEL §2.3 v1.0.19, QĐ-2026-08-27-03). Trích từ
// cms/schemas/attraction.ts. Drift `aquarium` đã ĐÓNG: nó thuộc nhóm venue, thống nhất
// giữa đặc tả, Studio và validator CI.
export const ENCYCLOPEDIC_ATTRACTION_TYPES: readonly string[] = ['historic', 'temple', 'church', 'museum']
export const VENUE_ATTRACTION_TYPES: readonly string[] = ['theme-park', 'aquarium', 'mud-spa', 'market', 'park']
/**
 * Cần ít nhất MỘT trong sameAs hoặc officialSource.
 * beach/island/nature nằm đây chứ không ở nhóm bách khoa: lằn ranh "tự nhiên" so với
 * "có quản lý" CẮT NGANG ba loại này. Hòn Mun và thác Tà Gụ có mục bách khoa; rừng thông
 * Khánh Sơn và Mini Beach là điểm du lịch có quản lý, chỉ có website chính thức.
 * Cổng không phân biệt được hai thứ đó nên không bắt nó đoán (QĐ-2026-08-27-03 bổ sung 1).
 */
export const EITHER_SOURCE_ATTRACTION_TYPES: readonly string[] = [
  'beach', 'island', 'nature', 'craft-village', 'general',
]

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
