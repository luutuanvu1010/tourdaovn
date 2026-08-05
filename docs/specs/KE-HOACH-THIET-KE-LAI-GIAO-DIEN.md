# KẾ HOẠCH — Đợt thiết kế lại giao diện tourdaovn

> ## ⚠ Đây là bản DỰNG LẠI, không phải bản gốc
>
> Kế hoạch gốc **chưa bao giờ tồn tại dưới dạng file**. Đã tìm cả lịch sử git
> (`git log --all --name-only`): không có. Nó sống trong phiên làm việc ngày 2026-08-05
> rồi mất theo phiên đó, trong khi **25 chỗ** ở `DECISIONS.md` và `DRIFT_LOG.md` vẫn trích
> dẫn nó như một tài liệu có thật ("xử ở pha C", "quyết công cụ ở pha F", "hoãn tới sau
> pha B").
>
> Đúng cái mà `CONSTITUTION` P12 sinh ra để chặn — *"mỗi bước đẻ ra một artifact"* — và P5
> — *"quyết định không ghi thì coi như chưa từng xảy ra"*.
>
> File này dựng lại từ dấu vết còn sót trong hai cuốn sổ. **Mọi dòng đều truy được về một
> dòng cụ thể trong sổ**, có trích nguồn. Chỗ nào không dựng lại được thì ghi thẳng là
> không biết, không suy đoán cho đủ.
>
> **Chưa có hiệu lực cho tới khi chủ dự án xác nhận.** Xem §6.

- **Trạng thái:** nháp dựng lại, chờ chủ dự án xác nhận
- **Ngày dựng lại:** 2026-08-05   **Người dựng:** Cowork
- **Repo lúc dựng:** `main` tại `cb4dcbc`
- **Nguồn dựng lại:** `docs/DECISIONS.md`, `docs/DRIFT_LOG.md`, `playbook/PLAYBOOK.md`
  Phần 1, lịch sử git

---

## 1. Các pha ánh xạ lên chuỗi 9 bước của PLAYBOOK

Đây là phát hiện quan trọng nhất khi dựng lại, và nó làm mọi thứ khác sáng ra.

`GOVERNANCE` 1.4 khai toàn hệ chỉ có **một** định nghĩa quy trình: chuỗi 9 bước (0–8) ở
`PLAYBOOK` Phần 1. Đối chiếu từng pha với chuỗi đó thì khớp:

| Pha | Bước PLAYBOOK | Artifact của bước | Bằng chứng dựng lại |
|---|---|---|---|
| **A** | 0 — Định vị và ràng buộc | `00-PROJECT_BRIEF` | `DRIFT_LOG` DR-006 ghi "xử ở pha A", mà DR-006 chính là lỗi của `00-PROJECT_BRIEF`. `DECISIONS` QĐ-08 gắn nhãn "(bước 0)" cho câu hỏi I15 |
| **B** | 1 — Phạm vi và mô hình nội dung | `01-CONTENT_MODEL` | QĐ-08 gắn nhãn "(bước 1)" cho câu hỏi nguồn duy nhất của field bắt buộc — mà field bắt buộc là 13 dòng gate publish ở `01-CONTENT_MODEL` §2 |
| **C** | 5 — Cấu trúc IA và schema | `05-URL_MAP + DB_SCHEMA` | DR-004 ghi "xử ở pha C", mà DR-004 là lỗi của `05-URL_MAP` |
| **D** | **không rõ** | — | **Không một dòng nào trong repo nhắc tới pha D.** Xem §5 |
| **E** | 6 — Khung trang và binding map | `06-BINDING_MAP` | DR-005 ghi "xử ở pha E" (lỗi của `06-BINDING_MAP`); DR-007 ghi "xử ở pha E và G" |
| **F** | 7 — Bề mặt, thiết kế giao diện | `DESIGN_TOKENS + mockup` | DR-008 ghi "xử ở pha F" (thiếu `DESIGN.md`); DR-010 ghi bản kiểm kê component là "đầu vào bắt buộc của prompt giao cho Claude Design ở pha F"; QĐ-09 và QĐ-10 hẹn quyết playwright và Lighthouse ở pha F |
| **G** | 8 — Thực thi có cổng QA | `QA_CHECKLIST + PR` | DR-007 phần còn lại; QĐ-10 nói mốc ảnh "trước" phải là trạng thái ngay trước pha G |

**Vì sao cách ánh xạ này đáng tin.** Đợt thiết kế lại không đi lại cả 9 bước, mà đi lại
đúng những bước mà `DRIFT_LOG` đã chỉ ra là *đang mô tả một site khác* — 0, 1, 5, 6, 7, 8.
Sáu bước, sáu pha có nhãn: A, B, C, E, F, G. Ba bước không đụng tới (2 SAD, 3 ADR,
4 CONSTRAINTS) không có pha nào. Đây là lời giải thích khít nhất cho dữ liệu, nhưng nó vẫn
là **suy luận từ dấu vết**, không phải bản gốc — nên cần xác nhận.

---

## 2. Trạng thái từng pha

### Pha 0 — Hạ tầng kiểm chứng · ✅ XONG

Không nằm trong chuỗi 9 bước. Đây là pha dọn đường: làm cho cổng QA1/QA2 chạy được trước
đã, vì `npm run audit:spec` đang chết (DR-001) nên `g3` — bộ kiểm "code có khớp
`06-BINDING_MAP` không", thứ mà đợt thiết kế lại cần nhất — **chưa từng chạy được**.

Quyền làm pha này trước cổng QA1 do `QĐ-2026-08-05-01` cấp: sửa hạ tầng kiểm chứng không
tính là "Code chạy khi chưa qua QA1", vì nó không phải sửa sản phẩm.

Đã giao: 11 quyết định (`QĐ-2026-08-05-01` → `-11`), 26 bản ghi drift, một vòng
`/code-review`. Việc 0.6 (ảnh baseline) bị bỏ hẳn theo `QĐ-10`; việc 0.7 (sổ đăng ký
control) và 0.8 (kiểm kê component) đã xong.

**Trạng thái ra:** `astro check` 0 lỗi 0 cảnh báo · `npm run build` đi hết ·
`gate:all` 9 xanh / 1 đỏ (`deferred-gate`, do ND-005, đã chốt hoãn) · `check:cwd` xanh.

### Gói xen — Build đừng vỡ vì dữ liệu thiếu · ◐ ĐANG DỞ

Không thuộc chuỗi pha. Xen vào sau pha 0, theo prompt bàn giao
`docs/prompts/BUILD-BEN-VUNG-DU-LIEU-THIEU.md`.

Spec: `docs/specs/SPEC-2026-08-05-build-ben-vung-du-lieu-thieu.md`. Hướng B đã duyệt.
Bước 1–3 đã giao ở `114010a`, `67e087e`, `cb4dcbc`. **Bước 4 (diễn tập dữ liệu thiếu) còn
chờ trả lời Q1** — nghĩa là hiện mới chứng minh được *code khai đúng*, chưa chứng minh
được *build sống sót khi dữ liệu thiếu*.

### Pha A — `00-PROJECT_BRIEF` · ⬜ MỞ, là pha kế tiếp

**Vì sao đứng đầu.** P1 của hiến pháp: định vị chốt trước mọi thứ khác. Và cái sai ở đây
**không dừng ở tài liệu — nó đang hiển thị cho người dùng thật**.

Việc đã biết:

- **DR-006** — Brief tự khai "gần như toàn bộ nội dung là của nhatrangtravel". Sai đã rò
  xuống ba chỗ trong code: `src/components/SiteHome.astro:36` và `src/pages/index.astro:37`
  in "Cổng thông tin du lịch Nha Trang…", `src/lib/homepage.ts:59` in "Tổng quan về Nha
  Trang" — trong khi `src/site.config.ts` khai `brand.legalName = 'Công ty TNHH Tour Đảo'`.
  Site đang tự giới thiệu sai bản chất doanh nghiệp.
- **Câu hỏi I15** — "cấm chuỗi *thành phố Nha Trang*" có còn là luật của tourdaovn không.
  `04-CONSTRAINTS` §1 tự đánh dấu 🔧 SITE-SPECIFIC cho dòng này. Chặn việc trả nợ ND-005
  (`QĐ-2026-08-05-08`).

### Pha B — `01-CONTENT_MODEL` · ⬜ MỞ

Việc đã biết:

- **Chốt nguồn duy nhất cho field bắt buộc**: `gateFields` trong `shared/gates` hay
  `scripts/gate.config.ts`. `QĐ-2026-08-05-08` nói rõ phải trả lời câu này *trước* khi chép
  `shared/gates` về, nếu không sẽ chép rồi phải sửa lại.
- Trả xong thì mở đường cho **ND-005** (27/31 control không có kiểm máy) và **ND-001** (`g2`
  bị tắt, bất biến field bắt buộc không ai kiểm).

### Pha C — `05-URL_MAP + DB_SCHEMA` · ⬜ MỞ

- **DR-004** — Canonical host khai `nhatrangtravel.net`, site chạy `tourdao.vn`. Bảng prefix
  §1.2 còn bốn nhánh đã tắt (`am-thuc`, `nha-hang`, `dac-san`, `su-kien`). Thiếu `tat-ca` —
  hub thứ tư đang thật sự chạy. Năm cột ngôn ngữ trong khi `langs = ['vi']`.
- Ghi chú của sổ: **ở chỗ này code đúng hơn spec.** `ROUTE_TABLE` trong `src/lib/routes.ts`
  phản ánh đúng phạm vi hiện tại. Nên pha C là kéo spec về khớp code, ngược chiều thường lệ.

### Pha D — ⬜ KHÔNG RÕ

Xem §5.

### Pha E — `06-BINDING_MAP` · ⬜ MỞ

- **DR-005** — §5.3 tên là "Bốn hub" nhưng liệt `/am-thuc/`; hub thứ tư thật là `/tat-ca/`,
  không có dòng nào. §4.5, §4.6, §4.9, §5.5 mô tả bốn loại trang thuộc entity đang tắt.
  Không có bảng cho trang chủ `/` (hiện là loại trang riêng, component `SiteHome`).
  `/lo-trinh-don-khach/` không có bảng ánh xạ. §7 tuyên bố "16 mẫu URL đều có bảng ánh xạ"
  — câu này hiện sai, vừa thừa vừa thiếu.
- **DR-007** (phần đặc tả) — `06-BINDING_MAP` §2 khai "Header điều hướng | config (build)",
  code hardcode ở ba chỗ.
- **DR-011** — `g3` báo `organization` truy cập `data.sameAs` mà binding map không khai
  field đó.

**Cổng cứng:** `PLAYBOOK` Phần 1 và `GOVERNANCE` 4.2 — chưa có `BINDING_MAP` thì **cấm** vào
bước 7. Nghĩa là pha E phải đóng trước khi pha F bắt đầu. Không lách được.

### Pha F — `DESIGN_TOKENS + mockup` · ⬜ MỞ, đang bị chặn

- **DR-008** — `GOVERNANCE` 4.3 và 4.4 đều đòi `DESIGN.md`; file không tồn tại. Bốn tham
  chiếu chết (`DESIGN_PATTERNS.md` dòng 10, 20, 49 và `src/styles/tokens.css` dòng 2).
  Thêm một lệch tên ở tầng luật: `PLAYBOOK` gọi artifact bước 7 là `DESIGN_TOKENS + mockup`,
  `GOVERNANCE` gọi là `DESIGN.md` — hai tên cho một thứ.
- **DR-002** — token trong code lệch `07-DESIGN_TOKENS.md`: 8 token lệch giá trị, ~40 biến
  có trong code mà không có dòng nào trong spec, 3 mục có trong spec mà không thành biến.
  Sổ ghi "sẽ tự tiêu khi viết lại bộ token cho tourdaovn", tức thuộc pha này.
- Giao `Claude Design` dựng mockup. Đầu vào bắt buộc `docs/design-context/COMPONENT_INVENTORY.md`
  đã có (54 component, 886 dòng — DR-010, đã sửa nhầm thương hiệu ở DR-025).
- Quyết công cụ: playwright cho vòng so trang-đã-code với mockup-đã-duyệt, **và** Lighthouse
  cho QA2 (`04-CONSTRAINTS` §3 đòi perf ≥ 90, a11y ≥ 95, hiện chưa có công cụ đo).

**🛑 Đang bị DR-003 chặn.** Xem §4.

### Pha G — `QA_CHECKLIST + PR` · ⬜ MỞ

- **DR-007** (phần code) — gỡ hardcode menu ở `Header.astro:24`, `Footer.astro:32-33`,
  `homepage.ts` (`quickLinks` lặp năm lần, mỗi ngôn ngữ một lần). Bản đối chứng cách làm
  đúng đã có sẵn trong repo: `HomeHubGrid.astro:5` đọc `navHubs` từ `site.config.ts`.
- Vòng so ảnh trước/sau. `QĐ-2026-08-05-10` chốt: mốc "trước" phải là trạng thái **ngay
  trước pha G**, không phải ảnh chụp hôm nay.
- Cổng QA2 theo `GOVERNANCE` 4.4.

---

## 3. Phiếu nợ đang mở

| Mã | Nội dung | Gỡ được ở |
|---|---|---|
| **ND-001** | `g2` bị tắt; bất biến "field bắt buộc khai ở content model thì cũng bắt buộc lúc thi hành" không có kiểm máy | sau pha B |
| **ND-002** | `contentProvenance` trống trên document "Công ty TNHH Tour Đảo" → `governance-post` đỏ. **Chỉ chủ dự án làm được** (token chỉ có quyền đọc, và trường này cố ý không cho tác nhân tự điền) | bất cứ lúc nào |
| **ND-004** | Chưa có `CONTROL_GATES.md` cấp dự án → vòng đối chiếu chéo của `control-registry-gate` là no-op. Chín gate đang chạy thật nhưng chưa vào sổ | việc tầng quản trị, không suy ra được từ mã |
| **ND-005** | `shared/gates` mất tích → 27/31 control không có kiểm máy. Là lý do `deferred-gate` đỏ | sau pha B (`QĐ-08`) |
| **ND-006** *(đề nghị, chưa ghi)* | Lớp vô hướng và `geoKnowledge` còn nợ sau gói dữ liệu thiếu | — |

**Ràng buộc kèm theo, đang có hiệu lực** (`QĐ-2026-08-05-08`): cho tới khi ND-005 được trả,
**cấm** dùng câu "mọi bất biến dữ liệu đều xanh" làm điều kiện ra của QA2. Điều kiện ra chỉ
được viện dẫn đúng những control đang `live` trong `docs/governance/control-registry.yaml`.

---

## 4. Đang chặn — cần chủ dự án, không tác nhân nào quyết được

### 🛑 DR-003 — Hai đặc tả đã duyệt mâu thuẫn nhau về màu nền

- `07-DESIGN_TOKENS.md` §1: `color.surface = #FFFFFF`, "nền trang mặc định".
- `08-QA_CHECKLIST.md` dòng 71: "`body` background = `--c-surface` (#FBF8F3)"; dòng 73:
  "Không có vùng nào dùng nền trắng thuần cho body".

Xung đột **cùng tầng**, cả hai đều là core spec đã phê chuẩn. `GOVERNANCE` 3.5 và
`CONSTITUTION` Điều 3 cấm tác nhân hoà giải bằng suy đoán — phải sửa ở tầng đúng.

**Chặn pha F**: chưa biết nền trắng hay nền kem thì không viết được bộ token, mà bộ token
là artifact của bước 7.

**Kèm theo, cũng phải xử cùng lúc:** `08-QA_CHECKLIST` §B đang hardcode màu và font của
nhatrangtravel (`#C2410C`, `#F5A623`, `#E8654E`, `#FBF8F3`, "Be Vietnam Pro", "Plus Jakarta
Sans") cùng các class cụ thể. Không viết lại §B khi đổi bộ token thì **QA sẽ chấm bài bằng
đáp án của dự án khác** — cổng vẫn chạy, vẫn in kết quả, và kết quả vô nghĩa.

### 🛑 ND-002 — `contentProvenance` trống

Làm `governance-post` gate `S24-AUTHORITY-HTML` đỏ. Chỉ chủ dự án mở Sanity Studio đặt được.

Kèm theo, cần xác nhận: có một document `organization` tên "TNHH Tour đảo Nha Trang" mang
slug `tour-3-dao-nha-trang-review-chi-tiet` — trùng khuôn slug của bài viết và tour, đang
sinh ra trang `/cong-ty/tour-3-dao-nha-trang-review-chi-tiet/`. Nghi nhập nhầm.

---

## 5. Những chỗ KHÔNG dựng lại được

Ghi thẳng thay vì đoán cho đủ, theo `GOVERNANCE` 3.4 (không chắc thì mặc định coi là cấu
trúc và dừng).

1. **Pha D là gì.** Hai cuốn sổ có **25 tham chiếu** tới các pha, phân bố: pha 0 (10 lần),
   A (2), B (2), C (1), E (2), F (6), G (2) — **và pha D: 0 lần**. Mọi nhãn khác đều xuất
   hiện ít nhất một lần; riêng D không bao giờ.

   Ba khả năng, xếp theo độ tin sau khi có số đếm: (a) **khả dĩ nhất — pha D không tồn
   tại**, nhãn nhảy từ C sang E, vì sáu pha A/B/C/E/F/G đã phủ trọn sáu bước cần đi lại
   (0, 1, 5, 6, 7, 8) và không còn chỗ trống nào để D lấp; (b) là bước 2/3/4 của PLAYBOOK
   (SAD, ADR, CONSTRAINTS) — nhưng thế thì thứ tự chữ cái không khớp thứ tự bước, vì D
   phải đứng giữa C(5) và E(6); (c) là một pha ngoài chuỗi 9 bước, ví dụ dọn dữ liệu
   Sanity.

   **Vẫn cần chủ dự án xác nhận** — vắng mặt không phải bằng chứng không tồn tại, nhất là
   với một kế hoạch mà bản thân nó cũng chưa từng được ghi.
2. **Danh sách việc con của từng pha.** Pha 0 có đánh số việc (0.6, 0.7, 0.8 — thấy trong
   `QĐ-09`, `QĐ-10`, commit `10d4ac8`). Các pha A–G nhiều khả năng cũng có, nhưng không còn
   dấu vết nào.
3. **Điều kiện ra của từng pha.** Không biết pha A phải giao gì thì mới coi là xong.
4. **Thứ tự bắt buộc giữa các pha.** Chỉ ba ràng buộc là chắc: pha E trước pha F (cổng cứng
   `BINDING_MAP` → bước 7); pha B trước khi trả ND-005 (`QĐ-08`); pha F trước pha G. Còn lại
   suy từ thứ tự chữ cái, không có gì xác nhận.
5. **Phạm vi thẩm mỹ.** Đợt này đổi giao diện tới đâu — đổi token và bố cục, hay dựng lại
   toàn bộ hệ thị giác. `QĐ-10` có một câu hé: *"đợt này thay đổi toàn bộ có chủ ý"*, nhưng
   một câu thì không đủ làm phạm vi.

---

## 6. Cần chủ dự án xác nhận

1. **Bảng ánh xạ pha ↔ bước ở §1** có đúng không, hay tôi ghép sai.
2. **Pha D là gì**, hay bỏ nhãn đó.
3. **DR-003** — nền trắng `#FFFFFF` hay nền kem `#FBF8F3`. Sửa file nào cho khớp file nào.
   Chặn pha F.
4. **ND-002** — đặt `contentProvenance` trong Sanity Studio, và xác nhận document
   `organization` mang slug lạ.
5. **Q1 và Q2 của gói dữ liệu thiếu** vẫn chưa trả lời — Q1 chặn bằng chứng BC-1, Q2 quyết
   chỗ đặt cả hai file spec này.
6. **Phạm vi thẩm mỹ của đợt** (§5 mục 5) — cần một câu chốt trước khi tới pha F.

Xác nhận xong thì file này thành kế hoạch có hiệu lực, và mọi tham chiếu "pha X" trong
`DECISIONS.md` / `DRIFT_LOG.md` mới có chỗ để trỏ về.

---

## 7. Việc kế tiếp

Sau khi xác nhận §6: **pha A**, và bắt đầu bằng việc soạn spec cho nó theo đúng cổng QA1
(`GOVERNANCE` 4.3) — không sửa code trước.

Riêng **ND-002** không phụ thuộc pha nào, làm được ngay, và làm xong thì `governance-post`
chuyển sang xanh.
