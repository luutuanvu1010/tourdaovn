import { ROUTE_MAP } from './routes'
import type { Lang } from './types'

export const HOME_COPY: Record<Lang, {
  heroEyebrow: string
  hubsHeading: string
  hubsSub: string
  hubDescriptions: Record<string, string>
  trustItems: Array<{ icon: string; title: string; description: string }>
  sections: {
    /** Nhận tên điểm đến đang render — trang Phú Quốc không được mang tiêu đề Nha Trang. */
    overview: (name: string) => string
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
    /** Nhãn khối "Điểm đến khác" trên trang chủ (ADR-0028). */
    destinations: string
    faq: string
    /** Bốn khối thêm cho trang chủ hướng A (SPEC-2026-08-06). */
    whyUs: string
    partners: string
    testimonials: string
    groupQuote: string
  }
  /** Câu phụ dưới tiêu đề khối đối tác. */
  partnersSub: string
  /** Dòng minh bạch dưới khối đánh giá — đánh giá KHÔNG serialize (QĐ-2026-08-06-09). */
  testimonialsDisclosure: string
  /** Nhãn nút báo giá đoàn khi Studio chưa nhập `groupQuote.ctaLabel`. */
  groupQuoteCta: string
  viewAll: string
  updatedAt: string
  safety: string
  /** Nhãn nút chính ở hero — đặt chỗ qua Zalo (00 §3). */
  heroBookCta: string
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
      { icon: '🚐', title: 'Xe đưa đón tận nơi', description: 'Không bắt khách tự ra bến. Tài xế nhận khách ngay tại khách sạn theo giờ đã hẹn.' },
      { icon: '🧭', title: 'Hướng dẫn viên đi cùng', description: 'Có người chịu trách nhiệm suốt chuyến, từ lúc lên xe đến lúc về lại khách sạn.' },
      { icon: '🏷️', title: 'Giá tốt', description: 'Báo giá trọn gói, không phụ thu phát sinh trong ngày. Giá trên trang là giá bạn trả.' },
      { icon: '💬', title: 'Thanh toán linh hoạt', description: 'Chốt qua Zalo với người thật, thống nhất cách thanh toán trước khi giữ chỗ.' },
    ],
    sections: {
      overview: (name) => `Tổng quan về ${name}`,
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
      destinations: 'Điểm đến khác',
      faq: 'Câu hỏi thường gặp',
      whyUs: 'Vì sao chọn',
      partners: 'Chúng tôi làm việc cùng',
      testimonials: 'Khách đã đi nói gì',
      groupQuote: 'Báo giá đoàn',
    },
    partnersSub: 'Sàn đặt phòng, hãng tàu, khách sạn và đại lý mà công ty nối sản phẩm trực tiếp.',
    testimonialsDisclosure: 'Đánh giá do khách gửi trực tiếp cho công ty hoặc trích từ trang nguồn ghi kèm. Chúng tôi không phát dữ liệu đánh giá cho công cụ tìm kiếm.',
    groupQuoteCta: 'Nhận báo giá qua Zalo',
    viewAll: 'Xem tất cả',
    updatedAt: 'Cập nhật',
    safety: 'Lưu ý an toàn',
    heroBookCta: 'Đặt vé qua Zalo',
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
      overview: (name) => `About ${name}`,
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
      destinations: 'Other destinations',
      faq: 'Frequently asked questions',
      whyUs: 'Why choose us',
      partners: 'We work with',
      testimonials: 'What our guests say',
      groupQuote: 'Group quote',
    },
    partnersSub: 'Booking platforms, boat operators, hotels and agencies we source directly from.',
    testimonialsDisclosure: 'Reviews are sent to us directly by guests or quoted from the source page named. We do not emit review data to search engines.',
    groupQuoteCta: 'Get a quote on Zalo',
    viewAll: 'View all',
    updatedAt: 'Updated',
    safety: 'Safety note',
    heroBookCta: 'Book on Zalo',
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
      overview: (name) => `关于${name}`,
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
      destinations: '其他目的地',
      faq: '常见问题',
      whyUs: '为什么选择我们',
      partners: '合作伙伴',
      testimonials: '客人怎么说',
      groupQuote: '团队报价',
    },
    partnersSub: '我们直接对接的订房平台、船公司、酒店和代理商。',
    testimonialsDisclosure: '评价由客人直接提供或引用所注明的来源页面。我们不向搜索引擎发送评价数据。',
    groupQuoteCta: '通过 Zalo 获取报价',
    viewAll: '查看全部',
    updatedAt: '更新',
    safety: '安全提示',
    heroBookCta: '通过 Zalo 预订',
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
      overview: (name) => `${name} 소개`,
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
      destinations: '다른 여행지',
      faq: '자주 묻는 질문',
      whyUs: '왜 저희를 선택하나요',
      partners: '함께하는 파트너',
      testimonials: '다녀온 손님의 말',
      groupQuote: '단체 견적',
    },
    partnersSub: '직접 연결된 예약 플랫폼, 선사, 호텔, 여행사입니다.',
    testimonialsDisclosure: '후기는 손님이 직접 보내주셨거나 명시된 출처에서 인용한 것입니다. 검색엔진에 후기 데이터를 내보내지 않습니다.',
    groupQuoteCta: 'Zalo로 견적 받기',
    viewAll: '전체 보기',
    updatedAt: '업데이트',
    safety: '안전 안내',
    heroBookCta: 'Zalo로 예약',
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
      overview: (name) => `О направлении ${name}`,
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
      destinations: 'Другие направления',
      faq: 'Частые вопросы',
      whyUs: 'Почему мы',
      partners: 'Мы работаем с',
      testimonials: 'Что говорят гости',
      groupQuote: 'Расчёт для группы',
    },
    partnersSub: 'Платформы бронирования, судовые компании, отели и агентства, с которыми мы работаем напрямую.',
    testimonialsDisclosure: 'Отзывы присланы гостями напрямую или процитированы с указанного источника. Мы не передаём данные отзывов поисковым системам.',
    groupQuoteCta: 'Получить расчёт в Zalo',
    viewAll: 'Смотреть все',
    updatedAt: 'Обновлено',
    safety: 'Совет по безопасности',
    heroBookCta: 'Забронировать в Zalo',
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
