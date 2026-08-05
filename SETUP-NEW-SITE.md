# Dựng site mới bằng fork-and-edit

Runbook dựng một site mới bằng cách **copy engine của Core rồi sửa các bảng cấu hình có sẵn**.
Không viết code cơ chế mới (quyết định đường A, xem `docs/adr/ADR-0020`). Engine đã đọc bảng,
nên dựng site mới chủ yếu là: đổi định danh, khai địa phương, chọn module, xóa module thừa,
viết lại phần nội dung trang.

Runbook này grounded trên code thật đã fork từ nhatrangtravel. Mọi đường dẫn là có thật.

## 0. Yêu cầu

Node 20 (`.nvmrc`). Đăng nhập CLI: `npx wrangler login`, `npx sanity login`. Tài khoản
GitHub, Cloudflare, Sanity.

## 1. Copy engine thành site mới

```
cp -R CoreSchemaProject <ten-site> && cd <ten-site>
rm -rf .git node_modules dist .astro cms/node_modules scripts/node_modules
git init
```

`playbook/` và `docs/` là lớp luật + đặc tả tham chiếu, giữ lại đọc. Không sửa `playbook/`.

## 2. Đổi định danh (4 chỗ)

| File | Sửa gì |
|---|---|
| `astro.config.mjs` | `site: 'https://<domain-moi>'` |
| `wrangler.toml` | `name = "<ten-project>"` |
| `package.json` | `"name"` + `--project-name` trong 2 script `deploy` |

**Gai cần biết:** domain `https://nhatrangtravel.net` bị hardcode làm fallback trong **28 file
component** (dòng `Astro.site?.toString() || 'https://nhatrangtravel.net'`). Fallback chỉ chạy
khi `Astro.site` rỗng — mà bước trên đã đặt `site` nên thực tế không kích hoạt. Nhưng nên dọn
cho sạch bằng một lệnh:

```
grep -rl "nhatrangtravel.net" src | xargs sed -i '' 's#https://nhatrangtravel.net#https://<domain-moi>#g'
```

## 3. Khai địa phương (tham số site)

| Tham số | File | Ghi chú |
|---|---|---|
| Tập ngôn ngữ | `src/lib/types.ts` (`type Lang`) + `astro.config.mjs` (`locales`) | Site chỉ vi+en thì để `'vi' \| 'en'`. Bỏ ngôn ngữ thừa. |
| Tiền tệ | `src/lib/resolver.ts`, `renderer.ts`, `dates.ts`, `serialize/utils.ts`, `types.ts` | Đổi `VND` → tiền tệ site (SGD, USD...). ~5 file engine. |
| Địa danh | `src/lib/geoKnowledge.ts` (419 dòng dữ liệu Nha Trang) | Xóa/thay bằng dữ liệu địa lý site mới, hoặc để rỗng nếu chưa cần. |

## 4. Chọn module theo loại hình (preset)

Core có 14 module entity. Site bật cái cần, xóa cái thừa. Gợi ý preset:

**Khách sạn đơn lẻ:** hotel, article, person, organization, place.
Xóa: tour, experience, restaurant, specialty, resort, event, attraction, touristDestination, category.

**Nhà hàng:** restaurant, specialty, article, person, organization, place.
Xóa: tour, experience, hotel, resort, event, attraction, touristDestination.

**Công ty du lịch (gần đủ):** tour, experience, place, attraction, hotel, resort, event, article,
person, organization, touristDestination, category. Bỏ những cái không kinh doanh.

## 5. Xóa một module (6 chỗ cho mỗi entity)

Mỗi entity gắn ở đúng 6 nơi. Xóa entity `<x>` nghĩa là bỏ cả 6:

1. `cms/schemas/<x>.ts` — xóa file, và bỏ dòng trong `cms/schemas/index.ts` (`schemaTypes`).
2. `src/lib/queries/<x>.ts` — xóa file, bỏ export trong `src/lib/queries/index.ts`.
3. `src/components/<X>Detail.astro` — xóa file.
4. `src/lib/serialize/<x>.ts` — xóa file, bỏ khỏi bảng `TYPE_LD_MAP` (`serialize/utils.ts`).
5. `src/lib/routes.ts` — bỏ dòng entity trong `ROUTE_MAP`.
6. `src/components/RouteDispatch.astro` — bỏ dòng trong `DETAIL` và `INDEX_QUERY`.

Sau khi xóa, chạy `npm run build` (mục 8) để bắt tham chiếu còn sót.

## 6. Viết lại nội dung trang (chrome + copy)

Phần này là nội dung, không phải cơ chế — viết lại theo site:

- `src/components/Header.astro`, `Footer.astro`, `SiteHome.astro` — tên thương hiệu, menu.
- `src/lib/homepage.ts` — `HOME_COPY` (tiêu đề, hub, trust items).
- `src/lib/uiCopy.ts` — 56KB label/copy đa ngôn ngữ. Bỏ ngôn ngữ thừa, sửa copy Nha Trang.
- `src/pages/index.astro`, `[lang]/index.astro`, `404.astro` — trang chủ + 404.

## 7. Tạo Sanity project + .env

```
cd cms && npx sanity@latest init --project-name "<ten>" --dataset production --visibility private --output-path .
npx sanity tokens add "cloudflare-read" --role=viewer
```

Copy `.env.example` → `.env`, điền `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET=production`,
`SANITY_READ_TOKEN`.

## 8. Chạy thử + cổng

```
npm install
npm run dev            # xem trang
npm run build          # astro check + build — bắt lỗi tham chiếu sau khi xóa module
npm run build:strict   # chuỗi fail-closed đầy đủ (validator + build + post)
```

Core mặc định fail-closed (ADR-0010/0018), không kế thừa ADR-0019. Muốn nới cổng thì tự ghi
ADR riêng cho site.

## 9. Deploy (Cloudflare Pages)

GitHub repo mới → Cloudflare Pages Import Git repo. Build `npm run build:ci`, output `dist`,
biến env `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET=production`, `SANITY_READ_TOKEN`,
`NODE_VERSION=20`. Thêm Deploy Hook + Sanity webhook để auto-deploy khi publish. Gắn custom domain,
cập nhật `site` trong `astro.config.mjs` cho khớp.

## 10. Chuyển hướng URL — làm trong repo, KHÔNG làm trên dashboard

Mọi luật chuyển hướng của site nằm ở `public/_redirects`. Cú pháp một dòng ba trường:

```
<đường dẫn cũ>    <đích>    <mã>
```

- Đích được phép là URL tuyệt đối sang domain khác.
- Mã hợp lệ: `301`, `302`, `303`, `307`, `308`. Mặc định `302` nếu bỏ trống.
- `/` khớp **đúng** trang chủ. Muốn toàn site thì dùng `/*`.
- Query string **luôn được giữ nguyên**, không có tuỳ chọn tắt.
- Luật thắng cả file tĩnh đang tồn tại ở cùng đường dẫn: *"Redirects are always followed,
  regardless of whether or not an asset matches the incoming request"*.

### Gai lớn nhất: Page Rules KHÔNG chạy nếu host là Worker

Nếu hostname được phục vụ bởi **Worker** (không phải Pages), Cloudflare **vô hiệu hoá 18 Page
Rules** cho request đó, gồm `Forwarding URL` và `Always Use HTTPS`. Tài liệu ghi bảng
`Client → Worker = Rule Ignored`. Luật cấu hình xong trông vẫn "Active" trên dashboard nhưng
không bao giờ chạy — rất tốn thời gian dò.

Hệ quả:
- Đừng cấu hình chuyển hướng bằng Page Rules cho site chạy trên Worker.
- `Always Use HTTPS` bật hay tắt cũng vô nghĩa trên host đó.
- `_redirects` không dính vấn đề này vì nó nằm **bên trong** lớp phục vụ asset, không đi qua
  tầng Rules.

Dấu hiệu nhận biết host là Worker: `curl -sI <domain>/index.html` trả `307` về `/`, và mọi
đường dẫn kể cả đường dẫn không tồn tại đều trả `cf-cache-status: HIT` (đó là asset store của
Worker, không phải cache edge — nên **purge cache không giải quyết được gì**).

### Deploy sau khi sửa `_redirects`

Lệnh phụ thuộc site chạy trên gì. Kiểm bằng `npx wrangler pages project list`:

| Host | Lệnh |
|---|---|
| Cloudflare Pages | `npm run build && npx wrangler pages deploy dist --project-name <ten>` |
| Worker (`[assets]` trong `wrangler.toml`) | `npm run build && npx wrangler deploy` |

Nếu `wrangler` hỏi *"The project you specified does not exist. Would you like to create it?"* →
**không chọn Create**. Đó là dấu hiệu lệnh deploy trỏ sai loại host; tạo mới sẽ dựng ra một đích
rỗng không phục vụ domain thật.

### Kiểm chứng

```
curl -sI https://<domain>/ | head -1
curl -sI https://<domain>/sitemap.xml | head -1
```

`/sitemap.xml` **phải** trả `200`. Nếu nó bị nuốt vào luật chuyển hướng thì validator R3
fail-closed ở mọi build sau (R3 fetch sitemap production để so sánh).

Đừng dùng trình duyệt để kiểm — dùng `curl`, tránh cache máy.

## Tóm tắt: dựng site khách sạn Đà Lạt cần đụng đâu

Định danh (mục 2, 4 chỗ) → ngôn ngữ vi+en + tiền tệ VND (mục 3) → xóa 9 module không dùng
(mục 5) → viết lại chrome + homepage (mục 6) → Sanity + deploy (mục 7-9). Không viết dòng code
cơ chế nào; chỉ sửa bảng và xóa file.
