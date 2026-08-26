// Cấu hình cổng — LÕI để trống. validate-min.ts đọc file này để chạy
// V2 (reference) và V3 (governance + field bắt buộc) trên dữ liệu thật lúc build.
//
// PHA 0 (GÓI 2, ADR-0021): điền cho đúng 9 entity đang bật trong
// src/site.config.ts (`enabledEntities`). Trước đó file này để trống hoàn
// toàn (publishableTypes: []) nên mọi nội dung đều lọt cổng, kể cả bản nháp
// chưa duyệt — vi phạm ADR-0008. Xem docs/RA-SOAT-PHAM-VI-2026-07-27.md §Phần 1.
//
// Nguồn của requiredFields: đúng những field có `validation: Rule.required()`
// ở TẦNG NGOÀI CÙNG trong cms/schemas/<type>.ts (không suy ra field nào khác).
// Lý do: schema Sanity là nguồn sự thật duy nhất cho "field nào bắt buộc"
// (P6 + N7) — không tạo một danh sách "bắt buộc" độc lập, tự đoán ở đây.
//
// GIẢ ĐỊNH BỀ MẶT ĐÃ GHI LẠI (P8 — cửa hai chiều, không đụng dữ liệu):
// Một số field reference bắt buộc trỏ tới NHIỀU type đích hợp lệ
// (vd `containedInPlace` → place | touristDestination, `venue` → attraction |
// hotel | resort | place), nhưng `RefRule.to` trong GateConfig chỉ nhận
// đúng một type. Cơ chế hiện tại không diễn tả được ràng buộc "một trong N
// type" mà không mở rộng RefRule (đó là sửa cơ chế cổng, ngoài phạm vi PHA 0
// và cần quyết định riêng). Chọn: các field này VẪN có trong `requiredFields`
// (kiểm tra không được để trống) nhưng KHÔNG đưa vào `references` (không đoán
// bừa một type rồi báo sai cho dữ liệu hợp lệ). Xem docs/GOI-2-KET-QUA.md.

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
  publishableTypes: [
    'place',
    'attraction',
    'experience',
    'hotel',
    'resort',
    'tour',
    'article',
    'person',
    'organization',
  ],
  // ĐỒNG BỘ VỚI SCHEMA (chốt 2026-08-04): chủ dự án quyết định nới toàn bộ điều
  // kiện bắt buộc sang tuỳ chọn, ở CẢ hai tầng — schema Sanity (Studio) và cổng
  // publish (file này). Chỉ còn `title` và `slug` là bắt buộc, đúng bằng hai ngoại
  // lệ `title.vi` / `slug.vi` còn giữ `Rule.required()` trong cms/schemas/baseFields.ts.
  //
  // Vẫn giữ nguyên P6 + N7: schema Sanity là nguồn sự thật duy nhất cho "field nào
  // bắt buộc"; danh sách dưới đây chỉ chép lại, không tự thêm điều kiện nào.
  //
  // publishableTypes và references KHÔNG đổi: reviewStatus phải là "approved" mới
  // publish (ADR-0008, I19) và reference bắt buộc deref được đúng type — đó là kiểm
  // tính toàn vẹn, không phải kiểm completeness, nên nằm ngoài phạm vi nới lỏng này.
  requiredFields: {
    place: ['title', 'slug'],
    attraction: ['title', 'slug'],
    experience: ['title', 'slug'],
    hotel: ['title', 'slug'],
    resort: ['title', 'slug'],
    tour: ['title', 'slug'],
    article: ['title', 'slug'],
    person: ['title', 'slug'],
    organization: ['title', 'slug'],
  },
  references: {
    // experienceType trỏ đúng một type đích (category) → kiểm được trọn vẹn.
    experience: [
      { field: 'experienceType', to: 'category' },
      { field: 'destination', to: 'touristDestination' },
    ],
    // operator trỏ đúng một type đích (organization) → kiểm được trọn vẹn.
    tour: [
      { field: 'operator', to: 'organization' },
      { field: 'destination', to: 'touristDestination' },
    ],
    // author trỏ đúng một type đích (person) → kiểm được trọn vẹn.
    article: [
      { field: 'author', to: 'person' },
      { field: 'destination', to: 'touristDestination' },
    ],
    // destination trỏ đúng một type đích → kiểm được trọn vẹn, không vướng vấn đề
    // "một trong N type" mà containedInPlace mắc phải (xem chú thích đầu file).
    // Luật này KHÔNG kiểm ô trống: validate-min.ts bỏ qua reference null. Thiếu ô là
    // việc của I20 mức warn.
    place:      [{ field: 'destination', to: 'touristDestination' }],
    attraction: [{ field: 'destination', to: 'touristDestination' }],
    hotel:      [{ field: 'destination', to: 'touristDestination' }],
    resort:     [{ field: 'destination', to: 'touristDestination' }],
  },
}
