# SPEC — Build không vỡ vì dữ liệu thiếu

- **Trạng thái:** hướng B đã được chủ dự án duyệt 2026-08-05. Bước 1–3 đã thi hành, xem
  §11. Bước 4 đang chờ trả lời **Q1**.
- **Ngày soạn:** 2026-08-05   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa hai chiều (đổi cách khai kiểu, revert được bằng một commit)
- **Vào từ:** `docs/prompts/BUILD-BEN-VUNG-DU-LIEU-THIEU.md`
- **Repo lúc soạn:** `main` tại `1e00745`

---

## 1. Mục tiêu

Người nhập nội dung bỏ trống một ô trong Sanity thì trang vẫn phải dựng được. Thiếu
thì không hiển thị phần đó, hoặc báo cảnh báo, chứ không được ném lỗi chặn cả build.

## 2. Đầu vào đã đọc

`playbook/CONSTITUTION.md` · `playbook/GOVERNANCE.md` (§2 vai, §4 cổng, §5 bằng chứng) ·
`docs/core-specs/04-CONSTRAINTS.md` (§0 mô hình fail/warn, §2 điều cấm theo stack, §5 quy
tắc sửa) · `docs/DECISIONS.md` (toàn bộ, đặc biệt QĐ-2026-08-05-08 và ND-005) ·
`docs/adr/ADR-0022-go-cong-phat-hanh.md` · `docs/DRIFT_LOG.md` (DR-006, DR-011, DR-020) ·
`git show 278b287` · `git show f57d65b`.

Đã đọc mã: `src/lib/sanity.ts`, `src/lib/types.ts`, `src/lib/queries/*`, toàn bộ
`src/components/*.astro`, `src/pages/index.astro`, `src/pages/[lang]/index.astro`,
`src/pages/[pickupRoutePath].astro`, `package.json`, `wrangler.toml`, `tsconfig.json`.

---

## 3. Khảo sát lại — ba con số trong prompt cần sửa

Prompt dặn đo lại trước khi tin. Đã đo. Bốn con số đúng, ba con số sai lệch, và **một
con số sai đủ để đổi kết luận**.

**Đúng.** 14 dòng destructuring dùng khuôn `= []`. 17 lời gọi `.fetch(` ngoài
`src/lib/sanity.ts`, nằm trong 4 file (12 ở `RouteDispatch.astro`, 2 ở `pages/index.astro`,
2 ở `pages/[lang]/index.astro`, 1 ở `[pickupRoutePath].astro`). 6 file ngoài `sanity.ts`
chạm `getClient`. 210 lượt gọi `.map/.find/.filter/.length/.join/.slice` trong components.

**Lệch nhẹ.** Khai báo `?: T[]` trong components là 14 chứ không phải 13. Và **không tìm
thấy tham số hàm nào khai `T[] | undefined`** — con số 12 trong prompt không tái lập được.

**Sai đủ để đổi kết luận: con số 210.**

Con số 210 gợi ý 210 chỗ có thể nổ. Thực tế không phải vậy. Tôi đã lọc ba vòng:

| Vòng lọc | Còn lại |
|---|---|
| Mọi lượt gọi `.map/.find/.filter/...` trong components | 210 |
| Bỏ mảng dựng tại chỗ, chỉ giữ truy cập lên dữ liệu từ Sanity | 72 |
| Bỏ chỗ đã có `x && x.length > 0` hoặc `x?.` chặn trên cùng dòng | 39 |
| Bỏ chỗ có chặn ở dòng phía trên (khuôn JSX nhiều dòng) | 15 |
| Đọc tay 15 chỗ còn lại | **0** |

Cả 15 chỗ cuối đều là dương tính giả — chúng có chặn dạng `td?.faq && …`, máy dò của
tôi không khớp vì dấu `?.` nằm giữa. Tôi cũng quét riêng lớp truy cập vô hướng
(`data.address.street` và tương tự): **7 chỗ khả nghi, đọc tay ra 7 dương tính giả.**

Và quét riêng đúng khuôn đã làm vỡ `HomeMetaBar` — destructure `= []` rồi gọi thẳng
`.find()` mà không chặn: **0 chỗ.**

### Điều này có nghĩa gì

**Hôm nay repo không có quả mìn nào đang cắm sẵn.** Codebase phòng vệ tốt hơn nhiều so
với hình dung ban đầu, vì khuôn phổ biến nhất trong code là `x && x.length > 0` — và
khuôn đó đỡ được cả `null` lẫn `undefined`. `HomeMetaBar` vỡ vì nó là ngoại lệ: nó dùng
khuôn `= []`, mà khuôn đó **chỉ** đỡ `undefined`.

Nên việc cần làm không phải là "đi gỡ 210 quả mìn". Nó là:

> **Đảm bảo quả mìn tiếp theo bị máy bắt lúc biên dịch, chứ không bị Cloudflare bắt lúc
> deploy.**

Đây là chỗ vấn đề thật sự nằm, và nó nằm gọn ở **một file**:

`src/lib/types.ts`, 480 dòng, là nơi khai hình dạng mọi thứ Sanity trả về. Trong đó có
**81 khai báo mảng tuỳ chọn** (`?: T[]`, nghĩa là `T[] | undefined`) và chỉ **7 chỗ**
thừa nhận `| null`. GROQ trả `null` cho field không tồn tại. Nên 81 dòng đó đang nói sai
sự thật, và `astro check` tin chúng.

Lời nói dối có **một địa chỉ duy nhất**. Đó là dữ kiện quan trọng nhất của khảo sát này.

---

## 4. Chọn hướng: **Hướng B**, không phải A

Prompt nghiêng về A và mời tôi tìm lỗ hổng. Tôi tìm được hai, và cả hai đều chí mạng.

### 4.1 Hướng A hỏng ở đâu

**Lỗ hổng 1 — A chỉ chữa được một trong hai vụ vỡ đã xảy ra.**

Hai vụ có "cùng hình dạng" theo prompt, nhưng chỉ cùng ở phần triệu chứng, không cùng ở
phần nguồn:

| | `278b287` HomeMetaBar | `f57d65b` llms.txt |
|---|---|---|
| Giá trị gây vỡ | `null` | `undefined` |
| Sinh ra ở đâu | GROQ, ngay tại cửa fetch | `compactObject()` trong `src/lib/geoKnowledge.ts:229`, **sau** cửa fetch |
| Bọc ở cửa fetch có bắt được không | Có | **Không** |

`compactObject()` xoá hẳn key khi object rỗng. Nó chạy trên dữ liệu đã vào nhà rồi. Một
hàm bọc đặt ở cửa về mặt cấu trúc là mù với nó. Nói cách khác: **A giải quyết 1 trên 2 sự
cố lịch sử, và sự cố nó bỏ sót là sự cố gần đây hơn.**

**Lỗ hổng 2 — A biến một vấn đề máy bắt được thành một vấn đề không ai bắt được.**

Sau khi làm A, 81 dòng trong `types.ts` vẫn nói `undefined`. Chỉ là bây giờ điều đó tình
cờ thành đúng, **nhờ một hàm bọc ở nơi khác**. Không có gì bắt buộc điều đó phải tiếp tục
đúng. Ai đó thêm một đường đọc Sanity mới không đi qua cửa, lời nói dối quay lại — và
`astro check` vẫn xanh, vì kiểu vẫn khai như cũ.

Đây đúng là kiểu thất bại mà repo này giỏi nhất trong việc tự gây ra cho mình. Bốn bản ghi
drift gần nhất đều cùng một câu chuyện: **một lớp bảo vệ tồn tại trên giấy và không ai
biết nó không chạy.**

- DR-015 — `shared/gates` mất tích, kéo sập cả bộ kiểm, không ai thấy.
- DR-016 — sổ đăng ký suýt nói dối.
- DR-020 — `check:cwd` đỏ suốt đời repo, nên `build:strict` chưa từng chạy dòng thứ hai.
- DR-021 — cổng in `[pass]` cho phép kiểm mà nó không chạy được.

A thêm một lớp nữa vào đúng cái chồng đó: **im lặng khi hỏng.** Đó không phải cái repo này
đang thiếu.

**Và cái bẫy prompt đã nêu.** A che `null` thì che luôn tín hiệu "dữ liệu đang thiếu".
Đúng, nhưng vấn đề sâu hơn thế: A vừa che vừa được kỳ vọng phải báo cáo. Một hàm vừa xoá
bằng chứng vừa làm nhân chứng là một thiết kế tự mâu thuẫn.

### 4.2 Vì sao Hướng B

**Lý do 1 — `astro check` là cổng máy duy nhất còn nối vào production.**

ADR-0022 đã gỡ toàn bộ validator khỏi đường phát hành. `wrangler.toml` đặt
`command = "npm run build:ci"`, `build:ci` = `npm run build` = **`astro check && astro build`**.

Nghĩa là hôm nay, trên đường lên production, `astro check` là thứ duy nhất chặn được cái
gì. Hướng B là hướng duy nhất trong hai hướng biết dùng cổng đó. Hướng A không nhờ được
`astro check` một tí nào — nó chạy lúc build, sau khi check đã xong.

**Lý do 2 — chính ADR-0022 đã chỉ vào hướng B.**

> *"Hai lần deploy vỡ gần nhất đều do code hạ nguồn giả định sai về hình dạng dữ liệu…
> thứ bắt được nó là **kiểu dữ liệu trung thực trong `src/lib`**, không phải cổng CI."*
> — ADR-0022, mục Lý do

Đây là lập luận đã được chủ dự án phê chuẩn ngày 2026-08-04, và nó là mô tả của hướng B.
Chọn A là đi ngược một quyết định cửa-một-chiều đã ghi, mà không có ADR nào đảo nó.

**Lý do 3 — B rẻ hơn nhiều so với hình dung, vì lời nói dối chỉ có một địa chỉ.**

Nỗi lo về B là "sẽ nổ ra một loạt lỗi phải xử một lần". Nhưng:

- Phần **khai báo** nằm gọn trong `src/lib/types.ts`. Không phải 61 file `.astro`.
- Phần **hệ quả** bị chặn lại bởi chính sự phòng vệ mà tôi vừa đo được: mọi chỗ viết
  `data.faq && data.faq.length > 0` đều **tự động qua** dưới `strictNullChecks`, vì phép
  kiểm chân trị đã loại `null` khỏi kiểu rồi. TypeScript hiểu khuôn đó.
- `tsconfig.json` đã `extends: astro/tsconfigs/strict`, tức `strictNullChecks` đã bật sẵn.
  Không phải bật thêm gì.
- Baseline sạch: `astro check` hiện **0 lỗi, 0 cảnh báo**. Nên mọi lỗi mới hiện ra đều
  chắc chắn do thay đổi này, không lẫn với nợ cũ.

Lỗi sẽ chỉ nổ ra đúng ở những chỗ **thật sự không phòng vệ**. Bán kính nổ tỉ lệ thuận với
rủi ro thật. Đó chính là điều ta muốn ở một bộ kiểm.

**Lý do 4 — B đổi loại lỗi, đúng theo yêu cầu của mục tiêu.**

- Hôm nay: nhập thiếu field → build vỡ **trên Cloudflare**, sau khi push, khi trang đã
  chết.
- Sau B: code không xử lý field thiếu → **không biên dịch được trên máy**, trước khi
  commit. Còn code đã biên dịch được thì đã chứng minh là xử lý được field thiếu — nên
  người nhập nội dung bỏ trống một ô, trang vẫn dựng, phần đó không hiển thị.

Đây là lời hứa mà A không đưa ra được. A hứa "code hiện tại tình cờ chạy". B hứa "code sai
không vào được".

### 4.3 Và tôi **không** làm hỗn hợp A + B

Chồng A lên B sẽ vô hiệu hoá B: nếu hàm bọc đã đổi `null` thành `undefined` trước, thì
khai `| null` trong kiểu không còn tương ứng thực tế nữa, và `astro check` mất chỗ bám.
Hai hướng loại trừ nhau về mặt cơ chế, không cộng dồn được.

**Nhưng** một phần của ý tưởng A vẫn được giữ, và giữ đúng chỗ: `getClient()` là cửa vào
duy nhất thật sự — `createClient` chỉ xuất hiện một lần, ở `src/lib/sanity.ts:20`, và mọi
đường đọc dữ liệu đều đi qua đó. Tôi dùng nó làm **chỗ quan sát**, không làm chỗ sửa. Xem
mục 6.

---

## 5. Phạm vi thay đổi — file và mức độ

Chia bốn bước. **Bước 1 kết thúc bằng một điểm dừng bắt buộc** trước khi làm tiếp.

### Bước 1 — Khai thật, rồi đo (một commit, dừng lại báo cáo)

| File | Phạm vi thay đổi |
|---|---|
| `src/lib/types.ts` | Đổi `?: T[]` thành `?: T[] \| null` cho các field mảng được GROQ chiếu thẳng (không qua `coalesce`, không qua sub-query). Ước lượng 40–55 trên tổng 81 dòng. **Chỉ đổi khai báo, không đổi gì khác.** Mỗi cụm kèm một dòng chú thích lý do, theo khuôn `278b287` đã đặt ra. |

Chạy `astro check`, ghi lại **số lỗi và danh sách file**. Không sửa lỗi nào ở bước này.

**Điểm dừng và quy tắc quyết định:**

- ≤ 60 lỗi → đi tiếp bước 2, không cần hỏi lại.
- \> 60 lỗi → **dừng, báo cáo, chờ chủ dự án**. Số đó nghĩa là giả định "codebase đã phòng
  vệ tốt" của tôi sai, và phạm vi gói này phải được cân lại chứ không phải cứ thế cày.

Ngưỡng 60 chọn theo bậc độ lớn, không theo cảm tính: tôi đo được 0 chỗ hở thật, nên bất kỳ
con số nào vượt xa vài chục đều có nghĩa là khảo sát của tôi sót một lớp, và lúc đó việc
đúng là dừng chứ không phải sửa tiếp.

### Bước 2 — Xử lỗi tại chỗ (một commit mỗi nhóm)

Chỉ đụng những file mà bước 1 chỉ mặt. Không mở rộng.

| Nhóm file dự kiến | Phạm vi thay đổi |
|---|---|
| `src/components/*Detail.astro` (14 file dùng `= []`) | Bỏ khuôn `= []`, thay bằng `?? []` tại điểm dùng. Kiểu Props đổi thành `?: T[] \| null`. Đúng khuôn `278b287` đã làm cho `HomeMetaBar`. |
| `src/components/DetailLayout.astro`, `NearbySection.astro` | `nearby`/`entities` hiện khai `T[]` bắt buộc nhưng chỉ an toàn nhờ default của tầng gọi. Cho `\| null` và `?? []`. |
| `src/components/HomeAreaGrid.astro`, `HomeGuideGrid.astro` | `const cards = places.map(…)` chạy thẳng trên props. Đổi thành `(places ?? []).map(…)`. |
| `src/components/Hero.astro` | Đã có `(gallery ?? [])`, nhiều khả năng chỉ cần sửa khai báo kiểu. |
| Các file khác `astro check` chỉ ra | Cùng nguyên tắc. |

**Nguyên tắc xử lý, không được đi chệch:**

1. Sửa bằng `?? []` hoặc bằng phép kiểm chân trị. **Cấm dùng `!`** (non-null assertion) và
   **cấm `as`** — hai thứ đó là nói dối lần nữa, chỉ nói ở chỗ khác.
2. Thiếu dữ liệu thì **không render phần đó**, không render chỗ trống, không render chữ
   thay thế. Đây là hành vi mà `278b287` đã thiết lập và đã được chấp nhận ("khối meta-bar
   vẫn không render vì `sameAs` rỗng").
3. Không đổi bố cục, không đổi giao diện. Gói này không phải gói thiết kế.

### Bước 3 — Lớp quan sát (một commit)

| File | Phạm vi thay đổi |
|---|---|
| `src/lib/sanity.ts` | Thêm một hàm quan sát, gói quanh `.fetch` của client mà `getClient()` trả về. Nó **duyệt kết quả, đếm field `null`, ghi lại đường dẫn field — và trả nguyên giá trị, không đổi một byte nào.** Cuối build in một bảng tổng kết. |

Chi tiết ở mục 6.

### Bước 4 — Dựng cảnh dữ liệu thiếu để chứng minh (một commit)

| File | Phạm vi thay đổi |
|---|---|
| `src/lib/sanity.ts` | Thêm một cầu dao thử, bật bằng biến môi trường `SANITY_NULL_DRILL=1`. Khi bật, hàm bọc ở bước 3 **đổi mọi field tuỳ chọn thành `null`** trước khi trả. Mặc định tắt; không đặt biến thì không một dòng nào của nó chạy. |

Chi tiết và phương án thay thế ở mục 7.

### Không đụng tới

`cms/` · `scripts/` · `data/prices.yaml` · `src/site.config.ts` · `playbook/` ·
`docs/core-specs/04-CONSTRAINTS.md` · `docs/governance/control-registry.yaml` ·
bất kỳ file `.astro` nào `astro check` không chỉ mặt.

---

## 6. Thiếu field thì ai biết, và biết bằng cách nào

Câu hỏi này có hai nửa, và chúng cần hai cơ chế khác nhau.

### Nửa thứ nhất — người viết code biết, lúc biên dịch

`astro check` báo đỏ ngay trên máy, trước commit. Không thể bỏ qua: nó là dòng đầu của
`npm run build`, và `npm run build` là lệnh build thật trên Cloudflare. Đây là bằng chứng
hạng **E1** (máy sinh, máy kiểm) theo `GOVERNANCE` §5.2.

### Nửa thứ hai — chủ dự án biết, lúc build

Hàm quan sát ở bước 3 in vào cuối log build một bảng như sau:

```
[dữ liệu thiếu] 7 field trống trong 4 document — trang vẫn dựng, phần liên quan không hiển thị

  attraction / hon-mun          sameAs, highlights
  attraction / vinpearl         sameAs
  place      / bai-dai          faq, keyFacts
  organization / cong-ty-…      sameAs, knowsAbout

  Đây là báo cáo mô tả, không phải danh sách field bắt buộc.
  Field nào bắt buộc: xem 01-CONTENT_MODEL §2 và scripts/gate.config.ts.
```

**Vì sao chọn log build chứ không chọn một cổng mới.**

`04-CONSTRAINTS` §0 đã định nghĩa sẵn mức `warn` là *"build chạy tiếp, vi phạm in thành
báo cáo cuối log build để founder rà"*. Tôi dùng đúng cơ chế đã có tên, không phát minh
cái thứ hai. Hệ quả:

- Không thêm mức enforce mới. Không đụng `VALIDATOR_LEVELS`.
- Không thêm dòng nào vào `docs/governance/control-registry.yaml`.
- Không hạ `fail` nào xuống `warn`. Đúng ranh giới prompt đã vạch.
- Có tiền lệ trong chính repo: `src/pages/index.astro:23` đã `console.warn` khi không tìm
  thấy document trang chủ.

**Vì sao báo cáo này không tạo nguồn sự thật thứ hai (N7).**

Nó **mô tả**, không **quy định**. Nó nói "field này đang trống", không nói "field này bắt
buộc". Nguồn sự thật về field bắt buộc vẫn là `01-CONTENT_MODEL` §2 và
`scripts/gate.config.ts`, không đổi. Ranh giới này phải được giữ khi viết code: nếu báo
cáo bắt đầu phân loại nặng/nhẹ hoặc bắt đầu chặn, nó đã lấn sang tầng quy định và phải
dừng lại xin quyết định.

**Vì sao không ghi ra file.** `04-CONSTRAINTS` §2.4 cấm build ghi vào cây làm việc, và
`scripts/reports/` đang được git theo dõi (5 file). Ghi thêm vào đó sẽ làm bẩn working
tree sau build. In ra màn hình là đủ và không vi phạm gì.

---

## 7. Cách chứng minh đã xong

`GOVERNANCE` §4.1 mặc định cổng là **không đạt** nếu không có bằng chứng, và §5.1 nói tự
khai của AI không bao giờ là bằng chứng đủ. Nên "đã kiểm xong" không được tính. Bốn bằng
chứng dưới đây, ba trong bốn là E1.

### BC-1 (E1) — Diễn tập dữ liệu thiếu: bật cầu dao, build vẫn đi hết

Đây là bằng chứng chính, và là thứ trả lời trực tiếp câu hỏi của prompt.

```
SANITY_NULL_DRILL=1 npm run build
```

Cầu dao làm cho **mọi field tuỳ chọn trong mọi kết quả GROQ trở thành `null`** — tức là
mô phỏng một dataset mà người nhập nội dung bỏ trống toàn bộ mọi ô không bắt buộc, cùng
lúc, trên mọi document. Đây là kịch bản xấu hơn thực tế rất nhiều.

**Điều kiện đạt:** build chạy tới `Complete!`, không TypeError, số trang sinh ra bằng lần
build thường. Giao nộp: log build đầy đủ, đếm trang, và bảng báo cáo field thiếu ở mục 6.

**Điều kiện đạt phụ:** mở thử vài trang trong `dist/` và thấy chúng thiếu phần nội dung
nhưng **không vỡ khung** — không có `undefined` in ra màn hình, không có khối trống lơ lửng.

Đây là chỗ mà mọi cách làm khác đều dừng lại ở lời hứa. Cầu dao biến lời hứa thành một
lệnh chạy lại được bất cứ lúc nào.

### BC-2 (E1) — `astro check` sạch với kiểu đã khai thật

`npm run check` → 0 lỗi, 0 cảnh báo, **sau khi** `types.ts` đã khai `| null`. Trước gói
này cũng 0/0, nhưng là 0 trên một lời nói dối. Sau gói này là 0 trên sự thật. Giao nộp:
output đầy đủ, cùng với số lỗi ở bước 1 để thấy đã xử bao nhiêu.

### BC-3 (E1) — Cổng cũ không xấu đi

`npm --prefix scripts run gate:all` phải giữ nguyên **9 xanh / 1 đỏ**, và cái đỏ vẫn phải
đúng là `deferred-gate`. Đỏ thêm bất cứ cái gì khác là hồi quy, phải xử trước khi giao.

`npm run check:cwd` xanh.

### BC-4 (E2) — Trang không đổi khi dữ liệu đủ

Build thường (không cầu dao), so `dist/` trước và sau gói này. Kỳ vọng: **không khác biệt
về nội dung hiển thị**. Gói này chỉ đổi cách code phản ứng khi thiếu dữ liệu; dữ liệu đang
đủ thì mọi thứ phải y nguyên. Giao nộp: `diff -r` giữa hai thư mục `dist/`, và giải thích
từng khác biệt nếu có.

---

## 8. Phần cố ý để lại, và vì sao

### 8.1 Lớp vô hướng — để lại, có chủ ý

Gói này khai `| null` cho **field mảng**, không cho field vô hướng (chuỗi, số, object lồng).

**Vì sao.** Field mảng có một cách sửa đúng duy nhất và máy móc: thiếu thì coi như rỗng,
`?? []`, không hiển thị. Field vô hướng không có câu trả lời chung — thiếu `title` thì
hiển thị gì? thiếu `summary` thì có nên vẫn ra trang không? Mỗi field một quyết định nội
dung, và quyết định nội dung không thuộc quyền của tác nhân thực thi.

**Rủi ro tồn dư, ghi thẳng:** build **vẫn có thể vỡ** vì một field vô hướng thiếu. Đó
chính là hình dạng của `f57d65b` (`entity.summary.vi` khi `summary` vắng mặt). Tôi đã quét
lớp này: **7 chỗ khả nghi, đọc tay ra 7 dương tính giả, tức 0 chỗ hở hôm nay.** Nhưng
"hôm nay không hở" không phải "được bảo vệ" — đó đúng là bài học của gói này.

**Đề nghị:** ghi thành phiếu nợ `ND-006` để không rơi mất. Lớp vô hướng nên làm ở một gói
riêng, sau khi có danh sách "thiếu field nào thì hiển thị ra sao" do chủ dự án chốt.

### 8.2 `compactObject()` và `src/lib/geoKnowledge.ts` — để lại

`f57d65b` đã vá đúng chỗ vỡ và khai `title?`/`summary?` cho đúng sự thật. Phần còn lại của
file chưa được rà toàn diện. Gói này không đụng, vì `geoKnowledge` sinh `llms.txt` và
`/ai/*.json` — khác đường với các trang `.astro`, và trộn hai thứ vào một gói làm diff khó
review. Ghi cùng `ND-006`.

### 8.3 ND-005 và `deferred-gate` — không đụng, đúng như prompt dặn

`deferred-gate` đỏ vì `ND-005`, đã được chủ dự án chốt hoãn sau pha B tại
`QĐ-2026-08-05-08`. Không phải việc của gói này. BC-3 chỉ yêu cầu **giữ nguyên** trạng thái
đó, không yêu cầu sửa.

### 8.4 Không siết cổng, không nới cổng

Không thêm validator, không thêm dòng vào `control-registry.yaml`, không đổi mức nào trong
`VALIDATOR_LEVELS`, không hạ `fail` xuống `warn`. Gói này chỉ làm cho một cổng **đang chạy
sẵn** (`astro check`) nhìn thấy nhiều hơn.

### 8.5 DR-011 — có liên quan nhưng khác tầng, để lại

`g3` cảnh báo `organization` truy cập `data.sameAs` mà `06-BINDING_MAP` không khai field
đó. Cùng một field `sameAs`, nhưng đó là lệch giữa **đặc tả bề mặt và code**, còn gói này
xử lệch giữa **kiểu và dữ liệu**. Sửa binding map là việc của pha A. Ghi chú chéo để hai
việc gặp nhau, không gộp.

---

## 9. Hai điều cần chủ dự án quyết trước khi tôi chạy

### Q1 — Cầu dao thử nằm trong `src/lib/sanity.ts` có chấp nhận được không?

**Vấn đề.** BC-1 là bằng chứng mạnh nhất của gói này, nhưng để dựng được cảnh dữ liệu
thiếu, cần một đoạn mã chỉ phục vụ việc thử nằm trong file sản phẩm. `.env` chỉ có token
đọc (theo `ND-002`), nên không thể xoá field thật trong Sanity để thử.

**Ba lựa chọn:**

| | Cách làm | Được | Mất |
|---|---|---|---|
| **A** *(đề xuất)* | Cầu dao `SANITY_NULL_DRILL=1` trong `src/lib/sanity.ts`, mặc định tắt | Không thêm phụ thuộc; chạy lại được bất cứ lúc nào; bằng chứng E1 thật | Mã phục vụ việc thử nằm trong file sản phẩm (khoảng 15 dòng, có rào bằng biến môi trường) |
| **B** | Astro Container API + `node:test`, dựng từng component với props toàn `null` | Tách sạch khỏi mã sản phẩm; kiểm được từng component riêng | **Thêm phụ thuộc mới** — theo `CLAUDE.md` §8 cần quyết định ở tầng phù hợp, không thuộc quyền tôi |
| **C** | Chủ dự án tự xoá vài field trong Sanity Studio rồi build | Dữ liệu thật | Không lặp lại được, không phải E1, và **sửa nội dung production** để lấy bằng chứng |

**Tôi đề xuất A**, và đề nghị nâng lên B ở **pha F** — nơi `QĐ-2026-08-05-09` và
`QĐ-2026-08-05-10` đã hẹn sẽ quyết công cụ kiểm thử (playwright cho so mockup và Lighthouse
cho QA2). Gộp quyết định phụ thuộc vào một chỗ thì rẻ hơn quyết hai lần.

**Nếu bác A**, BC-1 mất và gói này chỉ còn BC-2/3/4 — tức là còn bằng chứng "code khai
đúng" nhưng **mất bằng chứng "build sống sót"**. Đó là đúng thứ prompt đòi. Nên nếu A bị
bác thì tôi cần B, chứ không nên rơi xuống C.

### Q2 — Thư mục `docs/specs/` là chỗ đúng cho file này chứ?

Repo chưa có chỗ dành cho spec cấp gói việc: `docs/core-specs/` là spec nền `00..08`,
`docs/prompts/` là prompt bàn giao. Tôi đặt tạm ở `docs/specs/`. Nếu chủ dự án muốn chỗ
khác, đổi trước khi tôi chạy để tránh phải di chuyển giữa chừng.

---

## 10. Điểm dừng

**Dừng ở đây, chờ chủ dự án duyệt cổng QA1.**

`GOVERNANCE` §4.2: chưa qua QA1 thì Code không chạy. `GOVERNANCE` §3.1: Cowork soạn, chủ
dự án duyệt. Chưa một dòng code nào bị sửa.

**Cần chủ dự án làm ba việc:**

1. Duyệt hướng B thay cho hướng A, hoặc bác lại kèm lý do.
2. Trả lời **Q1** (cầu dao thử) và **Q2** (chỗ đặt spec).
3. Duyệt ngưỡng dừng ở bước 1 (60 lỗi) — hoặc đặt con số khác.

Duyệt xong thì việc chạy sẽ theo đúng thứ tự bước 1 → 4 ở mục 5, và **dừng lại lần nữa
sau bước 1** để báo cáo số lỗi đo được, kể cả khi số đó dưới ngưỡng.

---

## 11. Kết quả thi hành (ghi ngày 2026-08-05, sau khi chủ dự án duyệt hướng B)

### 11.1 Bước 1 — đo

`astro check` sau khi khai `| null`: **58 lỗi**, dưới ngưỡng 60 đã đề xuất. Không lỗi nào
là `.map()` trần — **cả 58 đều cùng một hình dạng duy nhất**: truyền `T[] | null` vào một
hàm hoặc component khai nhận `T[] | undefined`. Phân bố: 23 ở `src/lib/serialize/*`, 35 ở
`src/components/*.astro`.

Kết quả này xác nhận khảo sát ở §3: lớp render đã phòng vệ sẵn, chỗ sai nằm ở hợp đồng.

### 11.2 Bước 2 — sửa, khác đề xuất ban đầu

Spec §5 dự kiến sửa tại từng điểm dùng bằng `?? []`. Thực tế 58 lỗi hội tụ về **13 chữ ký
dùng chung**, và mọi hàm đó **đã xử lý `null` đúng lúc chạy** (`if (!x || x.length === 0)
return []`) — chỉ phần khai kiểu là sai. Nên sửa ở hợp đồng nhận, không rải `?? []` ra 58
chỗ gọi. Ít diff hơn, và trung thực hơn: hàm nói đúng thứ nó vốn đã chịu được.

| File | Thay đổi |
|---|---|
| `src/lib/types.ts` | **84 dòng khai** field mảng thêm `\| null` (nhiều hơn ước lượng 40–55 ở §5, vì `coalesce(a, b)` không nền cũng trả null chứ không chỉ chiếu thẳng). Giữ nguyên `homepagePlaces`, `homepageArticles`, `experiences` — sub-query `*[…]` luôn trả mảng, có ghi chú tại chỗ. Thêm khối chú thích quy ước ở đầu vùng GROQ. |
| `src/lib/serialize/utils.ts` | 7 chữ ký: `galleryToLd`, `imagesToLd`, `faqToLd`, `faqPageToLd`, `keyFactsToLd`, `sameAsToLd`, `portableTextToDescription`, `speakableToLd`. |
| `src/lib/serialize/lodgingBase.ts` | `LodgingData`: 7 field mảng. |
| `src/components/Body.astro` | `blocks`. |
| `src/components/DetailLayout.astro` | `gallery`. |
| `src/components/Hero.astro` | `gallery`; **bỏ khuôn `= []`** (đã có `?? []` bên dưới nên khuôn kia chỉ gây hiểu nhầm). |
| `src/components/TouristDestinationHub.astro` | `featuredCards()`. |
| 10 × `*Detail.astro` | `hasPtContent` / `hasBlocksContent`. |

Không dùng `!` ở bất kỳ chỗ nào. Có đúng **một** chỗ dùng `as`, trong lớp quan sát ở bước
3: `node as Record<string, unknown>` — đây là thu hẹp `object` thành dạng tra được khoá,
không phải dập tắt `null`, nên không thuộc diện §5 cấm. Không đổi bố cục, không đổi giao
diện.

**13 chỗ `= []` còn lại giữ nguyên, có lý do.** Sau bước 1, trình biên dịch *chứng minh*
được nguồn nào có thể null. Cả 13 chỗ đó nhận mảng chắc chắn: `fetchNearby()` khai trả
`any[]` và mọi nhánh đã có `?? []`; `homepagePlaces`/`homepageArticles` là sub-query. Khuôn
`= []` chỉ nguy hiểm khi nguồn có thể null — ở đây không. Gỡ thêm là nở phạm vi.

### 11.3 Bước 3 — lớp quan sát

`src/lib/sanity.ts`: gói `.fetch` của client singleton. **Chỉ đọc và đếm, không đổi một
giá trị nào.** Đặt tại `getClient()` vì đó là nơi duy nhất `createClient` được gọi, nên phủ
hết cả 17 lời gọi `.fetch(` rải rác lẫn các helper — không phải sửa chỗ nào khác.

Hai lần phải siết cho báo cáo có nghĩa, ghi lại vì đây là phần dễ làm sai:

1. Bản đầu báo **264 field / 27 "document"**, phần lớn là rác: `article` bị báo thiếu
   `itinerary`, `place` thiếu `venue`. Nguyên nhân là truy vấn gộp nhiều loại
   (`_type in [...]`, trong `geoKnowledge.ts`) chiếu chung một bộ field cho mọi loại. Đó
   là hình dạng truy vấn, không phải ô bỏ trống.
2. Bản thứ hai lọc theo "field này đã từng có giá trị trên document cùng loại chưa" —
   xuống 5 dòng, nhưng **nuốt mất `touristDestination / nha-trang → sameAs`**, đúng field
   đã làm vỡ build ở `278b287`, chỉ vì dataset có mỗi một document loại đó nên không có gì
   để đối chiếu. Một phép lọc làm im đúng ca mẫu là phép lọc sai.
3. Bản dùng: bỏ qua truy vấn gộp loại, và chỉ tính object có **cả `_type` lẫn `_id`** là
   document (ảnh và kết quả `select()` theo ngôn ngữ có `_type` nhưng không có `_id`).

Kết quả: **74 field trống trên 10 document**, mỗi dòng một document thật, và `nha-trang →
sameAs` có mặt.

Một rủi ro tự tạo, đã bịt: `src/lib/sanity.ts` cũng bị gói vào `_worker.js`, mà runtime
Workers không có `process.on` — gọi thẳng sẽ nổ trên production. Đã rào bằng `typeof`,
cùng cách file này vốn đã phòng thủ cho `process.env`.

### 11.4 Bằng chứng

| | Kết quả |
|---|---|
| **BC-2** (E1) `astro check` | **0 lỗi, 0 cảnh báo** — nhưng lần này là 0 trên kiểu đã khai thật, không phải 0 trên lời nói dối. |
| **BC-3** (E1) `check:cwd` | xanh. |
| **BC-3** (E1) `gate:all` | **9 xanh / 1 đỏ**, đúng `deferred-gate` (ND-005, đã chốt hoãn ở QĐ-2026-08-05-08). Không hồi quy. |
| **BC-4** (E2) `dist` trước/sau | Dựng lại từ `1e00745` sạch rồi so cả cây: **toàn bộ 62 file HTML/XML/TXT giống hệt nhau**. Bốn file `ai/*.json` khác đúng một dòng `generatedAt`. `_worker.js` đổi hash vì có thêm code lớp quan sát. Không một byte nội dung hiển thị nào đổi. |
| **BC-1** (E1) diễn tập dữ liệu thiếu | **Chưa làm — chờ Q1.** |

### 11.5 Còn lại

- **Bước 4 / BC-1** chờ trả lời **Q1**. Đây là bằng chứng mạnh nhất của gói và cũng là thứ
  trả lời trực tiếp câu hỏi "build có sống sót khi dữ liệu thiếu không". Chưa có nó thì
  hiện mới chứng minh được *code khai đúng*, chưa chứng minh được *build sống sót*.
- **Q2** (chỗ đặt spec) chưa trả lời; file vẫn ở `docs/specs/`.
- Phiếu nợ **ND-006** (lớp vô hướng, `geoKnowledge`) mới là **đề nghị** ở §8.1, chưa ghi
  vào `DECISIONS.md` — sổ đó chỉ thêm được, và ghi vào là việc của chủ dự án.
- Chưa commit. Toàn bộ thay đổi đang nằm ở cây làm việc.
