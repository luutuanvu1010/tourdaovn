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

## ĐÃ GỠ: trang chủ từng chuyển hướng sang tourdaonhatrang.com

**Trạng thái: đã gỡ 2026-08-13**, commit `541ec26` ("go chuyen huong tam cua trang chu"),
căn cứ `SPEC-2026-08-13-menu-chinh-bon-muc` — site công bố, trang chủ phục vụ nội dung
thật và đã lên menu chính. Bật từ 2026-08-06 theo `QĐ-2026-08-06-02` / `QĐ-2026-08-06-04`.

Kiểm 2026-08-22: `curl -sI https://tourdao.vn/` trả `200`. Dòng luật trong
`public/_redirects` đã bị ghi chú lại (`#/    https://tourdaonhatrang.com/    302`), giữ
làm dấu vết chứ không xoá hẳn.

> **Mục này từng ghi "ĐANG BẬT ... đang chạy trên production" tới tận 2026-08-22** — chín
> ngày sau khi luật đã gỡ khỏi code, kèm nguyên một quy trình "Cách gỡ" cho thứ đã gỡ rồi.
> Xem DR-043. Cùng lúc đó phát hiện `QĐ-2026-08-06-04` **bước 6** — "ghi mục mới trong sổ
> để đóng `QĐ-2026-08-06-02`" — chưa từng được thi hành; nay đóng ở `QĐ-2026-08-22-04`.

### Vì sao khi đó không làm bằng Page Rules

Giữ lại vì cơ chế còn đúng cho mọi lần chuyển hướng sau. Đã thử hai lần, thất bại cả hai:
`tourdao.vn` do Worker phục vụ nên Cloudflare vô hiệu hoá `Forwarding URL`
(`Client → Worker = Rule Ignored`). Mọi luật chuyển hướng của site này phải nằm ở
`public/_redirects`. Chi tiết cơ chế ở `SETUP-NEW-SITE.md` mục 10.

---

## Module đặt tour (ADR-0027) — việc một lần và cách xem đơn

Đơn từ form trên trang tour đi vào D1 `tourdao-booking` (bảng `booking`), rồi báo về email
(**Amazon SES**) và Zalo Bot. Bí mật đặt bằng `wrangler secret put`, **8 tên**:
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_REGION`, `BOOKING_NOTIFY_EMAIL`,
`ZALO_BOT_TOKEN`, `ZALO_BOT_CHAT_IDS`, `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`. Site key
Turnstile là biến build `PUBLIC_TURNSTILE_SITE_KEY` trong `.env`. Chi tiết từng bước
(D1, SES, tạo bot Zalo, Turnstile, WAF): `docs/specs/SPEC-2026-08-21-dat-tour.md` §6,
`docs/plans/2026-08-22-dat-tour.md` Task 13.

### Thứ tự bắt buộc: đặt bí mật và tạo luật WAF TRƯỚC lần deploy đầu tiên

Không phải mục tham khảo. Đây là **điều kiện tiên quyết** của lần `npm run deploy` đầu tiên có
`main` trong `wrangler.toml`. Làm đủ **8 `wrangler secret put`** ở trên **và** luật WAF Rate
limiting cho `/api/dat-tour` (SPEC §6 bước 6) **rồi mới** deploy.

Deploy trước khi làm hai việc đó thì `/api/dat-tour` là **đường ghi công khai duy nhất của
site** trong trạng thái hỏng, mỗi thứ hỏng một kiểu:

| Thiếu | Hậu quả thật |
|---|---|
| `TURNSTILE_SECRET_KEY` | endpoint **từ chối mọi đơn bằng 503** (cổng cấu hình trong `handler.ts`; xem SPEC §4.7 "hỏng ồn ào, không hỏng câm"). Form trên trang tour coi như chết — khách bấm gửi, nhận "Chưa gửi được", và **không có đơn nào tới**. Cửa thoát `BOOKING_ALLOW_NO_TURNSTILE=1` chỉ đặt ở `.dev.vars`, **không bao giờ** trên production |
| `IP_HASH_SALT` | `ip_hash` = `null` → **toàn bộ khối đếm tần suất bị nhảy qua**, đơn vẫn vào D1 bình thường. Chỉ có một dòng `console.warn` báo, không có tín hiệu nào khác |
| luật WAF | không có gì chặn **lượt yêu cầu** (xem mục dưới) |
| `AWS_*` / `BOOKING_NOTIFY_EMAIL` / `ZALO_*` | đơn vẫn vào D1, nhưng **không ai được báo** — cột `notify_email`/`notify_zalo` ghi `skipped`, và không ai gọi lại cho khách |

### Ưu đãi thanh toán trước (ADR-0031) — hai việc bắt buộc, đúng thứ tự, trước khi bật

1. **Chạy migration trước khi merge/push nhánh này vào `main`**:
   `npx wrangler d1 migrations apply tourdao-booking --remote`. Site này nối Workers Builds
   với `main` (mục "Có đường thứ hai: Cloudflare tự dựng từ GitHub" dưới `## Deploy`) —
   **không có một lần "deploy tay đầu tiên" nào để đứng trước cả; merge vào `main` chính là
   deploy.** Nhánh lên `main` mà migration chưa chạy thì Cloudflare tự dựng và thay Worker
   **ngay khi build xong**, còn câu `INSERT` của nó đã kê tên cột `payment_method` chưa tồn
   tại trong D1 production: **mọi đơn đặt tour trả về 500** — không riêng đơn chọn chuyển
   khoản, không riêng trang có bật ưu đãi — cho tới khi có người nhận ra.
2. **Deploy Studio trước khi vào Studio bật công tắc**: `cd cms && npx sanity deploy`.
   `cms/sanity.cli.ts` khai `studioHost: 'tourdaovn'` — Studio này là bản **đã dựng, host
   sẵn**, merge code không tự cập nhật nó. Chưa deploy thì biên tập mở tài liệu vẫn thấy tiêu
   đề cũ "Giá theo mùa", không có nhóm ô "Ưu đãi thanh toán trước", và phần trăm mãi là 0 —
   tính năng coi như chưa tồn tại dù Worker đã chạy bản mới.

Xong hai việc trên mới vào Studio mở *Quy tắc giá*, bật công tắc, đặt phần trăm, Publish
(`docs/specs/SPEC-2026-08-30-uu-dai-thanh-toan-truoc.md` §7).

### Đặt chỗ mở sang trang Trải nghiệm (ADR-0033) — ba việc, đúng thứ tự, trước khi khách đặt được

1. **Chạy migration `0003` trước khi merge/push nhánh này vào `main`**:
   `npx wrangler d1 migrations apply tourdao-booking --remote`. Cùng cửa sổ rủi ro với mục
   ADR-0031 ở trên — merge vào `main` chính là deploy (Workers Builds). `store.ts` đã liệt
   `product_type` trong câu `INSERT`; nhánh lên `main` mà migration chưa chạy thì **mọi đơn đặt
   chỗ trả về 500** — cả tour lẫn trải nghiệm, không riêng đơn nào — cho tới khi migration chạy.
2. **Sửa khoá hoa trong Google Sheet rồi chạy `npm --prefix scripts run prices:pull`**: tab `gia`
   đang có dòng `Fly-board-nha-trang` viết hoa — `prices-pull.mjs` chỉ nhận khoá chữ thường, một
   dòng sai hình chặn cứng cả lượt pull (khác lỗi *đơn vị lạ* — cái đó giờ chỉ cảnh báo-và-bỏ-qua,
   ADR-0033 quyết định 4). Việc của chủ dự án, không phải việc sửa mã. Xong thì xác nhận
   `data/prices.yaml` có đủ dòng `TTB01–TTB08`, và **`phao-chuoi` với `phao-bay-flying-banana-boat`
   trỏ cùng một khoá `phao-chuoi`** (một sản phẩm, hai trang — ADR-0033 mục Hệ quả).
3. **Gắn `bookingRef.key` cho từng document Trải nghiệm trong Studio rồi Publish.** Trường này đã
   có sẵn trong lược đồ (không phải field mới, không cần `sanity deploy`) — việc còn lại chỉ là
   điền đúng khoá. Đây là **công tắc thật, không phải bước phụ**: mã đã đúng từ trước, nhưng thiếu
   khoá này thì `showBookingForm` luôn `false` và không trang Trải nghiệm nào đổi gì. Hook Sanity
   → Workers Builds đã bật (xem "Bấm Publish trong Sanity KHÔNG còn dựng lại site" — mục đó nói về
   *trước* 27/8; từ 27/8 Publish tự kéo một bản dựng mới), nên không cần thao tác thủ công nào
   thêm sau khi Publish.

Thiếu bước 2 hoặc 3 thì site vẫn chạy đúng, chỉ là **không trang Trải nghiệm nào mọc form** —
đúng như thiết kế (đợi dữ liệu), không phải lỗi. Thiếu bước 1 mới là thứ làm site *hỏng*.

### Bộ đếm tần suất trong endpoint KHÔNG phải là chặn lượt yêu cầu

Bộ đếm trong `handler.ts` đếm **số đơn đã tạo** (đã qua Turnstile, đã INSERT) trong 10 phút cho
mỗi `ip_hash` — 5 đơn/10 phút. Nó **không** giới hạn số **lượt yêu cầu**. Chặn theo lượt nằm
**hoàn toàn** ở luật WAF Rate limiting (10 yêu cầu / 10 giây / IP, SPEC §4.10 lớp 3).

Không có luật WAF nghĩa là **không có gì chặn lượt** — kể cả khi Turnstile đã bật, vì mỗi lượt
sai token vẫn tốn một lời gọi siteverify và một vòng xử lý của Worker.

### Đường lùi nếu deploy hỏng

Đây là **cửa một chiều đầu tiên** của hệ: từ lúc `wrangler.toml` có `main`, `npm run deploy`
đưa cả một Worker lên trước mọi asset tĩnh — trước đó site chỉ là asset.

Nếu sau deploy site lỗi 500 hàng loạt (không riêng `/api/dat-tour`):

1. Gỡ dòng `main = "./dist/_worker.js/index.js"` khỏi `wrangler.toml`.
2. `npm run deploy` lại.

Site quay về đúng trạng thái trước ADR-0027: mọi trang là asset tĩnh, `/api/dat-tour` trả 404,
form đặt tour hỏng nhưng **phần còn lại của site sống**. Đơn đã nằm trong D1 không mất.
`npx wrangler rollback` cũng lùi được một version, nhưng gỡ `main` là đường chắc chắn hơn vì nó
bỏ hẳn Worker khỏi đường phục vụ thay vì đổi sang một bản Worker khác.

### Cho nhân viên đọc đơn: mọi con số trong thư báo là chữ khách gửi lên

Thư báo và tin Zalo dựng lại từ **payload do trình duyệt khách gửi** — tên tour, ngày, số
người, giá mỗi hạng, **kể cả dòng "Tạm tính"**. Server chỉ kiểm **nhất quán** (tổng có khớp
Σ số người × đơn giá khách gửi không), **không** đối chiếu lại với bảng giá thật: `BK1` cấm
endpoint đọc giá lúc chạy.

Nghĩa là một khách sửa được số trong trình duyệt có thể làm thư báo hiện "Tạm tính 10.000₫" mà
vẫn hợp lệ về mặt kiểm. **Gọi điện xác nhận vẫn là bước bắt buộc**, và giá chốt là giá trong
`data/prices.yaml`, không phải số trong thư.

Kênh email hỏng thì đơn **vẫn vào D1** — luôn đọc cột `notify_email`, đừng chỉ nhìn HTTP 201.
`failed:http 403` nghĩa là chữ ký/quyền IAM sai; `failed:http 400` thường là SES còn trong
sandbox hoặc sai `AWS_SES_REGION`; `skipped` nghĩa là thiếu bí mật.

Xem đơn:

```
env -u CLOUDFLARE_API_TOKEN -u CF_API_TOKEN npx wrangler d1 execute tourdao-booking --remote --env-file /dev/null \
  --command "SELECT code, created_at, tour_title, depart_date, customer_name, phone, status, notify_email, notify_zalo FROM booking ORDER BY id DESC LIMIT 50"
```

Đơn chưa báo được: thêm `WHERE COALESCE(notify_email,'') <> 'sent' AND COALESCE(notify_zalo,'') <> 'sent'`.
**Phải có `COALESCE`, không bỏ được:** hai cột này là `NULL` cho tới khi tác vụ nền ghi xong
trạng thái. Tác vụ đó chết giữa chừng (worker bị thu hồi, D1 lỗi thoáng qua) thì cột ở lại
`NULL` mãi — và `NULL <> 'sent'` trong SQL không phải đúng, nên **đơn tệ nhất — chưa một kênh
nào báo được — sẽ tàng hình** trước bản truy vấn không có `COALESCE`. Đã chứng minh bằng SQLite
thật ngày 2026-08-29 (rà soát toàn module).
Sao lưu: `… wrangler d1 export tourdao-booking --remote --output backups/booking-$(date +%F).sql`.
Đổi trạng thái: `UPDATE booking SET status='contacted' WHERE code='TD-…'`.

Thêm tour có giá: thêm dòng vào `data/prices.yaml` (khoá = slug tour, `amount` + `paxRates`),
rồi ghi đúng khoá đó vào Tour → bookingRef → key trong Studio; build lại là có form.

Nhớ: đã có `main` trong `wrangler.toml` nên `npm run deploy` deploy cả Worker; `wrangler d1
migrations apply … --remote` là bước riêng khi có migration mới.

## Deploy

```
npm run deploy            # dựng lại rồi đưa lên production
npm run deploy:preview    # dựng lại rồi tải lên một version, KHÔNG đổi bản đang chạy
```

### Có đường thứ hai: Cloudflare tự dựng từ GitHub

Lệnh trên **không phải** đường duy nhất đưa bit lên `tourdao.vn`. Worker `tourdaovn` có
**nối git** (Workers Builds ↔ `luutuanvu1010/tourdaovn`, nhánh `main`). Mỗi lần đẩy lên
`main` là Cloudflare tự clone, dựng và thay bản đang chạy.

Điểm phải nhớ, vì nó đã cắn một lần rồi (DR-041): **bản dựng đó lấy code từ `origin/main`
trên GitHub, không lấy từ máy ông.** Commit chưa push thì không có mặt trong đó. Và nó
**thay thế** version đang chạy — kể cả version vừa `npm run deploy` bằng tay. Ngày
2026-08-22, cả đợt 4A đã "deploy thành công" rồi bị một bản dựng phía Cloudflare (code
ngày 14-08) đè mất; `wrangler` in `Success`, `curl` trả `200`, chỉ nội dung là của hai
tuần trước. Không có tín hiệu hỏng nào.

Nên luật là: **push trước, deploy tay sau.** Ngược lại thì công deploy có thể bốc hơi.

Kiểm hai bên có khớp không:

```
git status -sb | head -1                  # phải KHÔNG có "ahead"
```

### Bấm Publish trong Sanity KHÔNG còn dựng lại site

**Từ 2026-08-22** (`QĐ-2026-08-22-03`). Webhook `Cloudflare rebuild` trong Sanity đã
**tắt** — tắt chứ không xoá, URL và rule còn nguyên, bật lại là đảo một cờ.

Trước đó, publish một document sẽ POST vào một Deploy Hook của Cloudflare và kích một lần
dựng lại toàn site. Ngắt vì mỗi lần dựng đọc lại **toàn bộ** nội dung qua Sanity Content
API, mà hook không có debounce (25 lần bắn trong một ngày, 4 lần trong 6 giây).

**Hệ quả trực tiếp cho người vận hành:** sửa nội dung trong Studio, bấm Publish, rồi mở
`tourdao.vn` sẽ **không thấy gì đổi**. Đó không phải lỗi. Phải chạy:

```
npm run deploy
```

Đây là loại lệch im lặng, không có kiểm máy nào nhắc. Cùng hạng nợ với `favicon.svg`
(`QĐ-2026-08-14-01`) và schema Studio lệch bản đã deploy (`QĐ-2026-08-14-02`).

Muốn bật lại: xử DR-042 trước (rule hiện chỉ nghe `create`, không lọc type, không
debounce), push hết commit đang treo, rồi mới bật.

### Site này chạy trên Worker, không phải Pages

Đây là chỗ đã từng gài bẫy. Tới 2026-08-14, hai script trên còn là `wrangler pages deploy`
trỏ vào một Pages project tên `tourdaovn` **không tồn tại**; chạy `npm run deploy` sẽ được hỏi
"Would you like to create it?", và bấm Create là dựng một site thứ hai song song với site
thật. `BUILD-NOTES.md` khi đó dặn "đừng dùng `npm run deploy`, gõ tay `npx wrangler deploy`"
— tức là **sửa người thay vì sửa lệnh**. Nay lệnh đã đúng nên lời dặn đó bỏ.

### Vì sao mỗi mảnh trong lệnh có mặt ở đó

`package.json` không mang được chú thích, nên lý do nằm ở đây.

| Mảnh | Lý do |
|---|---|
| `npm run build &&` | thiếu nó thì `wrangler deploy` đẩy nguyên `dist/` cũ lên mà **không báo gì** — deploy "thành công" trong khi hàng thật là bản cũ. Đúng loại hỏng im lặng, nên gộp build vào lệnh thay vì trông vào việc người gõ nhớ chạy trước |
| `env -u CLOUDFLARE_API_TOKEN -u CF_API_TOKEN` | máy này còn dự án Cloudflare khác. Biến token lảng vảng trong shell sẽ **thắng** phiên đăng nhập OAuth, và wrangler lặng lẽ deploy vào nhầm tài khoản |
| `--env-file /dev/null` | chặn wrangler tự nạp file biến môi trường ở gốc kho. Hiện `wrangler.toml` không khai `vars` nào nên không có gì bị nạp — đã kiểm bằng `npx wrangler secret list` (trả `[]`) sau lần deploy 2026-08-14. Giữ cờ này làm lớp thứ hai: ngày nào đó ai thêm một `vars` vào `wrangler.toml`, secret sẽ tự chui lên Worker mà không ai gõ lệnh nào (N10, P21) |
| `wrangler versions upload` | bản Worker của "deploy thử": tải code lên thành một version, **không** đổi bản đang phục vụ khách. Không phải `wrangler deploy` |

### Kiểm sau khi deploy

```
npx wrangler versions list | head -20     # version mới nhất có đúng bản vừa đẩy không
curl -sI https://tourdao.vn/ | head -1    # phải 200
```

Lùi về bản trước: `npx wrangler rollback`.
