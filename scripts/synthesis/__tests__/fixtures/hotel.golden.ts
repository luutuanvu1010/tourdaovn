// Fixture cố định — giả lập output LLM (JSON raw) cho hotel, TRƯỚC mapFields.
// telephone CỐ TÌNH cài: CONTENT_MODEL §2.5 nói Hotel/Resort KHÔNG có telephone (đường hành động
// là nguồn giá) → không nằm HOTEL_FIELDS → mapper phải bỏ. price/offers là field cấm (I1).
export const hotelRawGolden = {
  title: 'Khách sạn Mường Thanh Nha Trang',
  summary: 'Khách sạn 5 sao ngay trung tâm Nha Trang, view biển, gần các điểm tham quan chính.',
  body: 'Tọa lạc trên đường Trần Phú, mặt tiền biển.\n\nPhòng ốc hiện đại, đầy đủ tiện nghi, phù hợp cả khách công tác lẫn nghỉ dưỡng.',
  amenityFeature: ['hồ bơi vô cực', 'gym', 'spa', 'nhà hàng buffet'],
  accessInfo: 'Cách sân bay Cam Ranh khoảng 35km, có dịch vụ đưa đón.',
  containedInPlace: 'Trung tâm Nha Trang',
  highlights: ['View biển trực diện', 'Hồ bơi tầng thượng'],
  faq: [{ question: 'Khách sạn có đón sân bay không?', answer: 'Có, theo yêu cầu khi đặt phòng.' }],
  starRating: 5,
  numberOfRooms: 240,
  // field ngoài whitelist hotel — CONTENT_MODEL §2.5 (telephone) + I1 (price/offers)
  telephone: '0258 123 4567',
  price: '1500',
  offers: { price: 1500000, priceCurrency: 'VND' },
}
