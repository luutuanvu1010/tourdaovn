// Fixture cố định — giả lập output LLM (JSON raw) đã qua content-guard, TRƯỚC mapFields.
// Cài cắm price/offers/bookingRef để golden.test.ts xác nhận field cấm (I1) bị field-mapper chặn.
export const restaurantRawGolden = {
  title: 'Nhà hàng Hải Sản Sáu Hơn',
  summary: 'Quán hải sản tươi sống nổi tiếng ở trung tâm Nha Trang, phục vụ đông khách du lịch.',
  body: 'Quán nằm gần biển, không gian rộng rãi, view đẹp.\n\nThực đơn đa dạng các món hải sản tươi sống, giá cả hợp lý.',
  servesCuisine: ['hải sản', 'món Việt'],
  containedInPlace: 'Trung tâm Nha Trang',
  highlights: ['Tôm hùm tươi sống', 'Không gian view biển'],
  faq: [{ question: 'Quán có chỗ đậu xe không?', answer: 'Có bãi đậu xe riêng cho khách.' }],
  openingHours: { open: '10:00', close: '22:00', note: 'Mở cửa cả tuần' },
  telephone: '0258 123 4567',
  // field CẤM (I1) — KHÔNG được lọt qua field-mapper dù fixture cài cắm
  price: '200000',
  offers: { price: 200000, priceCurrency: 'VND' },
  bookingRef: 'fake-ref-123',
}
