# tourdaovn — ghi chú dựng site + việc cần làm ở máy

Site dựng từ Core (fork-and-edit) ngày 2026-07-22. Đây là phép thử để kiểm Core.

## Đã làm (trong phiên Cowork)

- **Fork engine** từ CoreSchemaProject: 125 file src, 20 schema, 11 validator, lib giá/route/i18n.
- **Định danh:** domain `tourdaovn.vn`, project `tourdaovn`; dọn 28 file domain fallback.
- **Chỉ tiếng Việt:** `locales: ['vi']`, `LANGS = ['vi']`, tắt `getStaticPaths` 2 route `[lang]`,
  xóa 4 sitemap ngoại ngữ. KHÔNG đụng `type Lang` (tránh cascade 49 chỗ).
- **Trim module:** giữ tour, hotel, resort, article, person, place, attraction, experience
  (+ organization, category, touristDestination structural). Gỡ khỏi ROUTE_MAP:
  restaurant, specialty, event, hub-am-thuc. Sửa hub hardcode ở Header/HomeHubGrid/
  TouristDestinationHub/EmptyState + Footer. File schema/query của module gỡ để **dormant**
  (không xóa — tránh gãy cross-reference).

## CẦN CHẠY Ở MÁY (sandbox không cài được deps)

```
cd tourdaovn
npm install
npm run build       # astro check + build — BẮT LỖI TYPE nếu còn
```

Nếu build báo lỗi tham chiếu tới entity đã gỡ, xem `SETUP-NEW-SITE.md` mục 5 (cảnh báo
hub hardcode + cross-ref). Phần lớn engine null-safe nên nhiều khả năng sạch, nhưng chưa
build-verify được trong sandbox.

## Còn phải làm (nội dung site)

- Sanity project riêng + `.env` (mục 7 runbook).
- Viết lại chrome/nội dung: `Header`, `Footer`, `SiteHome`, `homepage.ts` (HOME_COPY),
  `uiCopy.ts` — hiện còn copy Nha Trang.
- `geoKnowledge.ts` còn dữ liệu Nha Trang — thay hoặc để rỗng.
- touristDestination hiện hardcode slug `nha-trang` ở trang chủ — đổi theo điểm đến thật.

## Điểm dormant còn lại (vô hại, dọn sau nếu muốn)

`RouteDispatch` HUB_PARTS_CONFIG `hub-am-thuc` + `hub-all` liệt kê restaurant/specialty/event;
`uiCopy.ts` giữ copy các entity đã gỡ. Không route nên không render, không gãy build.
