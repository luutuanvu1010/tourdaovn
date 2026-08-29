# tourdaovn — sổ tay hạn mức API Sanity

> Lập 2026-08-25, sau khi Sanity gửi cảnh báo *"TourDaoVN has used 100% of API Requests"*.
> Sổ này trả lời đúng một câu hỏi: **thao tác nào tốn hạn mức Sanity, thao tác nào không.**
> Lệnh phát hành và cơ chế đưa bit lên production nằm ở `BUILD-NOTES.md` mục "Deploy" — không
> chép lại ở đây.

## 1. Câu ngắn nhất

Sửa **nội dung** trong Studio và sửa **schema** gần như không tốn gì. Sửa **code rồi dựng lại
site** mới tốn: mỗi lần build đọc lại toàn bộ nội dung qua Content API, khoảng **300–450
request**. Và **mỗi lần push lên `main` là một lần build**, dù không ai gõ lệnh nào.

Trực giác tự nhiên là "đụng vào Sanity mới tốn hạn mức Sanity". Trực giác đó sai ở dự án này.

## 2. Trạng thái gói cước

Chốt 2026-08-25 (`QĐ-2026-08-25-07`): để Growth Trial hết hạn 2026-08-26T00:57Z (07:57 giờ VN)
và dự án **tự rơi về Free**, không nâng cấp.

| Tài nguyên | Hạn mức | Cho vượt? | Dùng lúc 25/8 |
|---|---|---|---|
| API Requests | 250.000 / tháng | **Không** | 247.5k (99%) |
| API CDN Requests | 1.000.000 / tháng | Không | **0 (0%)** |
| Bandwidth | 100 GB / tháng | Không | 2.2 GB |
| Documents | 10.000 | — | 244 |
| Assets | 100 GB | — | 333 MB |

- Free và Growth Trial có cùng hạn mức. Rơi về Free **không** làm hụt hạn mức API.
- `overageAllowed: false` → chạm trần là **chặn**, không phải tính phí vượt.
- Reset **00:00 UTC ngày 1 hằng tháng** = 07:00 sáng giờ VN. Không "trả lại" được: request đã
  tiêu là tiêu, xoá dữ liệu không giúp gì.
- Hệ quả của việc rơi về Free: mọi thành viên vai non-admin **thành viewer, mất quyền Publish**.
  Free chỉ có hai vai — `administrator` và `viewer`, không có nấc giữa. Tài khoản admin giữ
  nguyên toàn quyền. Ngày chốt có 4 người vai `editor` và 0 lịch publish hẹn giờ đang chờ.

## 3. Sanity đếm cái gì

- **1 truy vấn GROQ = 1 request** tới `pgedy374.api.sanity.io`. Không tính theo document, không
  tính theo dung lượng: một truy vấn trả 1 hay 200 document đều là một request.
- **Không tính**: request `OPTIONS`; request trả 4xx/5xx (kể cả 402 lúc bị chặn); và request
  phát ra từ chính ứng dụng của Sanity — **Studio và Dashboard được miễn**.
- **`apicdn.sanity.io` là xô riêng** 1.000.000/tháng, hiện dùng 0%.
- Ảnh phục vụ từ `cdn.sanity.io` tính vào **bandwidth**, không phải API request.

## 4. Chi phí từng thao tác

| Thao tác | Tốn bao nhiêu |
|---|---|
| Bấm Publish trong Studio | **0** — Studio được miễn; webhook `Cloudflare rebuild` đang tắt nên không kéo theo build |
| `cd cms && npm run dev` (Studio chạy máy) | **0** — Studio được miễn |
| `cd cms && npm run deploy` (`sanity deploy`) | vài chục request hạ tầng, **không đọc một document nào** |
| `git push origin main` | 0 trực tiếp — **nhưng kích hoạt Workers Builds → 300–450** |
| `npm run build` | **300–450** |
| `npm run deploy` | **300–450** (build nằm trong lệnh) |
| `npm run gate` | ~2 (`validate-min.ts` gọi 2 truy vấn) |
| `npm run dev` (Astro dev) | **~3 mỗi lần tải trang**, cộng dồn theo mỗi lần hot-reload |
| Script ghi (`publish:drafts`, `patch:n5`, `migrate/*`) | **1 request mỗi document** nếu không gộp transaction |

## 5. Vì sao mỗi lần build tốn ngần ấy

- `astro.config.mjs:6` là `output: 'static'` → toàn bộ 129 trang trong `dist/` được dựng sẵn
  lúc build. **Khách vào web không gọi Sanity lần nào.** Bằng chứng đối chứng: API CDN đứng ở
  0% suốt tháng — nếu có truy vấn lúc chạy thật, con số đó không thể bằng 0.
- Đổi lại, việc đọc dồn hết vào lúc build. `RouteDispatch.astro` gọi khoảng 3 truy vấn cho mỗi
  trang chi tiết (detail + nearby + alternate slugs), cộng các truy vấn ở `getStaticPaths`.
- Cả hai client đều tắt CDN — `src/lib/sanity.ts:131` và `scripts/lib/sanity-client.ts:18`
  đặt `useCdn: false` — nên mọi truy vấn đi thẳng vào xô 250k trong khi xô 1M nằm không.
  Đây là lựa chọn có lý do (build tĩnh cần dữ liệu mới nhất, đúng khuyến nghị của Sanity),
  không phải lỗi. Đổi sang `useCdn: true` là **quyết định kiến trúc, cần ADR**, không tự đổi.

## 6. Cái gì đã đốt hết tháng 8/2026

Không phải khách truy cập, không phải biên tập viên. Ba nguồn, theo thứ tự nặng dần:

1. **157 commit push lên `main`** → 157 bản dựng tự động của Workers Builds ≈ 50–70k request.
2. **`astro dev` chạy nền 21 tiếng liền** (24/8 18:00 → 25/8 tắt tay). Dev server không cache:
   mỗi lần tải trang, mỗi lần hot-reload là truy vấn mới.
3. Build tay, các phiên agent kiểm tự động chạy build trong worktree riêng, validator, script
   migrate, truy vấn MCP.

## 7. Luật vận hành

- **Không để `npm run dev` hay build sống qua đêm.** Kiểm nhanh: `ps ax | grep -i astro`.
- **Làm việc trên nhánh phụ.** Nhánh khác `main` không kích hoạt Workers Builds. Gộp lên `main`
  một lần khi thật sự cần lên trang, thay vì đẩy từng commit.
- Trước một đợt build dồn dập, ngó Usage trước.
- Script ghi hàng loạt: gộp vào transaction thay vì patch từng document.
- Sửa schema, sửa Studio, sửa nội dung: cứ làm, không phải dè.

## 8. Khi chạm trần thì thấy gì

- Sanity trả `402 plan_limit_reached`. Build **đỏ**, `npm run dev` hiện trang rỗng hoặc lỗi dữ
  liệu. Đó không phải lỗi code.
- **Site thật vẫn sống**: 129 trang tĩnh nằm trên Cloudflare, không gọi Sanity. Ảnh vẫn lên
  (bandwidth riêng, đang 2%).
- **Studio vẫn vào được** để quản trị và biên tập.
- Chỉ có hai lối ra: **chờ reset** đầu tháng, hoặc **nâng gói**. Không có cách nào giảm mức đã
  tiêu trong tháng.

## 9. Kiểm số thật

- Trang Usage: `https://www.sanity.io/organizations/o8aIc2aOK/project/pgedy374/usage`
- Gói cước và hạn mức bằng dòng lệnh (token lấy từ `~/.config/sanity/config.json`):
  `curl -H "Authorization: Bearer $TOK" https://api.sanity.io/v1/subscriptions/project/pgedy374`
- Muốn biết chính xác client nào đốt: tab Usage → **Request logs → Generate** (7 ngày gần nhất).

## 10. Chưa đo, còn mở

- Con số **300–450 request mỗi build là ước tính đọc từ mã**, chưa đo bằng một build thật —
  vì chính việc đo đã tốn ngần ấy. Đo lại vào đầu tháng khi hạn mức còn rộng.
- `SANITY_WRITE_TOKEN` được 89 chỗ trong `scripts/` đọc tới, nhưng **không có trong `.env`**, và
  dự án chỉ có **một token robot duy nhất, vai viewer**. Chưa rõ script ghi đang chạy bằng token
  nào. Thử một lệnh nhẹ trước khi cần chạy thật sau ngày rơi về Free.
- Chuyển build sang `useCdn: true` (xô 1M đang bỏ trống, giá vượt rẻ hơn 10 lần) — đánh đổi với
  độ tươi của dữ liệu lúc dựng. Cần ADR.

---

**Liên quan.** `BUILD-NOTES.md` mục "Deploy" và mục "Bấm Publish trong Sanity KHÔNG còn dựng lại
site" (`QĐ-2026-08-22-03`) — webhook đã tắt chính vì mỗi lần bắn là một lần dựng đọc lại toàn bộ
nội dung. Sổ này là phần định lượng của cùng câu chuyện đó.
