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
  requiredFields: {
    // containedInPlace: reference đa-type (place | touristDestination) — xem ghi chú đầu file.
    place: ['title', 'slug', 'summary', 'placeType', 'sameAs', 'containedInPlace'],
    // sameAs/officialSource ở attraction chỉ bắt buộc CÓ ĐIỀU KIỆN theo attractionType
    // (Rule.custom trong schema, không phải Rule.required() vô điều kiện) — không đưa
    // vào đây vì gate hiện chỉ kiểm "có/không", không kiểm điều kiện theo field khác.
    attraction: ['title', 'slug', 'summary', 'attractionType', 'containedInPlace'],
    // venue: reference đa-type (attraction | hotel | resort | place) — xem ghi chú đầu file.
    experience: ['title', 'slug', 'summary', 'experienceType', 'venue'],
    // containedInPlace: reference đa-type (place | touristDestination) — xem ghi chú đầu file.
    hotel: ['title', 'slug', 'summary', 'officialSource', 'containedInPlace'],
    resort: ['title', 'slug', 'summary', 'officialSource', 'containedInPlace'],
    tour: ['title', 'slug', 'summary', 'itinerary', 'operator', 'tourFormat'],
    article: ['title', 'slug', 'language', 'summary', 'mainImage', 'articleType', 'author', 'body'],
    person: ['title', 'slug', 'summary', 'sameAs', 'bio'],
    organization: ['title', 'slug', 'summary', 'orgType', 'url', 'officialSource'],
  },
  references: {
    // experienceType trỏ đúng một type đích (category) → kiểm được trọn vẹn.
    experience: [{ field: 'experienceType', to: 'category' }],
    // operator trỏ đúng một type đích (organization) → kiểm được trọn vẹn.
    tour: [{ field: 'operator', to: 'organization' }],
    // author trỏ đúng một type đích (person) → kiểm được trọn vẹn.
    article: [{ field: 'author', to: 'person' }],
  },
}
