import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { languageFilter } from '@sanity/language-filter'
import { RocketIcon } from '@sanity/icons'
import { schemaTypes } from './schemas'
import { structure } from './lib/structure'
import { ViewLiveAction } from './lib/actions/viewLive'
import { GeoDashboard } from './components/GeoDashboard'
import { getFieldI18nTypes } from './lib/entityTypes'
import { brand, langs } from '../src/site.config'

// Đã gỡ khỏi giao diện Studio theo yêu cầu chủ dự án (PHA 5, GÓI 2) — site hiện chỉ chạy
// tiếng Việt, và "cào dữ liệu" không cần hiện với biên tập viên:
// - Plugin document-internationalization (nút "tạo bản dịch" ở cấp document, chỉ áp cho
//   Article — không liên quan tới việc field nào hiện trong form)
// - TranslateAllAction, TranslateFieldControl (nút gọi API tự dịch trong form)
// - SynthTool, SynthDataAction (tool + action "Cào dữ liệu")
// Không xoá các file cms/lib/actions/translateAll.tsx, cms/components/TranslateFieldControl.tsx,
// cms/components/SynthTool.tsx, cms/lib/actions/synthData.tsx — chỉ ẩn khỏi Studio, giữ
// code để dùng lại khi cần. Xem docs/GOI-2-KET-QUA.md.
//
// language-filter GIỮ LẠI (khác với 2 plugin/2 action trên): đây là cơ chế DUY NHẤT ẩn các
// trường vi/en/zh/ko/ru theo ngôn ngữ đang bật — gỡ nó làm mọi trường hiện hết, không lọc
// (lỗi thật đã xảy ra, sửa lại ở đây). `defaultLanguages` đọc từ `langs` (site.config.ts) —
// một nguồn sự thật, tự cập nhật khi đổi cấu hình ngôn ngữ.
//
// filterField VIẾT RIÊNG, không dùng mặc định của plugin — đã đọc source code
// @sanity/language-filter (không phải đoán) và xác nhận 2 vấn đề:
// 1. filterField mặc định chỉ nhận diện field cần lọc khi object bao ngoài có TÊN TYPE
//    bắt đầu bằng "locale" (quy ước riêng của Sanity: https://www.sanity.io/docs/localization).
//    Schema dự án này dùng `object` thường (baseFields.ts), không theo quy ước đó — nên
//    filterField mặc định LUÔN trả về true (không lọc field nào), bất kể defaultLanguages.
// 2. Khi trình duyệt CHƯA có lựa chọn lưu trong localStorage, hành vi mặc định của chính
//    plugin là chọn TẤT CẢ ngôn ngữ tuỳ chọn (xem getPersistedLanguageIds trong
//    node_modules/@sanity/language-filter/dist/index.js) — khác với mô tả trong README.
// → filterField dưới đây bỏ qua hoàn toàn selectedLanguageIds của plugin, quyết định
// thẳng từ `langs` — nhất quán cho mọi trình duyệt/biên tập viên, không phụ thuộc thao tác
// bấm nút hay localStorage, tự hiện lại field khi thêm ngôn ngữ vào site.config.ts.
const LANG_IDS: string[] = ['vi', 'en', 'zh', 'ko', 'ru']
const enabledLangIds: string[] = langs

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineConfig({
  name: 'nhatrang-travel',
  title: `${brand.name} Hub`,
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    languageFilter({
      supportedLanguages: [
        { id: 'vi', title: 'Tiếng Việt' },
        { id: 'en', title: 'English' },
        { id: 'zh', title: '中文' },
        { id: 'ko', title: '한국어' },
        { id: 'ru', title: 'Русский' }
      ],
      // Chỉ hiện trường của ngôn ngữ đang bật (site.config.ts) — hiện tại chỉ tiếng Việt.
      defaultLanguages: langs,
      // Áp cho entity field-level (không áp article vì article dùng document-level)
      documentTypes: getFieldI18nTypes(),
      // Xem ghi chú phía trên: quyết định thẳng từ `langs`, không dựa vào tên type bao
      // ngoài hay trạng thái đã chọn của plugin.
      filterField: (_enclosingType, field) =>
        !LANG_IDS.includes(field.name) || enabledLangIds.includes(field.name)
    }),
  ],
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'category') return prev
      return [...prev, ViewLiveAction]
    },
  },
  tools: (prev) => [
    ...prev,
    {
      name: 'geo-dashboard',
      title: 'GEO Dashboard',
      icon: RocketIcon,
      component: GeoDashboard,
    },
  ],
  schema: {
    types: schemaTypes
  }
})
