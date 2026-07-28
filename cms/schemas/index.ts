import siteSettings from './siteSettings'
import category from './category'
import person from './person'
import touristDestination from './touristDestination'
import place from './place'
import attraction from './attraction'
import restaurant from './restaurant'
import specialty from './specialty'
import hotel from './hotel'
import resort from './resort'
import experience from './experience'
import organization from './organization'
import event from './event'
import tour from './tour'
import article from './article'
import faqItem from './objects/faqItem'
import { enabledEntities } from '../../src/site.config'

// place, attraction, experience, hotel, resort, tour, article, person, organization: bật/tắt
// đọc từ `enabledEntities` (site.config.ts) — một nguồn sự thật duy nhất (PHA 5, GÓI 2).
const ENTITY_SCHEMAS: Record<string, unknown> = {
  place, attraction, experience, hotel, resort, tour, article, person, organization,
}

// event: KHÔNG qua cơ chế enabledEntities ở trên dù entities.event=false trong
// site.config.ts. Lý do: Sanity hiện có 1 document event thật đã DUYỆT (approved) — gỡ
// đăng ký lúc còn dữ liệu sẽ làm dữ liệu đó không sửa được nữa (PHA 5 mục 2, GÓI 2). Giữ
// đăng ký thủ công tại đây cho tới khi chủ dự án quyết định (xoá document, chuyển dữ liệu
// sang dạng khác, hay bật lại entity trong site.config.ts). Xem docs/GOI-2-KET-QUA.md.
//
// restaurant, specialty: PHẢI VẪN Ở ĐÂY dù đã ẩn khỏi menu (xem entityTypes.ts) và dù 0
// document — thử gỡ hẳn khỏi schemaTypes đã làm Studio vỡ (SchemaError, xác minh bằng
// browser thật): `article.ts` field about/mentions và `touristDestination.ts` field
// featuredSpecialties vẫn khai `to: [{ type: 'restaurant' }]`/`{ type: 'specialty' }`. Đây
// đúng là tình huống PHA 5 mục 3 lường trước — báo cáo, không tự xử lý. Chỉ mới ẩn khỏi
// menu (biên tập viên không tạo mới được nữa), CHƯA gỡ đăng ký thật. Xem docs/GOI-2-KET-QUA.md.
export const schemaTypes = [
  siteSettings,
  faqItem,
  category,
  touristDestination,
  ...enabledEntities.map((key) => ENTITY_SCHEMAS[key]).filter(Boolean),
  event,
  restaurant,
  specialty,
]
