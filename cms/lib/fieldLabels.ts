/**
 * Từ điển nhãn tiếng Việt cho mọi trường trong Studio — một nguồn sự thật duy nhất.
 *
 * Vì sao tập trung một chỗ thay vì viết `title:` rải rác trong từng schema:
 * cùng một trường (`sameAs`, `containedInPlace`, `summary`...) xuất hiện ở hàng chục
 * entity; ghi tay từng nơi thì sớm muộn cũng lệch chữ giữa các màn hình. Ở đây đổi
 * một lần, cả Studio đổi theo.
 *
 * QUY ƯỚC ĐẶT NHÃN (chủ dự án chốt 2026-08-04):
 * "Tiếng Việt (tênGốc)" với các trường mang thuật ngữ kỹ thuật hoặc tên property
 * schema.org — ví dụ "Liên kết chuẩn (sameAs)". Giữ tên gốc trong ngoặc vì validator
 * và tài liệu đặc tả đều gọi theo tên gốc; bỏ hẳn thì đọc log lỗi phải ngồi đoán.
 * Trường nghĩa đã rõ trong tiếng Việt thì không cần ngoặc — "Số phòng", "Ngày bắt đầu".
 *
 * Nhãn khai thẳng trong schema (`defineField({ title: ... })`) luôn thắng từ điển này.
 */

/** Nhãn theo TÊN trường — áp cho mọi nơi trường đó xuất hiện. */
export const FIELD_LABELS: Record<string, string> = {
  // ── Ngôn ngữ (bên trong các ô dịch) ──
  vi: 'Tiếng Việt',
  en: 'Tiếng Anh',
  zh: 'Tiếng Trung',
  ko: 'Tiếng Hàn',
  ru: 'Tiếng Nga',

  // ── Nhận dạng, nội dung cơ bản ──
  title: 'Tiêu đề',
  name: 'Tên',
  slug: 'Đường dẫn (slug)',
  summary: 'Tóm tắt',
  description: 'Mô tả',
  body: 'Nội dung chi tiết',
  highlights: 'Điểm nổi bật',
  faq: 'Câu hỏi thường gặp (FAQ)',
  question: 'Câu hỏi',
  answer: 'Câu trả lời',
  keyFacts: 'Thông tin nhanh',
  label: 'Nhãn',
  value: 'Giá trị',
  note: 'Ghi chú',
  text: 'Nội dung',
  step: 'Bước',
  howTo: 'Hướng dẫn từng bước (howTo)',

  // ── Ảnh ──
  mainImage: 'Ảnh đại diện',
  gallery: 'Thư viện ảnh',
  alt: 'Mô tả ảnh (alt)',
  logo: 'Logo',
  imageProvenance: 'Nguồn ảnh (nội bộ)',

  // ── Nhận diện thương hiệu (siteSettings.branding, CONTENT_MODEL §2.15 v1.0.17) ──
  // Bốn nhãn dưới đây bị `title:` khai thẳng trong cms/schemas/siteSettings.ts
  // ghi đè, vì ở đó chúng cần thêm bối cảnh ("Logo (header và chân trang)").
  // Vẫn khai ở đây để trường cùng tên xuất hiện ở nơi khác không bị trống nhãn.
  branding: 'Nhận diện thương hiệu',
  favicon: 'Favicon',
  ogImage: 'Ảnh chia sẻ mạng xã hội',
  hideWordmark: 'Ẩn chữ tên site bên cạnh logo',

  // ── SEO ──
  seo: 'SEO',
  metaTitle: 'Tiêu đề SEO (metaTitle)',
  metaDescription: 'Mô tả SEO (metaDescription)',

  // ── Vị trí, liên kết ──
  geo: 'Toạ độ (geo)',
  address: 'Địa chỉ',
  street: 'Đường, số nhà',
  ward: 'Phường',
  location: 'Nơi diễn ra',
  hasMap: 'Liên kết bản đồ (hasMap)',
  sameAs: 'Liên kết chuẩn (sameAs)',
  officialSource: 'Nguồn chính thức (officialSource)',
  url: 'Website',
  telephone: 'Điện thoại',

  // ── Phân loại ──
  category: 'Danh mục',
  placeType: 'Loại địa danh',
  attractionType: 'Loại điểm tham quan',
  experienceType: 'Loại trải nghiệm',
  articleType: 'Loại bài viết',
  eventType: 'Loại sự kiện',
  orgType: 'Loại tổ chức',
  specialtyType: 'Loại đặc sản',
  tourFormat: 'Hình thức tour',
  touristType: 'Đối tượng khách',
  inDefinedTermSet: 'Thuộc bộ từ vựng',
  termCode: 'Mã thuật ngữ (termCode)',

  // ── Giờ giấc, giá, đặt chỗ ──
  openingHours: 'Giờ mở cửa',
  open: 'Giờ mở',
  close: 'Giờ đóng',
  duration: 'Thời lượng',
  durationAtStop: 'Thời gian dừng',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
  season: 'Mùa',
  seasonNote: 'Ghi chú theo mùa',
  isAccessibleForFree: 'Miễn phí vào cửa',
  bookingRef: 'Khoá giá (bookingRef)',
  key: 'Khoá',
  ticketUrl: 'Liên kết mua vé',

  // ── Lưu trú ──
  starRating: 'Hạng sao',
  amenityFeature: 'Tiện nghi',
  checkinTime: 'Giờ nhận phòng',
  checkoutTime: 'Giờ trả phòng',
  numberOfRooms: 'Số phòng',
  petsAllowed: 'Cho mang thú cưng',
  beachAccess: 'Lối ra biển',
  beachfront: 'Sát biển',
  onSiteActivities: 'Hoạt động tại chỗ',
  landArea: 'Diện tích (ha)',
  accessInfo: 'Cách di chuyển tới nơi',

  // ── Trải nghiệm, tour ──
  includes: 'Bao gồm',
  excludes: 'Không bao gồm',
  itinerary: 'Lịch trình',
  place: 'Điểm dừng',
  externalStop: 'Điểm dừng ngoài hệ thống',
  operator: 'Đơn vị vận hành',
  tripOrigin: 'Điểm xuất phát',
  departureNote: 'Ghi chú khởi hành',
  organizer: 'Đơn vị tổ chức',
  eventStatus: 'Trạng thái sự kiện',

  // ── Ẩm thực ──
  servesCuisine: 'Phong cách ẩm thực',
  servesSpecialty: 'Món đặc trưng',
  acceptsReservations: 'Nhận đặt bàn',
  hasMenu: 'Liên kết thực đơn',
  whereToTry: 'Nên thử ở đâu',
  originNote: 'Ghi chú nguồn gốc',

  // ── Trang trụ (TouristDestination) ──
  featuredAttractions: 'Điểm tham quan nổi bật',
  featuredStays: 'Nơi lưu trú nổi bật',
  featuredExperiences: 'Trải nghiệm nổi bật',
  featuredSpecialties: 'Đặc sản nổi bật',
  featuredTours: 'Tour nổi bật',
  relatedDestinations: 'Điểm đến liên quan',
  safetyNote: 'Lưu ý an toàn',

  // ── Bài viết, tác giả ──
  author: 'Tác giả',
  about: 'Nói về',
  mentions: 'Có nhắc tới',
  bio: 'Tiểu sử',
  jobTitle: 'Chức danh',
  knowsAbout: 'Lĩnh vực am hiểu',
  language: 'Ngôn ngữ',
  translationGroup: 'Nhóm bản dịch',
  licenseInfo: 'Giấy phép kinh doanh',

  // ── Quản trị ──
  reviewStatus: 'Trạng thái duyệt',
  approvedBy: 'Người duyệt',
  contentProvenance: 'Nguồn gốc nội dung',
  publishedAt: 'Ngày xuất bản',
  updatedAt: 'Ngày cập nhật',

  // ── Chỉ hiển thị trong Studio ──
  incomingExperiences: 'Trải nghiệm tại đây',
}

/**
 * Nhãn theo ĐƯỜNG DẪN — dành cho tên trường mang nghĩa khác nhau tuỳ ngữ cảnh.
 * Khoá là đường dẫn bỏ tên entity đứng đầu, mảng viết là `[]`.
 * Ví dụ `itinerary[].externalStop.name` khác hẳn `name` của Category.
 */
export const PATH_LABELS: Record<string, string> = {
  'itinerary[].externalStop.name': 'Tên điểm dừng',
  'itinerary[].externalStop.geo': 'Toạ độ điểm dừng',
  'itinerary[].externalStop.sameAs': 'Liên kết chuẩn của điểm dừng (sameAs)',
  'itinerary[].note': 'Ghi chú điểm dừng',
  'relatedDestinations[].name': 'Tên điểm đến',
  'relatedDestinations[].url': 'Liên kết',
  'openingHours.note': 'Ghi chú giờ giấc',
  'mainImage.alt': 'Mô tả ảnh đại diện (alt)',
  'gallery[].alt': 'Mô tả ảnh (alt)',
}
