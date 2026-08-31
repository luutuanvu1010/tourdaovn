# SPEC — `/cong-ty/` liệt kê toàn bộ Organization

- **Trạng thái:** thiết kế duyệt trong phiên 2026-08-31 (chủ dự án duyệt cả ba mảnh cùng lượt).
  Chưa thi hành.
- **Ngày soạn:** 2026-08-31   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa **hai chiều** về mã (một cờ), nhưng **mở một URL công khai mới** vào
  sitemap. Gỡ về sau là để lại một URL từng được lập chỉ mục — cân nhắc ở §6.
- **Đầu vào đã đọc:** `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` §1.3 (dòng 60, 95–96),
  §3 (dòng 121), `src/lib/routes.ts` dòng 75 và 241–248, `src/site.config.ts` dòng 175, 211–212,
  `src/components/RouteDispatch.astro` (`INDEX_QUERY`, `toListing`, nhánh `kind === 'index'`),
  `src/lib/queries/organization.ts`, `src/lib/uiCopy.ts` (`INDEX_COPY`),
  `src/pages/[...path].astro` `getStaticPaths`.
- **Repo lúc soạn:** `main` tại `4118209`
- **Anh em cùng đợt:** `SPEC-2026-08-31-hero-entity-cao-them-50px.md`,
  `SPEC-2026-08-31-form-dat-tour-gon-va-chi-tiet-gia.md`. Ba mảnh **gần độc lập**: không chia sẻ file, nhưng §4.2 của mảnh form bị ràng buộc bởi
  quyết định Luật 3 của mảnh hero — chủ dự án đã chốt **lối A** ngày 31/08, nên ràng buộc này đã gỡ.
  Thứ tự đúng: `QĐ-2026-08-31-03` → mảnh công ty → mảnh form → mảnh hero.

---

## 1. Mục tiêu

`/cong-ty/` là trang danh sách liệt kê **mọi Organization đã duyệt**, thay vì 404 như hiện nay.

## 2. Phép đo hiện trạng

> **Đo ngày 2026-08-31.** Mã trạng thái lấy bằng `curl -o /dev/null -w '%{http_code}'`;
> số lượng document lấy bằng GROQ trên dataset `production` (project `pgedy374`).

| Đường dẫn | Mã |
|---|---|
| `/cong-ty/` | **404** |
| `/cong-ty/cong-ty-tnhh-tour-dao/` | **200** |
| `/tac-gia/` | 404 (ngoài phạm vi spec này) |

Trang chi tiết sống, trang danh sách chưa tồn tại.

**Dữ liệu:** `count(*[_type=="organization"])` = **5**, trong đó **3 đã publish và
`reviewStatus == "approved"`**: Công ty TNHH Tour Đảo (`travelAgency`), Công Ty Cổ Phần Vinpearl
(`organization`), Công Ty Cổ Phần Hòn Tằm Biển Nha Trang (`organization`). Cả ba có `mainImage`,
`summary.vi`, `logo`. **Cả ba chỉ có `title.vi` / `slug.vi`** — không có bản dịch nào.

## 3. Vì sao thay đổi này nhỏ

Hạ tầng đã dựng sẵn gần như toàn bộ; thứ duy nhất chặn là một cờ:

| Mảnh | Trạng thái |
|---|---|
| Địa chỉ URL 5 ngôn ngữ | **có** — `routes.ts:75`, segment `cong-ty` / `companies` / `公司` / `회사` / `компании` |
| Công tắc entity | **bật** — `site.config.ts:212` `organization: true` |
| Truy vấn danh sách | **có, nhưng thiếu một field** — `allOrganizationsQuery`, xem §4.2 |
| Đăng ký truy vấn cho trang index | **có** — `INDEX_QUERY.organization` trong `RouteDispatch` |
| Tiêu đề + mô tả trang index | **có, đủ 5 ngôn ngữ** — `INDEX_COPY.*.organization` |
| Component render | **có** — `EntityIndex` (nhánh mặc định, không phải `event`/`tour`) |
| **Cờ `hasIndex`** | **`false`** ← đây là toàn bộ thứ chặn |

Đặt `hasIndex: true` thì `[...path].astro` `getStaticPaths` tự sinh trang, sitemap tự nhận, và
`autoRouteLinks()` tự thêm lối vào chân trang. Không nơi nào phải khai tay — `autoRouteLinks` và
`getStaticPaths` cùng lọc một `ROUTE_MAP` theo cùng điều kiện nên không lệch được.

## 4. Thiết kế

### 4.1 Sửa spec TRƯỚC, mã sau

`CLAUDE.md` §2: spec là nguồn sự thật, code là dẫn xuất. Nên
**`docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` §1.3 sửa trước**, trong cùng commit:

Dòng 96 hiện là:

```
| `/cong-ty/{slug}` | hồ sơ đơn vị vận hành | Organization | url đích cho provider và organizer; I18 chặn org mồ côi |
```

Thêm một dòng **ngay trên nó**, theo đúng khuôn các nhánh khác trong bảng:

```
| `/cong-ty/` | index nhánh | Organization | CollectionPage |
```

### 4.2 `allOrganizationsQuery` thiếu `summary` — thẻ sẽ ra rỗng nếu không sửa

**Dữ liệu có, truy vấn không lấy.** Cả 3 organization đều có `summary.vi` (§2), nhưng
`allOrganizationsQuery` (`src/lib/queries/organization.ts:39`) chỉ chọn:

```
_id, _type, "title": title.{lang}, "slug": slug.{lang}.current, mainImage…, orgType
```

Dây chuyền hệ quả, đã truy hết:

1. `toListing()` (`RouteDispatch.astro:81`) đặt `summary: textOrEmpty(e.summary)` → `e.summary`
   là `undefined` → **`''`**.
2. `EntityIndex.astro:163` truyền `summary={entity.summary}` xuống `Card`.
3. `Card.astro:48` render `<p class="card-summary">{summary}</p>` **không kiểm rỗng** → mỗi thẻ
   đẻ ra một `<p>` **rỗng**.

Đó là một vùng rỗng được dựng khung — đúng thứ **R7** ("vùng rỗng ẩn hẳn") cấm.

**Sửa:** thêm một dòng vào `allOrganizationsQuery`:

```groq
"summary": summary.${lang},
```

Đây là một dòng, dữ liệu đã có sẵn, và nằm đúng trong phạm vi "mở trang danh sách cho
Organization".

#### ⚠ KHÔNG phải ca lẻ — và khuyết tật này ĐANG SỐNG trên production

> **Bản nháp đầu của spec này viết:** *"`allToursQuery` và các truy vấn danh sách khác đều lấy
> `summary` — đây là chỗ thiếu, không phải chỗ cố ý bỏ."* **Sai, và sai theo hướng nguy hiểm:**
> nó khiến người đọc tưởng đây là chuyện của tương lai.

Đo trên production ngày 2026-08-31:

| Trang | Thẻ `card-summary` | Có chữ |
|---|---|---|
| `/tour/` | 28 | 28 |
| `/dia-danh/` | 5 | 5 |
| **`/khach-san/`** | **10** | **0 — rỗng toàn bộ** |

Gốc: `allHotelsQuery` (`src/lib/queries/hotel.ts:55`) và `allResortsQuery`
(`src/lib/queries/resort.ts:58`) **cũng không lấy `summary`**. Nên `/khach-san/` hôm nay đang
render **mười** `<p class="card-summary">` rỗng trên một URL công khai. Đây là R7 **đang chạy**,
không phải rủi ro dự phòng.

Việc mở `/cong-ty/` không gây ra chuyện này; nó chỉ **thêm** một trang nữa vào cùng khuyết tật
nếu không sửa.

**✅ Chủ dự án chốt 2026-08-31: sửa CẢ BA truy vấn một lượt.** Thêm `"summary": summary.${lang},`
vào:

| Truy vấn | File | Trang được chữa |
|---|---|---|
| `allOrganizationsQuery` | `src/lib/queries/organization.ts:39` | `/cong-ty/` (sắp mở) |
| `allHotelsQuery` | `src/lib/queries/hotel.ts:55` | `/khach-san/` — **10 thẻ rỗng đang sống** |
| `allResortsQuery` | `src/lib/queries/resort.ts:58` | `/resort/` |

Ba dòng GROQ. Phạm vi nở nhẹ so với "một cờ", nhưng là **cùng một sửa chữa** cho **cùng một
khuyết tật**, và hai trang kia đang hỏng thật trên production — tách ra thành phiếu riêng chỉ để
giữ phạm vi cho đẹp là để lỗi sống thêm.

#### ⚠ Bẫy khi nghiệm thu: grep phẳng sẽ in xanh cho trang rỗng

Astro chèn `data-astro-cid-*` vào thẻ, nên `grep '<p class="card-summary"></p>'` trả **0** kể cả
khi mọi thẻ đều rỗng. Phải bóc bằng biểu thức có chỗ cho thuộc tính:

```bash
# grep KHONG dung duoc o day: no lam viec theo DONG, ma 2/3 tom tat cua Organization
# co xuong dong that trong du lieu Sanity => `<p>` trai qua nhieu dong va grep bo sot.
# Do thuc te 2026-08-31 tren dist/cong-ty/index.html: grep ra 1, su that la 3.
perl -0777 -ne 'print scalar(() = /<p class="card-summary"[^>]*>\s*\S.*?<\/p>/gs), "\n"' <file>
# doi chieu voi tong so the:
grep -o '<p class="card-summary"' <file> | wc -l
```

So số đó với tổng số thẻ. Đây đúng dạng lỗi mà tiêu chí 1b sinh ra để bắt — viết sai lệnh kiểm
thì tiêu chí tự vô hiệu.

**Ngoài phạm vi, ghi lại chứ không làm:** `getBadge()` trong `EntityIndex.astro:70` không có
nhánh `organization`, nên rơi về `default: return null` — thẻ công ty không có huy hiệu loại.
Truy vấn đã lấy `orgType` và `uiCopy.ts:1050–1054` đã có nhãn đủ 5 ngôn ngữ
(`travelAgency` / `transportCompany` / `diveOperator` / `dmc` / `organization`), nên thêm nhánh
là việc nhỏ — **nhưng là bề mặt mới, cần chủ dự án quyết riêng.** Không gộp lặng lẽ vào đợt này.

### 4.3 `src/lib/routes.ts` dòng 75

`hasIndex: false` → `hasIndex: true`. Không đổi gì khác trên dòng đó.

### 4.4 `src/lib/routes.ts` chú thích quanh dòng 241 — **bắt buộc, cùng commit**

Khối chú thích của `autoRouteLinks()` đang ghi:

> `person` và `organization` không lên vì khai `hasIndex: false` — không có trang danh sách để
> trỏ tới.

Câu này **thành sai** ngay khi §4.3 xong. Sửa thành chỉ còn `person`. Bỏ qua là để lại một tài
liệu nói dối ngay cạnh dòng mã nó mô tả — đúng loại lệch `doc-reality-auditor` sinh ra để bắt.

### 4.5 Không chạm menu chính

Chân trang **tự sinh** từ `autoRouteLinks()`, không phải khai. Menu chính (`nav` trong
`site.config.ts`) là **quyết định biên tập**, để nguyên trong đợt này.

Lý do kỹ thuật, không chỉ là ý thích: `assertNavTargetsExist` đối chiếu mọi mục menu với danh
sách trang mà **lần build này** thực sự sinh ra. Khai mục menu trỏ tới trang chưa tồn tại là
**build dừng ngay trên máy**. Thứ tự an toàn là mở trang trước, thêm menu sau nếu chủ dự án muốn.

## 5. Cảnh báo cho người bật ngôn ngữ thứ hai — **không** thiết kế vòng quanh nó ở đợt này

`langs = ['vi']` (`site.config.ts:175`), nên hiện chỉ có cây tiếng Việt được dựng. Chuyện dưới
đây **chưa xảy ra**, ghi lại để người bật ngôn ngữ sau không sập vào:

`allOrganizationsQuery(lang)` lấy `"title": title.{lang}` **không có `coalesce` dự phòng**.
`toListing()` trong `RouteDispatch` **loại** mọi mục thiếu `title` hoặc `slug`. Cả 3 organization
chỉ có `title.vi`. Nên bật thêm một ngôn ngữ mà chưa dịch Organization là
**`/en/companies/` sinh ra trang rỗng và vào thẳng sitemap** — đúng loại "URL ma" mà chú thích
`TERM_SET_ENTITY` trong `routes.ts` đã ghi là từng bị R4 bắt 11 cái.

Ai bật ngôn ngữ thứ hai thì phải quyết một trong hai **trước khi bật**: dịch Organization, hoặc
cho `hasIndex` biết ngôn ngữ. Không phải việc của spec này.

### 4.6 Lỗi breadcrumb 404 mà spec này vô tình chữa — nêu ra để nghiệm thu bắt được

`Breadcrumb.astro:43–52` đẩy crumb nhánh với `href` `/cong-ty/` **mà không hề kiểm `hasIndex`** —
chỉ `if (branchLabel)`. Đo trên production 2026-08-31:

```
curl https://tourdao.vn/cong-ty/cong-ty-tnhh-tour-dao/
  → href="/cong-ty/"                              ← liên kết tới trang 404
  → JSON-LD BreadcrumbList: "tourdao.vn/cong-ty/"  ← URL 404 trong structured data
```

Nghĩa là **mọi trang chi tiết công ty đang trỏ breadcrumb vào 404 và đẩy URL đó cho Google**.
Mở `/cong-ty/` chữa cả hai cùng lúc. Đây là lập luận mạnh hơn hẳn cho §6.

**`/tac-gia/` dính y hệt** (`person` cũng `hasIndex: false`, `/tac-gia/` = 404). **Không gộp vào
đợt này** — gộp là nở phạm vi giữa lúc thi hành. Ghi một dòng `docs/BACKLOG.md` để nó không nằm
im thêm lần nữa.

## 6. Điều chủ dự án cần biết trước khi thi hành

**Trang danh sách sẽ có đúng 3 mục.** Không sai, và ba mục đó đều có ảnh, tóm tắt, logo nên thẻ
không rỗng. Nhưng đây là một URL công khai vào sitemap với nội dung mỏng. Nếu chủ dự án muốn đợi
tới khi có nhiều đơn vị hơn thì mảnh này hoãn được mà không ảnh hưởng hai mảnh kia.

## 7. Nghiệm thu

1. `/cong-ty/` trả **200** và liệt kê **đúng 3** organization đã duyệt, mỗi thẻ có tiêu đề, ảnh,
   tóm tắt, và liên kết trỏ đúng `/cong-ty/{slug}/`.
   **1b. Đo riêng `<p class="card-summary">` trên CẢ BA trang** — `/cong-ty/`, `/khach-san/`,
   `/resort/`: số thẻ **có chữ** phải bằng tổng số thẻ. Dùng đúng lệnh ở §4.2 (có `[^>]*`), không
   dùng grep phẳng. Đường nền để so: `/khach-san/` hôm nay **10 thẻ / 0 có chữ**.
   Không đo mục này thì §4.2 lọt, vì trang vẫn trả 200 và vẫn đủ thẻ khi tóm tắt rỗng — đúng kiểu
   tiêu chí hỏi "có xuất hiện không" mà không hỏi "có nội dung không".
2. `/cong-ty/cong-ty-tnhh-tour-dao/` vẫn **200** — trang chi tiết không hồi quy.
3. `/cong-ty/` có mặt trong `sitemap-vi.xml`.
   **3b.** Liên kết breadcrumb trên trang chi tiết công ty trả **200** (nay 404), và `item` của
   crumb nhánh trong JSON-LD `BreadcrumbList` không còn trỏ 404 — xem §4.6.
4. Chân trang có lối vào "Công ty" trỏ `/cong-ty/`; **menu chính không đổi**.
5. `git diff` cho thấy chú thích `routes.ts` quanh dòng 241 đã sửa và `05-URL_MAP` §1.3 đã thêm
   dòng — hai thứ này nằm **cùng commit** với việc lật cờ.
6. `npm run build` **trước**, rồi `npm run gate` (DR-105). So **từng dòng**, không đếm tổng đỏ.
7. **Không** trích dòng `[pass]` của cổng **G1** làm bằng chứng cho mảnh này: G1 đối chiếu với
   một bảng chép cứng trong mã chứ không đọc `01-CONTENT_MODEL`, nên nó in `[pass]` cho cả phép
   kiểm nó không hề thực hiện.
