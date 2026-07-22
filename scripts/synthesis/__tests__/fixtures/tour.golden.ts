// Fixture cố định — giả lập output LLM (JSON raw) cho tour, TRƯỚC mapFields.
// itinerary + operator là TEXT gợi ý (R6): mapper KHÔNG ghi vào mapped, chỉ cảnh báo (giống
// containedInPlace) — reference-resolver/người gán ref sau (ngoài phạm vi P5).
// price/offers/aggregateRating là field cấm (I1, §2.8).
export const tourRawGolden = {
  title: 'Tour 4 đảo Nha Trang',
  summary: 'Hành trình một ngày khám phá 4 hòn đảo đẹp nhất vịnh Nha Trang, gồm lặn ngắm san hô.',
  body: 'Tour khởi hành từ cảng Cầu Đá, đưa khách qua các đảo nổi tiếng.\n\nBao gồm lặn ngắm san hô, tắm biển và ăn trưa hải sản trên tàu.',
  // text gợi ý các chặng — KHÔNG bịa reference (R6)
  itinerary: [
    'Đón khách tại khách sạn trung tâm Nha Trang',
    'Lặn ngắm san hô tại Hòn Mun',
    'Tắm biển và ăn trưa tại Hòn Một',
    'Về lại cảng Cầu Đá',
  ],
  operator: 'Công ty Du lịch Biển Xanh',
  tourFormat: 'join-in',
  includes: ['ăn trưa trên tàu', 'thiết bị lặn cơ bản', 'đón tiễn khách sạn'],
  excludes: ['phí lặn bình dưỡng khí', 'vé tham quan thủy cung'],
  departureNote: 'Đón khách sạn trung tâm 7:30, tàu rời cảng Cầu Đá lúc 8:30, về bến khoảng 16:00',
  duration: 'PT8H',
  highlights: ['Lặn ngắm san hô Hòn Mun', 'Ăn trưa hải sản trên tàu'],
  faq: [{ question: 'Tour có phù hợp trẻ em không?', answer: 'Phù hợp, có áo phao đủ cỡ cho trẻ.' }],
  // field cấm (I1, §2.8)
  price: '600',
  offers: { price: 600000, priceCurrency: 'VND' },
  aggregateRating: { ratingValue: 4.8, reviewCount: 120 },
}

// Biến thể THIẾU itinerary/operator/tourFormat — chứng minh validator cảnh báo gate I14 (R6:
// cảnh báo, không chặn ở tầng synthesis vì ref gán sau).
export const tourRawMinimal = {
  title: 'Tour city Nha Trang nửa ngày',
  summary: 'Tham quan các điểm nổi bật trong thành phố trong nửa ngày.',
  body: 'Hành trình ngắn quanh trung tâm, phù hợp khách có ít thời gian.',
}
