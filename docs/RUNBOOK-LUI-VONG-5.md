# RUNBOOK — lùi bản phát hành bề mặt vòng 5

> Soạn 2026-08-25, trước khi merge PR #6. Mục đích: nếu bản mới không ổn thì quay lại được
> **ngay**, không phải nhớ lệnh, không phải dựng lại, không phải hỏi ai.

## Mốc để quay về

| Thứ | Giá trị | Ý nghĩa |
|---|---|---|
| **Bản Worker đang chạy** | `2670e418-bfc3-48c9-bed1-9cd7a2637c68` | Deploy 2026-08-24T04:23:58Z. Đây là thứ khách đang thấy |
| **Commit sinh ra nó** | `2dbfb36` — tag **`prod-truoc-vong-5`** | `origin/main` trước khi merge PR #6 |
| **Bản mới** | PR #6, 3 commit | `feat/be-mat-vong-5-va-ra-bo-cuc` |

Lấy lại danh sách bất cứ lúc nào:

```
npx wrangler deployments list
```

**Đã kiểm rằng tag khớp bản đang chạy**, không phải phỏng đoán: `2dbfb36` commit lúc
`2026-08-24T04:20:25Z`, bản Worker `2670e418` deploy lúc `2026-08-24T04:23:58Z` — **cách nhau 3
phút 33 giây**, đúng nhịp Workers Builds dựng sau một lần push. Và `git rev-list --count
2dbfb36..origin/main` trả **0**, tức không có commit nào chen vào giữa.

---

## Lùi tầng 1 — Cloudflare, tính bằng giây ⚡

**Dùng cái này trước.** Nó không dựng lại gì, chỉ trỏ traffic về bản Worker cũ.

```
npx wrangler rollback 2670e418-bfc3-48c9-bed1-9cd7a2637c68 \
  -m "Lui ban be mat vong 5"
```

Kiểm ngay sau đó:

```
npx wrangler deployments list | tail -12          # bản 2670e418 phải ở 100%
curl -sI https://tourdao.vn/ | head -1            # kỳ vọng HTTP/2 200
```

**Giới hạn phải biết:** `rollback` chỉ đổi **mã Worker**. Nó **không** đụng dữ liệu Sanity. Nếu
lúc đó `siteSettings.theme` đã đổi sang `cat-bien`, bản cũ vẫn đọc `cat-bien` — mà mã cũ **chưa có
ba nền phụ riêng cho bộ đó** (`QĐ-2026-08-25-04`), nên trang sẽ ra đúng tổ hợp tệ nhất: nền kem
cạnh nền phụ xám lạnh, tách nền 1,005. **Lùi mã thì phải lùi cả theme** — xem tầng 3.

---

## Lùi tầng 2 — git, khi cần bản dựng sạch

Dùng khi muốn `main` thật sự trỏ về mã cũ, hoặc khi Workers Builds đã dựng đè lên bản rollback.

**Cách đúng: revert, không reset.** `main` đã publish; viết lại lịch sử của nó làm gãy mọi clone
và mọi worktree khác.

```
git checkout main && git pull
git revert -m 1 <sha-cua-merge-commit-PR-6>
git push            # Workers Builds tự dựng lại từ mã đã revert
```

Không nhớ SHA của merge commit:

```
git log --oneline --merges -3
```

**Muốn dựng lại đúng bản cũ mà không đụng `main`:**

```
git checkout prod-truoc-vong-5
npm ci && npm run build
npx wrangler deploy            # đè bản đang chạy bằng mã của tag
```

---

## Lùi tầng 3 — bộ giao diện trong Sanity

Chỉ cần khi đã đổi `siteSettings.theme` sang `cat-bien`.

Trong Sanity Studio: **Site Settings → Bộ giao diện → chọn lại `bien-sau`**, rồi publish.

Giá trị lúc soạn runbook này: **`bien-sau`**. `siteTheme.ts` đọc lúc **dựng**, nên đổi xong phải
deploy lại thì trang mới đổi theo.

---

## Thứ tự phát hành đã chốt — làm đúng thứ tự này

1. **Merge PR #6** → Workers Builds tự dựng và deploy.
2. **Kiểm bản mới** (danh sách dưới).
3. **Chỉ khi bước 2 ổn** mới đổi `siteSettings.theme` sang `cat-bien`, rồi deploy lại.

**Đừng đảo bước 1 và 3.** `origin/main` hiện chưa có ba nền phụ riêng cho `cat-bien`; đổi theme
trước khi merge thì một lần deploy từ `main` sẽ đẩy nền kem lên mà không có bản vá đi kèm.

---

## Kiểm sau khi deploy — nhìn đúng chỗ đã sửa

```
curl -sI https://tourdao.vn/ | head -1
```

| Trang | Nhìn gì |
|---|---|
| `/diem-tham-quan/chua-long-son/` | Breadcrumb và tiêu đề nằm **trên** ảnh hero, không đè lên ảnh. Thông tin nhanh trải hết bề ngang |
| `/dia-danh/dao-hon-mun/` | "Giờ mở cửa" ở **dải ngang phía trên** Điểm nổi bật, không nằm cột phải |
| `/trai-nghiem/phao-chuoi/` | Link trong thân bài **có gạch chân và màu xanh**; trước đây là chữ thường |
| `/diem-tham-quan/rung-thong-khanh-son/` | Ảnh **hiện trong thân bài** (12 tấm); trước đây mất sạch |
| `/cam-nang/` bất kỳ | Tên tác giả chỉ hiện **một lần**; không còn "[object Object]" |
| `/tac-gia/ho-dac-duy/` | **Không có hero** — trang này không ảnh, không huy hiệu |
| Khổ 390px | Thanh dính đáy vẫn thấy; không tràn ngang |

**Dấu hiệu phải lùi ngay:** trang trắng, HTTP 5xx, mất CSS toàn site, hoặc thanh giá/CTA biến mất
trên trang tour.

**Không phải lý do để lùi:** bốn cổng đỏ có sẵn (R3, R4, S24-AUTHORITY, deferred) — nợ dữ liệu đợt
4D, đã đỏ từ trước bản này và không do nó gây ra.
