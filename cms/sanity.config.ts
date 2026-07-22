import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { documentInternationalization } from '@sanity/document-internationalization'
import { languageFilter } from '@sanity/language-filter'
import { RocketIcon } from '@sanity/icons'
import { schemaTypes } from './schemas'
import { structure } from './lib/structure'
import { ViewLiveAction } from './lib/actions/viewLive'
import { SynthDataAction } from './lib/actions/synthData'
import { TranslateAllAction } from './lib/actions/translateAll'
import { SynthTool } from './components/SynthTool'
import { GeoDashboard } from './components/GeoDashboard'
import { TranslateFieldControl } from './components/TranslateFieldControl'
import { getDocI18nTypes, getFieldI18nTypes } from './lib/entityTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineConfig({
  name: 'nhatrang-travel',
  title: 'Nha Trang Travel Hub',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    documentInternationalization({
      supportedLanguages: [
        { id: 'vi', title: 'Tiếng Việt' },
        { id: 'en', title: 'English' },
        { id: 'zh', title: '中文' },
        { id: 'ko', title: '한국어' },
        { id: 'ru', title: 'Русский' }
      ],
      schemaTypes: getDocI18nTypes()
      // Chỉ Article dùng document-level i18n (ADR-0004)
      // entity còn lại dùng field-level: field dịch là object localized
    }),
    languageFilter({
      supportedLanguages: [
        { id: 'vi', title: 'Tiếng Việt' },
        { id: 'en', title: 'English' },
        { id: 'zh', title: '中文' },
        { id: 'ko', title: '한국어' },
        { id: 'ru', title: 'Русский' }
      ],
      // Mặc định chỉ hiện vi; người dùng bật thêm ngôn ngữ khi cần
      defaultLanguages: ['vi'],
      // Áp cho entity field-level (không áp article vì article dùng document-level)
      documentTypes: getFieldI18nTypes()
    })
  ],
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'category') return prev
      return [...prev, TranslateAllAction, SynthDataAction, ViewLiveAction]
    },
  },
  form: {
    components: {
      field: TranslateFieldControl,
    },
  },
  tools: (prev) => [
    ...prev,
    {
      name: 'synth',
      title: 'Cào dữ liệu',
      icon: RocketIcon,
      component: SynthTool,
    },
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
