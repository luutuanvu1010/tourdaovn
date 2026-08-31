# SPEC — Nâng chiều cao Hero trang chi tiết Entity thêm 50px

- **Trạng thái:** **ĐÃ GỠ CHẶN — chủ dự án chọn lối A** (nới Luật 3) trong phiên 2026-08-31.
  Spec này từng CHẶN vì `06-BINDING_MAP` §3 hàng Hero đặt một điều kiện bắt buộc chưa ai thi
  hành (xem §0, giữ nguyên làm bản ghi). **Còn một việc phải xong TRƯỚC khi sửa dòng token đầu
  tiên: viết phiếu `QĐ-2026-08-31-03` và sửa `06-BINDING_MAP` §3 hàng Hero — xem §0.7.**
- **Ngày soạn:** 2026-08-31   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa **hai chiều**. Đổi năm giá trị token, lùi lại bằng một lần sửa ngược.
- **Đầu vào đã đọc:** `CLAUDE.md` §8 (ba luật cứng tầng giao diện),
  `docs/core-specs/KIEN-TRUC-TEMPLATE.md` §1 §4, `docs/core-specs/07-DESIGN_TOKENS.md` dòng 139,
  `src/styles/tokens.css` dòng 182–189, 308, 312.
- **Repo lúc soạn:** `main` tại `4118209`
- **Anh em cùng đợt:** `SPEC-2026-08-31-trang-danh-sach-cong-ty.md`,
  `SPEC-2026-08-31-form-dat-tour-gon-va-chi-tiet-gia.md`. Ba mảnh **gần độc lập** — chúng không
  chia sẻ file nào, nhưng có **một phụ thuộc quyết định**: nếu chủ dự án chọn **lối C** ở §0.6,
  thì §4.2 của mảnh (3) phải mở lại — **chủ dự án đã chọn lối A ngày 31/08, nên ràng buộc này đã
  gỡ.** **Thứ tự đúng: `QĐ-2026-08-31-03` → mảnh (2) →
  mảnh (3) → mảnh này.** Mảnh này đi SAU CÙNG vì nó đang bị chặn, không phải đi trước.

---

## 0. Điều kiện bắt buộc của `06-BINDING_MAP` đã bị kích hoạt — bản ghi và quyết định

> **Trạng thái: ĐÃ GỠ.** Mục này từng là điểm CHẶN. Chủ dự án đã xét lại và chọn **lối A**
> (§0.7) ngày 2026-08-31. Giữ nguyên §0.1–§0.6 làm **bản ghi lý do**, đừng xoá — người đọc sau
> cần thấy điều kiện đã sụp ra sao thì mới hiểu vì sao phiếu mới tồn tại.

**Đây không phải phát hiện của đợt này; đây là một cái hẹn đã quá hạn.**

### 0.1 Luật đang chi phối

`06-BINDING_MAP.md` §6 — **Luật 3 (v2.1), "giá trước, chữ sau":**

> Màn đầu của entity thương mại phải có giá hoặc nhãn "miễn phí".

### 0.2 Ngoại lệ đã ghi phiếu, kèm một điều kiện

`06-BINDING_MAP.md` §3 hàng Hero (v2.9.0, `QĐ-2026-08-28-03`) chấp nhận chiều cao hero hiện tại
là **ngoại lệ Luật 3 có chủ ý**, vì đã đo được: chiều cao 430px đẩy thanh dính ở viewport 1366
xuống **668px**, vượt mốc màn đầu **657px** — với **mọi** tiêu đề, không riêng tiêu đề hai dòng.

Ngoại lệ ấy được chấp nhận kèm đúng một điều kiện, trích nguyên văn:

> Chưa thành vi phạm sống vì `sticky-bar__price` render trên **0 trang** — thanh chỉ mang CTA.
> **Điều kiện bắt buộc: phải xét lại TRƯỚC khi vùng giá render trên bất kỳ trang nào.**
> […] nhưng ngày giá chạy được thì nó vi phạm.

### 0.3 Điều kiện ĐÃ bị kích hoạt — đo ngày 2026-08-31

| Phép đo | Kết quả |
|---|---|
| **Trên production**, tour 3 đảo Hòn Mun, 1710×985, JS đo DOM | `.sticky-bar__price` = `850.000₫/người`, **hiển thị**, y = 736 |
| `grep -rl 'data-region="sticky-bar" data-field="gia"' dist/` | **28 trang** / 118 |

> ⚠ **Đọc đúng hai dòng này.** Dòng `dist/` là grep trên bản dựng **có sẵn trên đĩa tại HEAD
> `4118209`, KHÔNG dựng lại** — theo đúng DR-105 thì con số **28** đo độ cũ của `dist/`, không
> đo trạng thái hôm nay, nên nó chỉ dùng để ước lượng quy mô, **không** dùng làm bằng chứng.
> Bằng chứng thật là **dòng production**: một trang đang render giá trong thanh dính là đủ để
> điều kiện "0 trang" của phiếu sụp. Ai muốn con số chính xác thì `npm run build` rồi grep lại.

Điều kiện của phiếu là "0 trang". Thực tế là **28 trang**. Việc "xét lại" mà `06` bắt buộc phải
làm **trước** thời điểm này **chưa từng được làm**. Theo đúng câu chữ của chính `06`, hôm nay
đây **đã là vi phạm Luật 3 đang sống**, độc lập với yêu cầu +50px.

### 0.4 +50px làm nó sâu thêm

Ở viewport 1366, `30vw + 50px` = 459,8px **vượt trần 430**, nên số trói là **trần** → hero 430px
→ thanh dính **668px** (số trích từ `QĐ-2026-08-28-03`, không đo lại được vì Chrome hay treo trên
site này). Sau khi sửa, trần 480 vẫn trói (509,8 > 480) → hero 480px → thanh dính **≈ 718px**,
tức xa mốc màn đầu 657px thêm **~50px nữa** (tổng cộng vượt ~61px).

### 0.5 Vì sao Claude dừng ở đây thay vì cứ làm

`CLAUDE.md` §5 — dừng khi *"có mâu thuẫn giữa các tài liệu ở hai tầng khác nhau"* và khi *"task
yêu cầu bỏ qua cổng… bắt buộc"*. `06-BINDING_MAP` đứng **trên** spec trong thứ tự thẩm quyền
(§1), và nó đặt một điều kiện bắt buộc chưa được thi hành. Tự đi tiếp là tự hoà giải mâu thuẫn
bằng suy đoán, đúng thứ §2 cấm.

### 0.6 Cần quyết định gì — ba lối, chủ dự án chọn

Cả ba đều hợp lệ. Quyết định này thuộc chủ dự án, và **phải được ghi thành `QĐ-2026-08-31-03` +
sửa `06-BINDING_MAP` §3 hàng Hero**, không phải một câu trong chat — vì ngoại lệ hiện tại cũng
đã được ghi thành phiếu, và gỡ nó bằng lời nói sẽ để lại một tài liệu nói dối.

| Lối | Nội dung | Đánh đổi |
|---|---|---|
| **A. Nới Luật 3** | Chấp nhận thanh dính không còn trên màn đầu ở 1366; ghi phiếu mới thay ngoại lệ cũ, **xoá điều kiện "0 trang"** vì nó đã hết hiệu lực | Hero cao như ý; khách trên laptop 1366 phải cuộn mới thấy giá. Mốc 657px là viewport thật của màn 768 — **khổ laptop phổ thông**, không phải ca biên |
| **B. +50px và bù lại chỗ khác** | Nâng hero, đồng thời rút chiều cao dải breadcrumb / dải tiêu đề để thanh dính về lại ≤657px | Giữ được cả hai, nhưng mở thêm phạm vi ra `PageHead`/`DetailLayout` — không còn là đổi năm con số |
| **C. +50px chỉ ở nơi không có thanh dính** | Chỉ trang điểm đến (`TouristDestinationHub`) cao thêm; trang chi tiết entity giữ nguyên | Chính là biến thể `tall` mà `QĐ-2026-08-28-03` vừa **bỏ** để có một định dạng hero duy nhất. Dựng lại là đi ngược quyết định 3 ngày trước |

**Không có lối "cứ làm rồi tính sau"** — vì cái "tính sau" ấy chính là điều kiện đang quá hạn.

### 0.7 ✅ QUYẾT ĐỊNH — chủ dự án chọn **lối A**, 2026-08-31

**Chốt:** nới Luật 3. Hero +50px ở mọi khổ. Chấp nhận thanh dính mang giá không còn trên màn đầu
ở viewport 1366.

**Hai việc bắt buộc, làm TRƯỚC khi sửa `tokens.css`.** Không phải thủ tục thừa: ngoại lệ hiện
tại đã được ghi thành phiếu, nên gỡ nó bằng một câu trong chat sẽ để lại một tài liệu nói dối —
và người đọc `06` sau này vẫn thấy điều kiện "0 trang" như thể nó còn hiệu lực.

**a. Viết `QĐ-2026-08-31-03` vào `docs/DECISIONS.md`**, tối thiểu phải ghi:

- Điều kiện bắt buộc của `QĐ-2026-08-28-03` (*"phải xét lại TRƯỚC khi vùng giá render"*) **đã bị
  kích hoạt và chưa ai thi hành** — giá render thật trên production, đo 2026-08-31.
- Chủ dự án **xét lại và chọn nới Luật 3**, không phải bỏ qua nó.
- Hệ quả nhận rõ: ở 1366 thanh dính từ 668px lên **≈718px**, mốc màn đầu 657px. Với **mọi** tiêu
  đề. Đây là **vi phạm Luật 3 được chấp nhận có chủ ý**, không còn là "chưa thành vi phạm".
- **Xoá hẳn điều kiện "0 trang"** — nó đã hết hiệu lực, giữ lại là bẫy cho người đọc sau.
- Ghi số đo thật ở 1366 **trước và sau** (nghiệm thu mục 7).

**b. Sửa `06-BINDING_MAP.md` §3 hàng Hero (dòng 74)** cho khớp phiếu mới: thay đoạn *"Chưa thành
vi phạm sống vì `sticky-bar__price` render trên 0 trang… Điều kiện bắt buộc: phải xét lại
TRƯỚC…"* bằng bản ghi ngoại lệ mới viện `QĐ-2026-08-31-03`, kèm giá trị mới (480/440/340,
`calc(30vw + 100px)`) và số đo 718px. Nâng phiên bản `06` và ghi vào nhật ký phiên bản ở dòng 17.

> **Vì sao Luật 3 nới được mà không phải bịa lý do:** `.bf__pax-price` (đơn giá từng hạng khách)
> vẫn nằm trong form, và thanh dính vẫn mang giá — chỉ là phải cuộn tới. Luật 3 nói *"màn đầu
> phải có giá"*; ta đang chấp nhận đánh đổi đó một cách công khai, không giả vờ nó không xảy ra.

### 0.8 Liên quan tới mảnh (3) cùng đợt

`SPEC-2026-08-31-form-dat-tour-gon-va-chi-tiet-gia.md` §4.2 **bỏ khối giá trong form**, để giá
chỉ còn ở thanh dính. Hai mảnh cùng đè lên Luật 3 từ hai phía: mảnh này đẩy thanh dính xuống sâu
hơn, mảnh kia bỏ bớt một bề mặt giá. Sàn an toàn còn lại là `.bf__pax-price` (đơn giá từng hạng
khách, giữ nguyên) — xem nghiệm thu 9 của spec đó.

---

## 1. Mục tiêu

Hero của **mọi trang chi tiết entity** cao thêm đúng **50px ở mọi khổ màn hình**.

## 2. Phép đo hiện trạng

> **Đo trên production `https://tourdao.vn/tour/tour-3-dao-hon-mun-hon-mun-lang-chai-hon-tam/`,
> cửa sổ 1710×985, ngày 2026-08-31, bằng `getBoundingClientRect()` trong JS.**
> Ghi rõ khổ và ngày là bắt buộc: DR-105 đã cho thấy một con số chép lại mà không kèm phép đo
> sẽ thành số rác ở lần đọc sau.

| Đo gì | Giá trị |
|---|---|
| `--hero-entity-h` đã phân giải | `clamp(330px, calc(30vw + 50px), 430px)` |
| Phần tử hero (`.hero-shell.hero-shell--full`) | **430px** — đang chạm **trần** |

## 3. Ràng buộc chi phối

**Luật cứng 1 (`CLAUDE.md` §8):** giá trị giao diện đi vào `src/styles/tokens.css`. `Hero.astro`
không giữ con số nào, chỉ đọc biến. Không viết cứng ở component.

**Bẫy đã ghi sẵn ở `KIEN-TRUC-TEMPLATE.md` §4 — spec này tồn tại phần lớn để không sập vào nó:**

1. **Nâng riêng MỘT con số KHÔNG cho thêm 50px ở mọi khổ** — vì hai con số trói ở hai dải khác
   nhau. Điểm giao: `30vw + 50 = 430` ⇒ **vw = 1266,67**.

   | Dải | Số đang trói |
   |---|---|
   | ≤768px | token mobile (phẳng) |
   | 769–1023px | token tablet (phẳng) |
   | **1024–1266px** | **số giữa** `calc(30vw + 50px)` |
   | **≥1267px** | **trần** `--hero-entity-h-max` |

   Nên: chỉ dời trần thì dải 1024–1266 đứng yên; chỉ dời số giữa thì dải ≥1267 đứng yên. Phải
   dời **cả năm**.

   ⚠ **Sửa một câu sai của chính bản nháp spec này** (và của `KIEN-TRUC-TEMPLATE.md:126` mà nó
   chép lại): bản đầu viết *"ở phần lớn khổ màn, số đang trói là số giữa"*. **Sai** — 1280,
   1366, 1440, 1920 đều **trần**-trói. Bằng chứng tự bác ngay trong câu kế bên: *"tại 1710px
   thì `30vw + 50px = 563px`, **bị trần 430px cắt**"* — tức trần trói, không phải số giữa.
2. **`--hero-min-h` và `--hero-min-h-mobile` KHÔNG phải hero này.** Chúng của `HomeHero.astro`
   — hero **trang chủ**, component khác. **Tuyệt đối không chạm hai token đó trong đợt này.**

## 4. Thiết kế

Dời **cả năm** giá trị, không dời riêng cái nào. Cơ sở:
`clamp(a+50, x+50, b+50) = clamp(a, x, b) + 50` với mọi `x` — nên mọi khổ màn dịch đúng 50px và
các điểm giao của clamp **không đổi vị trí**.

### 4.1 `src/styles/tokens.css`

| Dòng | Token | Nay | Sau |
|---|---|---|---|
| 182 | `--hero-entity-h-min` | `330px` | `380px` |
| 183 | `--hero-entity-h-max` | `430px` | `480px` |
| 184 | `--hero-entity-h-tablet` | `390px` | `440px` |
| 185 | `--hero-entity-h-mobile` | `290px` | `340px` |
| 189 | số giữa của `--hero-entity-h` | `calc(30vw + 50px)` | `calc(30vw + 100px)` |
| **186–188** | **chú thích ngay trên dòng 189** | xem dưới | **phải viết lại** |

Dòng 308 (`769–1023px`) và 312 (`≤768px`) trỏ tới token tablet/mobile, **không sửa** — chúng tự
theo.

#### ⚠ Dòng 186–188 — bỏ sót chỗ này là tự mâu thuẫn ngay trong một file

`tokens.css:186-188` là một khối chú thích ba dòng, nguyên văn:

```
/* Số giữa phải là `calc(30vw + 50px)`, KHÔNG phải `30vw`: nâng riêng trần
   380→430 chỉ cho +4px ở 1280 và +30px ở 1366, vì 30vw mới là số đang trói.
   Đã đo, xem QĐ-2026-08-28-02. */
```

Không sửa nó thì sau khi thi hành, **dòng 189 đọc `calc(30vw + 100px)` còn ba dòng ngay trên nó
khẳng định số giữa "phải là" `calc(30vw + 50px)`** — hai câu trái nhau cách nhau một dòng, trong
cùng một file. Và theo phần "Cổng canh tới đâu" bên dưới, **không cổng nào bắt được**.

Viết lại giữ nguyên bài học, chỉ cập nhật con số và tiền đề: số giữa phải là
`calc(30vw + 100px)`; nâng riêng trần từ 480 lên cao hơn chỉ cho +4px ở 1280 và +30px ở 1366; và
ghi thêm điểm giao **vw = 1266,67** để lần sau không ai phải tự suy ra.

### 4.2 Kiểm chứng phép cộng ở năm khổ

| Khổ | Nay | Sau | Chênh |
|---|---|---|---|
| 1710px | `clamp(330, 563, 430)` = **430** | `clamp(380, 613, 480)` = **480** | +50 |
| 1280px | `clamp(330, 434, 430)` = **430** | `clamp(380, 484, 480)` = **480** | +50 |
| 1024px | `clamp(330, 357, 430)` = **357** | `clamp(380, 407, 480)` = **407** | +50 |
| 900px (tablet) | token tablet = **390** | **440** | +50 |
| 390px (mobile) | token mobile = **290** | **340** | +50 |

### 4.3 Tài liệu phải sửa **cùng commit** — ba file, không phải một

Năm con số này được chép ở **ba** nơi ngoài `tokens.css`. Bỏ sót chỗ nào là cổng đỏ hoặc tài liệu
nói dối:

**a. `docs/core-specs/07-DESIGN_TOKENS.md` dòng 139–142** — bốn hàng, không phải một:

| Dòng | Mục | Nay | Sau |
|---|---|---|---|
| 139 | `layout.hero.entity.max` | 430px | 480px |
| 140 | `layout.hero.entity.min` | 330px | 380px |
| 141 | `layout.hero.entity.tablet` | 390px | 440px |
| 142 | `layout.hero.entity.mobile` | 290px | 340px |

Dòng 140 còn chép **công thức** `calc(30vw + 50px)` → `calc(30vw + 100px)`.

**Cổng canh tới đâu — đã đọc `scripts/check-token-parity.mjs`, không phải suy đoán.** Bảng ánh
xạ ở dòng 55–58 của script khai đúng bốn cặp:

```
'layout.hero.entity.max'    → --hero-entity-h-max
'layout.hero.entity.min'    → --hero-entity-h-min
'layout.hero.entity.tablet' → --hero-entity-h-tablet
'layout.hero.entity.mobile' → --hero-entity-h-mobile
```

Nên bốn giá trị phẳng **được canh thật**. Nhưng chú thích ngay trên bảng (dòng 54) ghi rõ:

> `--hero-entity-h` không so được vì bộ chuẩn hoá cắt ở dấu ngoặc đầu tiên.

⚠ **Nghĩa là số giữa `calc(30vw + 100px)` — con số quan trọng nhất của đợt này, thứ quyết định
+50px có xảy ra ở mọi khổ hay không — KHÔNG có cổng nào canh.** Quên sửa nó ở `07` dòng 140 thì
`check:token-parity` vẫn in xanh. Chỗ này phải kiểm bằng mắt và bằng `doc-reality-auditor`, và
bằng phép đo DOM ở §7 mục 1 — đó mới là thứ bắt được sai sót này.

**b. `docs/core-specs/06-BINDING_MAP.md` §3 hàng Hero (dòng 74)** — chép nguyên
`clamp(330px, calc(30vw + 50px), 430px)`, `390px`, `290px`. **Đây là tài liệu tầng 2**, trên spec
trong thứ tự thẩm quyền; sửa nó là **quyết định cần phiếu**, đi cùng phiếu ở §0.6.

**c. `docs/core-specs/KIEN-TRUC-TEMPLATE.md` §4** — chép cả năm giá trị.

#### Ví dụ "+4px ở 1280 và +30px ở 1366" — GIỮ NGUYÊN CON SỐ, chỉ đổi token nó nhắc

Ví dụ này xuất hiện ở cả `07` dòng 140 và `KIEN-TRUC-TEMPLATE` §4, dùng để dạy vì sao không được
nâng riêng trần. Đã kiểm lại số học:

- **1280:** `30vw + 50` = 434. Trần 430 → **430**. Nâng riêng trần → **434**. Chênh **+4px**.
- **1366:** `30vw + 50` = 459,8 (khớp `DECISIONS.md` dòng 2215). Trần 430 → **430**. Nâng riêng
  trần → **459,8**. Chênh **≈ +30px**.

Sau khi sửa, số giữa **và** trần cùng dịch 50px, nên hiệu giữa chúng **không đổi**:

- **1280:** `30vw + 100` = 484 so với trần 480 → vẫn **+4px**.
- **1366:** `30vw + 100` = 509,8 so với trần 480 → vẫn **≈ +30px**.

**Nên: giữ nguyên "+4px" và "+30px", chỉ cập nhật các giá trị token mà câu đó nhắc tới.**

#### ⚠ Cụm "Nâng trần 380→430" ở `KIEN-TRUC-TEMPLATE` §4 — lệch TIỀN ĐỀ, không lệch số học

> **Bản nháp đầu của spec này chẩn đoán SAI chỗ này. Ghi lại chẩn đoán đúng để không ai sửa
> nhầm ba chỗ đang đúng.**

Bản đầu viết: *"con số +4/+30 chỉ đúng khi nói về nâng trần từ 430 lên cao hơn"*. **Sai.**
Kiểm lại: cặp 380→430 cho **đúng** +4/+30 **nếu** số giữa là `30vw` trần —
tại 1280, `30vw` = 384 so với trần 380 ⇒ **+4**; tại 1366, `30vw` = 409,8 so với trần 380 ⇒
**+29,8 ≈ +30**. Đó chính là công thức **v2.5** (`clamp(280px, 30vw, 380px)`), tức bối cảnh mà
`QĐ-2026-08-28-02` đang nói tới.

Ba nơi đang ghi **ĐÚNG** vì có kèm tiền đề *"vì 30vw mới là số đang trói"* — **tuyệt đối không
"sửa" ba chỗ này:**

- `src/styles/tokens.css:186-188`
- `docs/core-specs/06-BINDING_MAP.md:74`
- `docs/DECISIONS.md:2118` (còn ghi thêm *"đủ +50px chỉ từ 1440 trở lên"* — chỉ đúng với `30vw`
  trần, là bằng chứng chốt cho tiền đề)

Chỗ **thật sự lệch** chỉ là `KIEN-TRUC-TEMPLATE.md:126`: nó nêu tiền đề số giữa là
`calc(30vw + 50px)` rồi dẫn cặp trần `380→430` của bối cảnh `30vw` trần. Ghép hai thứ khác bối
cảnh vào một câu, nên câu đó tự sai — **thiếu tiền đề, không phải sai số học**.

**Sửa:** khôi phục tiền đề bị rơi ở `KIEN-TRUC-TEMPLATE.md:126`, hoặc bỏ cặp "380→430" và viết
theo giá trị hiện hành. Đây là **lựa chọn biên tập**, xem câu hỏi Q3 gửi chủ dự án. Vẫn ghi một
dòng `DRIFT_LOG`, nhưng ghi **đúng chẩn đoán này** — chẩn đoán ở bản nháp đầu mà đóng đinh vào
sổ là dạy sai người đọc sau.

## 5. Phạm vi ảnh hưởng

Một dòng token đổi là **12 loại trang chi tiết** cộng **trang điểm đến** (`TouristDestinationHub`)
đổi theo, phủ cả ba biến thể hero (mosaic 2 cột, một ảnh, khối gradient) — cả ba dùng chung
chiều cao.

**Ngoài phạm vi:** `HomeHero` (trang chủ), và mọi trang danh sách (`EntityIndex`, `TourIndex`,
`EventIndex`, `HubIndex`, `TermIndex`) — chúng không render `Hero`.

## 6. Giả định đã nêu, chủ dự án có quyền phủ quyết

1. **+50 đều cả bốn khổ**, không riêng desktop.
2. **Mobile lên 340px** trên màn cao 844px là ~40% chiều cao màn hình. Nếu chủ dự án thấy quá
   nhiều thì giữ `--hero-entity-h-mobile` ở 290px và spec này thành "+50 trừ mobile" — sửa mục
   4.1 và 4.2 tương ứng.
3. `TouristDestinationHub` cao theo, vì dùng chung token.

## 7. Nghiệm thu

Mặc định của cổng là **không đạt** nếu không có bằng chứng (`CLAUDE.md` §6).

**0. Tiền đề — §0.7 đã xong:** phiếu `QĐ-2026-08-31-03` đã vào `docs/DECISIONS.md`, và
`06-BINDING_MAP` §3 hàng Hero đã sửa theo — điều kiện "0 trang" **đã xoá**. Không có phiếu thì
mọi mục dưới đây vô nghĩa, và tệ hơn: sửa token sẽ làm sâu thêm một ngoại lệ chưa ai xét lại.

1. **Đo DOM, không chụp màn hình.** `getBoundingClientRect().height` của phần tử hero tại
   **1710, 1366, 1280, 1024, 900, 390** — phải ra đúng **480 / 480 / 480 / 407 / 440 / 340**.
   Chụp màn hình trên site này hay treo; đo bằng JS là cách đã dùng cho mọi phép đo trong spec.
   **1366 và 1280 là bắt buộc**, không phải tuỳ chọn: cả lập luận Luật 3 (§0) lẫn ví dụ
   "+4px/+30px" (§4.3) đứng trên đúng hai khổ đó, mà bản nháp đầu không đo cái nào.
   **1b. Đo vị trí thanh dính ở 1366×768, TRƯỚC và SAU** — `.sticky-bar`
   `getBoundingClientRect().top` cộng `scrollY` ở đỉnh trang. Dự kiến 668 → **≈718**. Ghi cả hai
   số vào `QĐ-2026-08-31-03`. Đây là con số trung tâm của cả spec; không đo nó là nghiệm thu
   nửa dễ rồi bỏ ngỏ đúng nửa đang tranh chấp.
2. Đo trên **ít nhất hai loại entity khác nhau** (ví dụ `tour` và `attraction`) cộng
   **trang điểm đến**, để chứng minh token phủ hết chứ không phải trùng hợp một trang.
3. `npm --prefix scripts run check:token-parity` — xanh.
4. `npm run build` **trước**, rồi `npm run gate` (DR-105: `gate` không tự dựng lại; chạy nó trên
   `dist/` cũ sinh đỏ ảo). So **từng dòng** bảng tổng kết trước/sau, không đếm tổng số đỏ.
5. `git diff` chứng minh **không** có thay đổi nào chạm `--hero-min-h` / `--hero-min-h-mobile`.
6. Chạy `doc-reality-auditor` — `KIEN-TRUC-TEMPLATE.md` được canh bằng agent này chứ không bằng
   validator, và §4 vừa bị sửa.
