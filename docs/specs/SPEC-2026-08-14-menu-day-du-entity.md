# SPEC — Menu phản ánh đủ entity chính, chân trang tự sinh

- **Trạng thái:** thiết kế đã được chủ dự án duyệt 2026-08-14, thi hành ngay trong phiên.
- **Ngày soạn:** 2026-08-14   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa hai chiều (đổi cấu hình menu và thêm một hàm sinh danh sách,
  revert được bằng một commit). Không đổi URL nào nên không chạm R3.
- **Supersedes:** phần menu của `SPEC-2026-08-13-menu-chinh-bon-muc.md` — nhóm thả xuống
  "Tour ▾" đổi thành link phẳng. Cơ chế `kind`, `footerOnly`, `NavSurface` giữ nguyên.
- **Repo lúc soạn:** `main` tại `541ec26`

---

## 1. Mục tiêu

Menu chính phản ánh đủ năm entity chính của một công ty du lịch — Tour, Điểm tham quan, Trải
nghiệm, Địa danh, Cẩm nang — và **không trang danh sách nào còn mồ côi**.

## 2. Vấn đề

Site có **11 trang danh sách sống trên production**, menu chỉ dẫn tới **một**:

```
/tour/  /diem-tham-quan/  /trai-nghiem/  /dia-danh/  /cam-nang/   ← chỉ /cam-nang/ có trên menu
/khach-san/  /resort/  /kham-pha/  /luu-tru/  /di-lai/  /tat-ca/
```

Mười trang kia nằm trong sitemap, Google bò được, nhưng khách vào từ trang chủ không có đường
nào tới. Đây không phải "menu thiếu mục" — điều hướng không phản ánh cấu trúc site.

## 3. Quyết định

**1. Menu chính: bảy mục, khai tay.**

```
Trang chủ · Tour · Điểm tham quan · Trải nghiệm · Địa danh · Kinh nghiệm du lịch · Đặt vé trực tuyến
```

Năm mục giữa là `kind: 'index'`. Khai tay chứ không tự sinh, vì thứ tự và nhãn là quyết định
biên tập: "Tour" phải đứng đầu (dòng sản phẩm chính), và hai mục "Trang chủ", "Đặt vé trực
tuyến" không phải entity nên không thể sinh từ `ROUTE_MAP`.

Nhãn của `article` giữ **"Kinh nghiệm du lịch"**, không dùng "Cẩm nang" như nhãn trong
`ROUTE_TABLE`. Nhãn trên menu là chuyện bán hàng; nhãn trong `ROUTE_TABLE` là tên kỹ thuật của
danh mục. Hai thứ được phép khác nhau.

**2. Nhóm thả xuống "Tour ▾" đổi thành link phẳng tới `/tour/`.**

Không mất gì: `/tour/` đã tự liệt kê cả trang danh mục con (`/tour/tour-dao/`,
`/tour/hon-tam/`) lẫn từng tour — đã kiểm trên production. Trang danh mục con chỉ sâu thêm một
cú bấm. Cơ chế `children` giữ nguyên trong mã, đổi ý sau vẫn dùng lại được.

**3. Chân trang gồm hai nhóm, hai nguồn khác nhau.**

- **Khai tay** — lấy từ `nav` qua `resolveNav(lang, zaloUrl, 'footer')`, gồm bảy mục trên cộng
  Hỗ trợ và Liên hệ.
- **Tự sinh** — hàm mới `autoRouteLinks(lang)` đọc thẳng `ROUTE_MAP`, lấy mọi mục có
  `hasIndex` hoặc là hub, trả `{ label, href }`.

Mục nào đã có ở nhóm khai tay thì nhóm tự sinh **bỏ qua, so bằng `href`**.

Bật một entity mới trong `site.config.ts` là nó tự có mặt ở chân trang; tắt đi thì tự biến
mất. Đây là chỗ chữ "tự động" nằm.

`Tác giả` và `Công ty` không lên vì khai `hasIndex: false` — không có trang danh sách để trỏ
tới. Đó là dữ kiện của `ROUTE_MAP`, không phải lựa chọn.

**4. Không thêm cổng kiểm mới.** Chân trang và trang danh sách cùng đọc một `ROUTE_MAP`
(`[...path].astro` lọc `hasIndex || hub-`), nên không lệch được. Thêm cổng ở đây là canh một
thứ đã đúng theo cấu tạo.

## 4. Phương án đã loại

| Phương án | Loại vì |
|---|---|
| Sinh tự động cả header | Mất quyền biên tập: không đưa Tour lên đầu được, và "Trang chủ"/"Đặt vé" không phải entity nên không sinh ra được |
| Khai tay cả hai + cổng chặn khi sót | Vẫn phải nhớ khai mỗi lần bật entity; cổng chỉ báo sau khi đã quên |
| Tắt hẳn Khách sạn, Resort, các hub | 6 URL đã sống trên production sẽ biến mất → phát sinh nợ R3, cần 6 dòng 301 hoặc 410 |
| Để 6 trang không lối vào | Trang mồ côi: Google vẫn lập chỉ mục nhưng đánh giá thấp vì không liên kết nội bộ nào trỏ vào |

## 5. Phạm vi thay đổi

| File | Sửa |
|---|---|
| `src/site.config.ts` | viết lại mảng `nav`: 7 mục header + 2 mục `footerOnly` |
| `src/lib/routes.ts` | thêm `autoRouteLinks(lang)` |
| `src/components/Footer.astro` | render thêm nhóm tự sinh, lọc trùng theo `href` |

## 6. Nghiệm thu

| Kiểm | Ngưỡng đạt |
|---|---|
| `npx astro build` | exit 0, không dòng `[ERROR]` |
| `npx astro check` | 0 errors, 0 warnings |
| Menu chính | đúng 7 mục, đúng thứ tự |
| Chân trang chứa 11 đường dẫn danh sách | đủ 11 |
| Chân trang chứa `/ho-tro/`, `/lien-he/` | có |
| Đường dẫn lặp trong chân trang | 0 |
| Mọi `href` nội bộ ở chân trang có file thật trong `dist/` | 100% |

## 7. Ngoài phạm vi

- **Bề mặt** (phông chữ, màu, độ đậm) — spec riêng, làm sau, theo đúng thứ tự `N1`/`P2`.
- **Header 7 mục trên di động** — đã có nút hamburger sẵn; chỉnh cho vừa thuộc spec bề mặt.
- **Nợ R3 đang mở**: `/tour/tour-hon-tam-tron-goi-ve-hon-tam-tam-bun-tam-bien/` và
  `/tour/ve-hon-tam-tron-goi-tour-hon-tam-1-ngay/` vẫn trả 404 sau khi đổi slug. Chủ dự án
  chưa quyết. Không thuộc spec này nhưng vẫn đang chảy máu.
