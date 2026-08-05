import { ROUTE_MAP } from './routes'
import type { Lang } from './types'

export const HOME_COPY: Record<Lang, {
  heroEyebrow: string
  hubsHeading: string
  hubsSub: string
  hubDescriptions: Record<string, string>
  trustItems: Array<{ icon: string; title: string; description: string }>
  sections: {
    overview: string
    highlights: string
    facts: string
    areas: string
    attractions: string
    experiences: string
    articles: string
    stays: string
    specialties: string
    tours: string
    relatedDestinations: string
    faq: string
  }
  viewAll: string
  updatedAt: string
  safety: string
}> = {
  vi: {
    heroEyebrow: 'Cẩm nang địa phương',
    hubsHeading: 'Bắt đầu từ đâu?',
    hubsSub: 'Chọn chuyên mục bạn cần — mỗi hub có đầy đủ danh sách, bộ lọc và thông tin thực tế.',
    hubDescriptions: {
      'hub-kham-pha': 'Địa điểm, di tích, thiên nhiên, đảo biển',
      'hub-luu-tru': 'Khách sạn, resort, homestay ở mọi mức giá',
      'hub-di-lai': 'Sân bay, xe bus, taxi, thuê xe máy',
    },
    trustItems: [
      { icon: '🛡️', title: 'Nội dung đã duyệt', description: 'Biên tập viên người địa phương kiểm duyệt' },
      { icon: '📊', title: 'Dữ liệu có nguồn', description: 'Liên kết Wikidata, OSM, gov.vn' },
      { icon: '🔄', title: 'Cập nhật thường xuyên', description: 'Thông tin địa điểm cập nhật hàng tháng' },
      { icon: '🧭', title: 'Ưu tiên thực tế', description: 'Không quảng cáo, không PR, chỉ thông tin' },
    ],
    sections: {
      overview: 'Tổng quan về Nha Trang',
      highlights: 'Điểm nổi bật',
      facts: 'Thông tin nền tảng',
      areas: 'Các khu vực nên biết',
      attractions: 'Điểm tham quan nổi bật',
      experiences: 'Trải nghiệm nổi bật',
      articles: 'Cẩm nang bản địa',
      stays: 'Lưu trú nổi bật',
      specialties: 'Đặc sản và ẩm thực nổi bật',
      tours: 'Tour nổi bật',
      relatedDestinations: 'Điểm đến liên quan',
      faq: 'Câu hỏi thường gặp',
    },
    viewAll: 'Xem tất cả',
    updatedAt: 'Cập nhật',
    safety: 'Lưu ý an toàn',
  },
  en: {
    heroEyebrow: 'Local travel guide',
    hubsHeading: 'Where to start?',
    hubsSub: 'Pick the section you need — each hub has full listings, filters and practical information.',
    hubDescriptions: {
      'hub-kham-pha': 'Places and experiences in Nha Trang',
      'hub-luu-tru': 'Hotels and resorts for different budgets',
      'hub-di-lai': 'Transport guides and practical routes',
    },
    trustItems: [
      { icon: '🛡️', title: 'Reviewed content', description: 'Verified by local editors before publishing' },
      { icon: '📊', title: 'Source-backed data', description: 'Linked to Wikidata, OSM, gov.vn' },
      { icon: '🔄', title: 'Regularly updated', description: 'Place info refreshed monthly' },
      { icon: '🧭', title: 'Practical first', description: 'No ads, no sponsored content, facts only' },
    ],
    sections: {
      overview: 'About Nha Trang',
      highlights: 'Highlights',
      facts: 'Useful basics',
      areas: 'Areas to know',
      attractions: 'Featured attractions',
      experiences: 'Featured experiences',
      articles: 'Local guides',
      stays: 'Featured stays',
      specialties: 'Food and specialties',
      tours: 'Featured tours',
      relatedDestinations: 'Related destinations',
      faq: 'Frequently asked questions',
    },
    viewAll: 'View all',
    updatedAt: 'Updated',
    safety: 'Safety note',
  },
  zh: {
    heroEyebrow: '本地旅行指南',
    hubsHeading: '从哪里开始？',
    hubsSub: '选择您需要的板块 — 每个板块都有完整的列表、筛选器和实用信息。',
    hubDescriptions: {
      'hub-kham-pha': '芽庄的地点和体验',
      'hub-luu-tru': '酒店和度假村选择',
      'hub-di-lai': '交通指南和实用路线',
    },
    trustItems: [
      { icon: '🛡️', title: '已审核内容', description: '发布前由本地编辑验证' },
      { icon: '📊', title: '有来源的数据', description: '链接至 Wikidata、OSM、gov.vn' },
      { icon: '🔄', title: '定期更新', description: '地点信息每月更新' },
      { icon: '🧭', title: '实用优先', description: '无广告，无赞助内容，仅提供事实' },
    ],
    sections: {
      overview: '关于芽庄',
      highlights: '亮点',
      facts: '基础信息',
      areas: '值得了解的区域',
      attractions: '精选景点',
      experiences: '精选体验',
      articles: '本地攻略',
      stays: '精选住宿',
      specialties: '美食和特产',
      tours: '精选旅行团',
      relatedDestinations: '相关目的地',
      faq: '常见问题',
    },
    viewAll: '查看全部',
    updatedAt: '更新',
    safety: '安全提示',
  },
  ko: {
    heroEyebrow: '현지 여행 가이드',
    hubsHeading: '어디서 시작할까요?',
    hubsSub: '필요한 섹션을 선택하세요 — 각 허브에는 전체 목록, 필터 및 실용 정보가 있습니다.',
    hubDescriptions: {
      'hub-kham-pha': '나트랑의 장소와 체험',
      'hub-luu-tru': '호텔과 리조트 선택지',
      'hub-di-lai': '교통 가이드와 이동 팁',
    },
    trustItems: [
      { icon: '🛡️', title: '검토된 콘텐츠', description: '게시 전에 현지 편집자가 확인' },
      { icon: '📊', title: '출처 기반 데이터', description: 'Wikidata, OSM, gov.vn에 링크' },
      { icon: '🔄', title: '정기적 업데이트', description: '장소 정보 매월 갱신' },
      { icon: '🧭', title: '실용 정보 우선', description: '광고 없음, 후원 콘텐츠 없음, 사실만' },
    ],
    sections: {
      overview: '나트랑 소개',
      highlights: '하이라이트',
      facts: '기본 정보',
      areas: '알아두면 좋은 지역',
      attractions: '추천 명소',
      experiences: '추천 체험',
      articles: '현지 가이드',
      stays: '추천 숙소',
      specialties: '음식과 특산품',
      tours: '추천 투어',
      relatedDestinations: '관련 목적지',
      faq: '자주 묻는 질문',
    },
    viewAll: '전체 보기',
    updatedAt: '업데이트',
    safety: '안전 안내',
  },
  ru: {
    heroEyebrow: 'Местный путеводитель',
    hubsHeading: 'С чего начать?',
    hubsSub: 'Выберите нужный раздел — в каждом хабе есть полные списки, фильтры и практическая информация.',
    hubDescriptions: {
      'hub-kham-pha': 'Места и впечатления в Нячанге',
      'hub-luu-tru': 'Отели и курорты для разных бюджетов',
      'hub-di-lai': 'Транспортные советы и маршруты',
    },
    trustItems: [
      { icon: '🛡️', title: 'Проверенный контент', description: 'Проверено местными редакторами перед публикацией' },
      { icon: '📊', title: 'Данные с источниками', description: 'Ссылки на Wikidata, OSM, gov.vn' },
      { icon: '🔄', title: 'Регулярные обновления', description: 'Информация о местах обновляется ежемесячно' },
      { icon: '🧭', title: 'Практичность прежде всего', description: 'Без рекламы, без спонсоров, только факты' },
    ],
    sections: {
      overview: 'О Нячанге',
      highlights: 'Основные моменты',
      facts: 'Полезная база',
      areas: 'Районы, которые стоит знать',
      attractions: 'Избранные места',
      experiences: 'Избранные впечатления',
      articles: 'Местные гиды',
      stays: 'Избранное проживание',
      specialties: 'Еда и деликатесы',
      tours: 'Избранные туры',
      relatedDestinations: 'Похожие направления',
      faq: 'Частые вопросы',
    },
    viewAll: 'Смотреть все',
    updatedAt: 'Обновлено',
    safety: 'Совет по безопасности',
  },
}

export function routeForEntity(entity: string) {
  return ROUTE_MAP.find(route => route.entity === entity)
}

export function indexHref(entity: string, lang: Lang): string | undefined {
  const route = routeForEntity(entity)
  if (!route) return undefined
  const prefix = lang === 'vi' ? '' : `/${lang}`
  return `${prefix}/${route.segments[lang]}/`
}

export function destinationHref(slug: string, lang: Lang): string | undefined {
  if (!slug) return undefined
  const prefix = lang === 'vi' ? '' : `/${lang}`
  return `${prefix}/${slug}/`
}

export function entityHref(entity: string, slug: string, lang: Lang): string | undefined {
  if (entity === 'touristDestination') return destinationHref(slug, lang)
  const route = routeForEntity(entity)
  if (!route || !slug) return undefined
  const prefix = lang === 'vi' ? '' : `/${lang}`
  return `${prefix}/${route.segments[lang]}/${slug}/`
}

export function hasClearIndex(entity: string): boolean {
  const route = routeForEntity(entity)
  return Boolean(route?.hasIndex || entity.startsWith('hub-'))
}

const COUNT_LABELS: Record<Lang, (n: number) => string> = {
  vi: (n) => `${n} địa điểm`,
  en: (n) => `${n} ${n === 1 ? 'place' : 'places'}`,
  zh: (n) => `${n} 个地点`,
  ko: (n) => `${n}곳`,
  ru: (n) => {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return `${n} место`
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return `${n} места`
    return `${n} мест`
  },
}

export function hubCountLabel(count: number, lang: Lang): string {
  return COUNT_LABELS[lang]?.(count) ?? `${count} places`
}
