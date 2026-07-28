import type { Lang } from './types'
import {
  enabledRoutes,
  isRouteEnabled,
  entities as ENTITY_FLAGS,
  hubs as HUB_FLAGS,
} from '../site.config'

/** Mọi mục ĐÃ ĐƯỢC KHAI trong site.config, kể cả mục đang để false. */
const DECLARED_KEYS = new Set<string>([
  ...Object.keys(ENTITY_FLAGS),
  ...Object.keys(HUB_FLAGS),
])

export interface RouteEntry {
  entity: string
  segments: Record<Lang, string>
  labels: Record<Lang, string>
  hasIndex: boolean
  hasTerm: boolean
}

/**
 * BẢNG ĐỊA CHỈ URL — chỉ trả lời "mục này nằm ở đường dẫn nào".
 *
 * Việc BẬT/TẮT một mục KHÔNG nằm ở đây, mà ở `src/site.config.ts`.
 * Bảng này chỉ là danh mục địa chỉ; `ROUTE_MAP` bên dưới đã được lọc theo
 * công tắc trong site.config, nên phần còn lại của code không cần biết
 * mục nào đang bật hay tắt.
 */
const ROUTE_TABLE: RouteEntry[] = [
  { entity: 'place',            segments: { vi:'dia-danh',         en:'places',          zh:'地点',       ko:'장소',       ru:'места' },                  labels: { vi:'Địa danh',      en:'Places',          zh:'地点',       ko:'장소',       ru:'Места' },                  hasIndex: true,  hasTerm: false },
  { entity: 'attraction',       segments: { vi:'diem-tham-quan',   en:'attractions',     zh:'景点',       ko:'명소',       ru:'достопримечательности' }, labels: { vi:'Điểm tham quan', en:'Attractions',     zh:'景点',       ko:'명소',       ru:'Достопримечательности' }, hasIndex: true,  hasTerm: false },
  { entity: 'experience',       segments: { vi:'trai-nghiem',      en:'experiences',     zh:'体验',       ko:'체험',       ru:'впечатления' },            labels: { vi:'Trải nghiệm',    en:'Experiences',     zh:'体验',       ko:'체험',       ru:'Впечатления' },            hasIndex: true,  hasTerm: true },
  { entity: 'hotel',            segments: { vi:'khach-san',        en:'hotels',          zh:'酒店',       ko:'호텔',       ru:'отели' },                  labels: { vi:'Khách sạn',      en:'Hotels',          zh:'酒店',       ko:'호텔',       ru:'Отели' },                  hasIndex: true,  hasTerm: false },
  { entity: 'resort',           segments: { vi:'resort',           en:'resorts',         zh:'度假村',     ko:'리조트',     ru:'курорты' },                labels: { vi:'Resort',         en:'Resorts',         zh:'度假村',     ko:'리조트',     ru:'Курорты' },                hasIndex: true,  hasTerm: false },
  { entity: 'tour',             segments: { vi:'tour',             en:'tours',           zh:'旅行团',     ko:'투어',       ru:'туры' },                   labels: { vi:'Tour',           en:'Tours',           zh:'旅行团',     ko:'투어',       ru:'Туры' },                   hasIndex: true,  hasTerm: true },
  { entity: 'article',          segments: { vi:'cam-nang',         en:'guides',          zh:'攻略',       ko:'가이드',     ru:'гайды' },                  labels: { vi:'Cẩm nang',       en:'Guides',          zh:'攻略',       ko:'가이드',     ru:'Гайды' },                  hasIndex: true,  hasTerm: false },
  { entity: 'person',           segments: { vi:'tac-gia',          en:'authors',         zh:'作者',       ko:'작가',       ru:'авторы' },                 labels: { vi:'Tác giả',        en:'Authors',         zh:'作者',       ko:'작가',       ru:'Авторы' },                 hasIndex: false, hasTerm: false },
  { entity: 'organization',     segments: { vi:'cong-ty',          en:'companies',       zh:'公司',       ko:'회사',       ru:'компании' },               labels: { vi:'Công ty',        en:'Companies',       zh:'公司',       ko:'회사',       ru:'Компании' },               hasIndex: false, hasTerm: false },
  { entity: 'hub-kham-pha',     segments: { vi:'kham-pha',         en:'things-to-do',    zh:'玩乐',       ko:'즐길거리',   ru:'развлечения' },            labels: { vi:'Khám phá',       en:'Things to do',    zh:'玩乐',       ko:'즐길거리',   ru:'Развлечения' },            hasIndex: false, hasTerm: false },
  { entity: 'hub-luu-tru',      segments: { vi:'luu-tru',          en:'where-to-stay',   zh:'住宿',       ko:'숙소',       ru:'проживание' },             labels: { vi:'Lưu trú',        en:'Where to stay',   zh:'住宿',       ko:'숙소',       ru:'Проживание' },             hasIndex: false, hasTerm: false },
  { entity: 'hub-di-lai',       segments: { vi:'di-lai',           en:'getting-around',  zh:'交通',       ko:'교통',       ru:'транспорт' },              labels: { vi:'Đi lại',         en:'Getting around',  zh:'交通',       ko:'교통',       ru:'Транспорт' },              hasIndex: false, hasTerm: false },
  { entity: 'hub-all',          segments: { vi:'tat-ca',           en:'all',             zh:'all',        ko:'all',        ru:'all' },                    labels: { vi:'Tất cả',         en:'All',             zh:'全部',       ko:'전체',       ru:'Все' },                    hasIndex: false, hasTerm: false },
]

// ───────────────────────────────────────────────────────────────────────────
//  BỘ KIỂM CHỐNG LỆCH — chạy lúc build, mặc định TỪ CHỐI
//  (Hiến pháp Điều 8.5: không có bằng chứng đạt thì coi như chưa đạt.)
//
//  Bắt hai kiểu sai:
//   (a) Bật một mục trong site.config nhưng quên khai địa chỉ URL cho nó
//       → mục đó sẽ im lặng biến mất khỏi site. Nay build DỪNG.
//   (b) Khai địa chỉ URL cho một mục chưa hề có trong site.config
//       → không ai biết mục đó đang bật hay tắt. Nay build DỪNG.
// ───────────────────────────────────────────────────────────────────────────
function assertRouteConfigConsistency(): void {
  const tableKeys = new Set(ROUTE_TABLE.map(r => r.entity))
  const problems: string[] = []

  for (const key of enabledRoutes) {
    if (!tableKeys.has(key)) {
      problems.push(
        `  • "${key}" đang BẬT trong site.config.ts nhưng chưa có địa chỉ URL trong routes.ts`,
      )
    }
  }

  for (const key of tableKeys) {
    if (!DECLARED_KEYS.has(key)) {
      problems.push(
        `  • "${key}" có địa chỉ URL trong routes.ts nhưng chưa được khai trong site.config.ts`,
      )
    }
  }

  if (problems.length > 0) {
    throw new Error(
      '\n\n[site.config] Cấu hình site không khớp bảng địa chỉ URL:\n' +
        problems.join('\n') +
        '\n\nSửa src/site.config.ts hoặc src/lib/routes.ts cho khớp rồi build lại.\n',
    )
  }
}

assertRouteConfigConsistency()

/**
 * Bảng địa chỉ THỰC TẾ của site — đã lọc theo công tắc trong site.config.ts.
 * Đây là thứ mọi nơi khác trong code phải dùng.
 */
export const ROUTE_MAP: RouteEntry[] = ROUTE_TABLE.filter(r => isRouteEnabled(r.entity))

export function lookupRoute(segment: string, lang: Lang): RouteEntry | null {
  return ROUTE_MAP.find(r => r.segments[lang] === segment) ?? null
}

export function isTermEntity(entity: string): boolean {
  return entity === 'experience' || entity === 'tour'
}
