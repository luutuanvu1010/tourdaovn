import type { Lang } from './types'

export interface RouteEntry {
  entity: string
  segments: Record<Lang, string>
  labels: Record<Lang, string>
  hasIndex: boolean
  hasTerm: boolean
}

export const ROUTE_MAP: RouteEntry[] = [
  { entity: 'place',            segments: { vi:'dia-danh',         en:'places',          zh:'地点',       ko:'장소',       ru:'места' },                  labels: { vi:'Địa danh',      en:'Places',          zh:'地点',       ko:'장소',       ru:'Места' },                  hasIndex: true,  hasTerm: false },
  { entity: 'attraction',       segments: { vi:'diem-tham-quan',   en:'attractions',     zh:'景点',       ko:'명소',       ru:'достопримечательности' }, labels: { vi:'Điểm tham quan', en:'Attractions',     zh:'景点',       ko:'명소',       ru:'Достопримечательности' }, hasIndex: true,  hasTerm: false },
  { entity: 'experience',       segments: { vi:'trai-nghiem',      en:'experiences',     zh:'体验',       ko:'체험',       ru:'впечатления' },            labels: { vi:'Trải nghiệm',    en:'Experiences',     zh:'体验',       ko:'체험',       ru:'Впечатления' },            hasIndex: true,  hasTerm: true },
  { entity: 'restaurant',       segments: { vi:'nha-hang',         en:'restaurants',     zh:'餐厅',       ko:'맛집',       ru:'рестораны' },              labels: { vi:'Nhà hàng',       en:'Restaurants',     zh:'餐厅',       ko:'맛집',       ru:'Рестораны' },              hasIndex: true,  hasTerm: false },
  { entity: 'specialty',        segments: { vi:'dac-san',          en:'specialties',     zh:'特产',       ko:'특산품',     ru:'деликатесы' },             labels: { vi:'Đặc sản',        en:'Specialties',     zh:'特产',       ko:'특산품',     ru:'Деликатесы' },             hasIndex: true,  hasTerm: false },
  { entity: 'hotel',            segments: { vi:'khach-san',        en:'hotels',          zh:'酒店',       ko:'호텔',       ru:'отели' },                  labels: { vi:'Khách sạn',      en:'Hotels',          zh:'酒店',       ko:'호텔',       ru:'Отели' },                  hasIndex: true,  hasTerm: false },
  { entity: 'resort',           segments: { vi:'resort',           en:'resorts',         zh:'度假村',     ko:'리조트',     ru:'курорты' },                labels: { vi:'Resort',         en:'Resorts',         zh:'度假村',     ko:'리조트',     ru:'Курорты' },                hasIndex: true,  hasTerm: false },
  { entity: 'tour',             segments: { vi:'tour',             en:'tours',           zh:'旅行团',     ko:'투어',       ru:'туры' },                   labels: { vi:'Tour',           en:'Tours',           zh:'旅行团',     ko:'투어',       ru:'Туры' },                   hasIndex: true,  hasTerm: true },
  { entity: 'event',            segments: { vi:'su-kien',          en:'events',          zh:'活动',       ko:'이벤트',     ru:'события' },                labels: { vi:'Sự kiện',        en:'Events',          zh:'活动',       ko:'이벤트',     ru:'События' },                hasIndex: true,  hasTerm: false },
  { entity: 'article',          segments: { vi:'cam-nang',         en:'guides',          zh:'攻略',       ko:'가이드',     ru:'гайды' },                  labels: { vi:'Cẩm nang',       en:'Guides',          zh:'攻略',       ko:'가이드',     ru:'Гайды' },                  hasIndex: true,  hasTerm: false },
  { entity: 'person',           segments: { vi:'tac-gia',          en:'authors',         zh:'作者',       ko:'작가',       ru:'авторы' },                 labels: { vi:'Tác giả',        en:'Authors',         zh:'作者',       ko:'작가',       ru:'Авторы' },                 hasIndex: false, hasTerm: false },
  { entity: 'organization',     segments: { vi:'cong-ty',          en:'companies',       zh:'公司',       ko:'회사',       ru:'компании' },               labels: { vi:'Công ty',        en:'Companies',       zh:'公司',       ko:'회사',       ru:'Компании' },               hasIndex: false, hasTerm: false },
  { entity: 'hub-kham-pha',     segments: { vi:'kham-pha',         en:'things-to-do',    zh:'玩乐',       ko:'즐길거리',   ru:'развлечения' },            labels: { vi:'Khám phá',       en:'Things to do',    zh:'玩乐',       ko:'즐길거리',   ru:'Развлечения' },            hasIndex: false, hasTerm: false },
  { entity: 'hub-luu-tru',      segments: { vi:'luu-tru',          en:'where-to-stay',   zh:'住宿',       ko:'숙소',       ru:'проживание' },             labels: { vi:'Lưu trú',        en:'Where to stay',   zh:'住宿',       ko:'숙소',       ru:'Проживание' },             hasIndex: false, hasTerm: false },
  { entity: 'hub-am-thuc',      segments: { vi:'am-thuc',          en:'food',            zh:'美食',       ko:'먹거리',     ru:'еда' },                    labels: { vi:'Ẩm thực',        en:'Food',            zh:'美食',       ko:'먹거리',     ru:'Еда' },                    hasIndex: false, hasTerm: false },
  { entity: 'hub-di-lai',       segments: { vi:'di-lai',           en:'getting-around',  zh:'交通',       ko:'교통',       ru:'транспорт' },              labels: { vi:'Đi lại',         en:'Getting around',  zh:'交通',       ko:'교통',       ru:'Транспорт' },              hasIndex: false, hasTerm: false },
  { entity: 'hub-all',          segments: { vi:'tat-ca',           en:'all',             zh:'all',        ko:'all',        ru:'all' },                    labels: { vi:'Tất cả',         en:'All',             zh:'全部',       ko:'전체',       ru:'Все' },                    hasIndex: false, hasTerm: false },
]

export function lookupRoute(segment: string, lang: Lang): RouteEntry | null {
  return ROUTE_MAP.find(r => r.segments[lang] === segment) ?? null
}

export function isTermEntity(entity: string): boolean {
  return entity === 'experience' || entity === 'tour'
}
