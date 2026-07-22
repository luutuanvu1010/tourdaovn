// Cấu hình cổng — LÕI để trống. validate-min.ts đọc file này để chạy
// V2 (reference) và V3 (governance + field bắt buộc) trên dữ liệu thật lúc build.
//
// Lõi trống: publishableTypes rỗng => validator warn và bỏ qua V2/V3 (vẫn PASS).
// Đây là trạng thái hợp lệ: lõi chưa có entity nên chưa có gì để kiểm.
//
// Mỗi site điền 3 mục dưới cho entity của mình. Mẫu đầy đủ cho site "tourdao"
// ở scripts/examples/gate.config.tourdao.ts.

export interface RefRule {
  field: string
  to: string
}

export interface GateConfig {
  // Type có render trang, phải reviewStatus == "approved" mới được publish.
  publishableTypes: string[]
  // Field bắt buộc theo type (điều kiện completeness tối thiểu).
  requiredFields: Record<string, string[]>
  // Reference phải deref được, đúng type đích.
  references: Record<string, RefRule[]>
}

export const GATE: GateConfig = {
  publishableTypes: [],
  requiredFields: {},
  references: {},
}
