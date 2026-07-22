// Fixture cố định — giả lập output đã merge (prose LLM + sameAs từ resolver), TRƯỚC mapFields.
// sameAs có mặt vì index.ts merge sameAs của resolver vào trước mapFields (luồng A thắng).
// highlights CỐ TÌNH cài: CONTENT_MODEL §2.14 "loại có chủ ý — body đủ" → Specialty KHÔNG có
// highlights → không nằm SPECIALTY_FIELDS → mapper phải bỏ. bookingRef/brand/price là field cấm.
export const specialtyRawGolden = {
  title: 'Nem nướng Ninh Hòa',
  summary: 'Đặc sản trứ danh của vùng Ninh Hòa, Khánh Hòa, ăn kèm bánh tráng và rau sống.',
  body: 'Nem nướng làm từ thịt heo xay quết nhuyễn, nướng than hồng.\n\nĂn kèm bánh tráng, rau sống, đồ chua và nước chấm đặc trưng.',
  specialtyType: 'dish',
  originNote: 'Nem nướng gốc Ninh Hòa, nay phổ biến khắp Nha Trang',
  season: 'Quanh năm',
  faq: [{ question: 'Nem nướng ăn với gì?', answer: 'Ăn kèm bánh tráng, rau sống và nước chấm.' }],
  // sameAs đã được resolver gắn (luồng A) — gate I17
  sameAs: ['https://vi.wikipedia.org/wiki/Nem_nướng'],
  // field ngoài whitelist specialty — §2.14 (highlights loại có chủ ý) + cấm (bookingRef/brand/price)
  highlights: ['Thịt quết tay', 'Nước chấm gia truyền'],
  bookingRef: 'fake-ref-xyz',
  brand: 'Nem nướng Đặng Văn Quyên',
  price: '50',
}

// Biến thể KHÔNG có sameAs — chứng minh gate I17 (specialty) trả error khi thiếu sameAs.
export const specialtyRawNoSameAs = {
  title: 'Bún sứa Nha Trang',
  summary: 'Món bún đặc trưng vùng biển Nha Trang với sứa giòn và chả cá.',
  body: 'Bún sứa dùng sứa biển tươi, chần sơ, ăn cùng chả cá và nước dùng thanh ngọt.',
  specialtyType: 'dish',
}
