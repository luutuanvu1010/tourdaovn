import { FIELD_LABELS, PATH_LABELS } from './fieldLabels'

/**
 * Gắn nhãn tiếng Việt cho mọi trường chưa có `title`, đọc từ `fieldLabels.ts`.
 *
 * Chạy một lượt lúc đăng ký schema (xem cms/schemas/index.ts). Đi đệ quy xuống cả
 * trường lồng (`fields`) lẫn phần tử mảng (`of[].fields`), nên object nhiều tầng như
 * `itinerary[].externalStop.name` cũng được phủ.
 *
 * Ba quy tắc, theo thứ tự ưu tiên:
 *   1. Trường đã tự khai `title` trong schema → GIỮ NGUYÊN, không ghi đè.
 *   2. Khớp PATH_LABELS theo đường dẫn đầy đủ → dùng nhãn theo ngữ cảnh.
 *   3. Khớp FIELD_LABELS theo tên trường → dùng nhãn chung.
 * Không khớp gì cả thì để Sanity tự sinh nhãn tiếng Anh — và `findUnlabeledFields`
 * dưới đây sẽ chỉ ra đúng những chỗ đó.
 *
 * Sửa bản sao, không đụng object gốc: các schema dùng chung `baseFields`/`lodgingBase`
 * qua spread nên cùng một object field xuất hiện ở nhiều entity; ghi thẳng vào nó sẽ
 * làm nhãn của entity này đè lên entity khác.
 */

type AnyField = Record<string, any>

function labelFor(field: AnyField, path: string): string | undefined {
  if (field.title) return undefined // đã có nhãn riêng, tôn trọng
  return PATH_LABELS[path] ?? FIELD_LABELS[field.name]
}

function walkField(field: AnyField, path: string): AnyField {
  if (!field || typeof field !== 'object' || !field.name) return field

  const next: AnyField = { ...field }
  const label = labelFor(field, path)
  if (label) next.title = label

  if (Array.isArray(field.fields)) {
    next.fields = field.fields.map((sub: AnyField) =>
      walkField(sub, `${path}.${sub?.name}`)
    )
  }

  if (Array.isArray(field.of)) {
    next.of = field.of.map((member: AnyField) =>
      Array.isArray(member?.fields)
        ? {
            ...member,
            fields: member.fields.map((sub: AnyField) =>
              walkField(sub, `${path}[].${sub?.name}`)
            ),
          }
        : member
    )
  }

  return next
}

/** Gắn nhãn cho một document/object type. */
export function applyFieldLabels<T extends AnyField>(schema: T): T {
  if (!schema || !Array.isArray(schema.fields)) return schema
  return {
    ...schema,
    fields: schema.fields.map((f: AnyField) => walkField(f, f?.name ?? '')),
  }
}

/** Gắn nhãn cho cả danh sách schema. */
export function applyFieldLabelsAll<T extends AnyField>(schemas: T[]): T[] {
  return schemas.map((s) => applyFieldLabels(s))
}

/**
 * Liệt kê những trường vẫn chưa có nhãn tiếng Việt sau khi đã gắn.
 * Dùng để soát khi thêm trường mới — thêm trường mà quên nhãn thì hàm này chỉ ra ngay,
 * không phải mở từng màn hình trong Studio để dò.
 */
export function findUnlabeledFields(schemas: AnyField[]): string[] {
  const out: string[] = []
  const visit = (field: AnyField, path: string) => {
    if (!field?.name) return
    if (!field.title) out.push(path)
    if (Array.isArray(field.fields)) {
      field.fields.forEach((sub: AnyField) => visit(sub, `${path}.${sub?.name}`))
    }
    if (Array.isArray(field.of)) {
      field.of.forEach((member: AnyField) => {
        if (Array.isArray(member?.fields)) {
          member.fields.forEach((sub: AnyField) => visit(sub, `${path}[].${sub?.name}`))
        }
      })
    }
  }
  for (const schema of schemas) {
    if (!Array.isArray(schema?.fields)) continue
    schema.fields.forEach((f: AnyField) => visit(f, `${schema.name}.${f?.name}`))
  }
  return out
}
