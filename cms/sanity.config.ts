import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { RocketIcon } from '@sanity/icons'
import { schemaTypes } from './schemas'
import { structure } from './lib/structure'
import { ViewLiveAction } from './lib/actions/viewLive'
import { GeoDashboard } from './components/GeoDashboard'
import { brand } from '../src/site.config'

// Đã gỡ khỏi giao diện Studio theo yêu cầu chủ dự án (PHA 5, GÓI 2) — site hiện chỉ chạy
// tiếng Việt, và "cào dữ liệu" không cần hiện với biên tập viên:
// - Plugin document-internationalization + language-filter (nút chọn 5 ngôn ngữ)
// - TranslateAllAction, TranslateFieldControl (nút "Dịch" trong form)
// - SynthTool, SynthDataAction (tool + action "Cào dữ liệu")
// Không xoá các file cms/lib/actions/translateAll.tsx, cms/components/TranslateFieldControl.tsx,
// cms/components/SynthTool.tsx, cms/lib/actions/synthData.tsx — chỉ ẩn khỏi Studio, giữ
// code để dùng lại khi cần. Xem docs/GOI-2-KET-QUA.md.

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineConfig({
  name: 'nhatrang-travel',
  title: `${brand.name} Hub`,
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
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
