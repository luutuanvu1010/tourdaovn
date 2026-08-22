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

## ĐANG BẬT: trang chủ chuyển hướng sang tourdaonhatrang.com

**Trạng thái: đang chạy trên production** từ 2026-08-06. Căn cứ `QĐ-2026-08-06-02` và
`QĐ-2026-08-06-04` trong `docs/DECISIONS.md`.

Vào `https://tourdao.vn/` sẽ bị đưa sang `https://tourdaonhatrang.com/` bằng `302`. Trang con
(`/nha-trang/`, `/lien-he/`...) và `/sitemap.xml` **không** bị đụng, vẫn trả `200`.

Luật nằm ở dòng cuối `public/_redirects`:

```
/    https://tourdaonhatrang.com/    302
```

### Cách gỡ

**1.** Xoá dòng trên trong `public/_redirects`, xoá luôn khối chú thích "Phần 2. Điều hướng tạm
thời" ngay phía trên nó. Giữ nguyên Phần 1 — đó là phần R3, không liên quan.

**2.** Deploy:

```
npm run deploy
```

Xem mục "Deploy" ở cuối file này.

**3.** Kiểm:

```
curl -sI https://tourdao.vn/ | head -1
```

Gỡ xong khi trả `200` thay vì `302`. Không cần purge cache, không cần đụng dashboard Cloudflare.

**4.** Ghi một mục mới trong `docs/DECISIONS.md` để đóng `QĐ-2026-08-06-02`. Không sửa mục cũ.

### Vì sao không làm bằng Page Rules

Đã thử hai lần, thất bại cả hai. `tourdao.vn` do Worker phục vụ nên Cloudflare vô hiệu hoá
`Forwarding URL` (`Client → Worker = Rule Ignored`). Chi tiết cơ chế ở `SETUP-NEW-SITE.md` mục 10.

---

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
