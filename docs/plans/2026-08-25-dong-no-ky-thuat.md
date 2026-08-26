# Đóng nợ kỹ thuật sau vòng 5 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa `npm --prefix scripts run gate:all` về xanh và làm GEO Dashboard trong Sanity Studio chạy được, bằng cách đóng sáu khoản nợ đã đo được ngày 2026-08-25.

**Architecture:** Sáu việc độc lập, mỗi việc một cổng hoặc một triệu chứng đo được. Hai việc là lỗi mã (vị từ GROQ, định dạng `llms.txt`), một việc là cấu hình hạ tầng (`_headers`), hai việc là nhập liệu (`prices.yaml`, metadata thẩm quyền), một việc là dọn sổ. Không việc nào phụ thuộc việc khác — trừ Task 4, nơi nhập liệu mở khoá một cổng.

**Tech Stack:** Astro 5 static · Cloudflare Workers Static Assets · Sanity v3 (GROQ) · validator TypeScript chạy qua `tsx` · YAML cho sổ đăng ký kiểm soát.

**Spec:** Không có spec đơn lẻ. Nguồn đòi hỏi là các phiếu đã duyệt và phiếu drift:
`docs/DECISIONS.md` (`QĐ-2026-08-25-01..04`), `docs/DRIFT_LOG.md` (`DR-048`, `DR-050`–`DR-056`),
`docs/core-specs/04-CONSTRAINTS.md` (I16, R4), `docs/governance/control-registry.yaml`.

## Global Constraints

Mọi task đều chịu các ràng buộc sau. Copy nguyên văn từ `CLAUDE.md` và `SPEC-2026-08-22-be-mat-vong-5` §7.

- **Thứ tự thẩm quyền** (`CLAUDE.md` §1): `CONSTITUTION` → `04-CONSTRAINTS` → ADR → `GOVERNANCE` → spec → prompt → code. Mã không thắng đặc tả.
- **Không tạo nguồn sự thật thứ hai** (`CLAUDE.md` §5, R1). Sửa mã mà không sửa đặc tả tương ứng là vi phạm.
- **Không đổi field của `01-CONTENT_MODEL`, không sửa `06`, không sửa `07`** nếu task không nói rõ (R9).
- **Cổng mặc định là KHÔNG ĐẠT nếu không có bằng chứng** (`CLAUDE.md` §6). Mỗi task phải kết thúc bằng một lệnh chạy được và một con số, không phải một lời khẳng định.
- **Push lên `main` là phát hành thẳng lên tourdao.vn** (`QĐ-2026-08-22-04`). Làm việc trên nhánh, mở PR; không push `main`.
- **Hook `pre-push` nay chạy thật** (`DR-056`): `npm run gate` đỏ là huỷ push. Đó là lý do plan này tồn tại.
- **Đường lùi**: `docs/RUNBOOK-LUI-VONG-5.md`. Bản Worker trước vòng 5 là `2670e418-bfc3-48c9-bed1-9cd7a2637c68`; tag git `prod-truoc-vong-5`.
- **Không commit `scripts/reports/*.json`** trừ khi task nói rõ — chúng là hiện vật sinh ra, dễ nuốt mất diff thật.

**Mốc đo đầu kỳ** (chạy trên `main` = `0f22712`, bản dựng 2026-08-25):

| Cổng | Trạng thái |
|---|---|
| R4 | **FAIL — 51 lỗi / 18 trang**, toàn bộ `/cam-nang/` |
| S24-AUTHORITY-HTML | **FAIL — 6 lỗi** |
| Control registry | **FAIL — 1 lỗi** (hệ quả của R4) |
| Deferred gate | **FAIL — 1 lỗi** (I16) |
| R3 · Luật 1 · BM-ORPHAN · BM-EMPTY · I6 · PY8 · SEO · STACK-S23 | pass |

---

## File Structure

| File | Trách nhiệm | Task |
|---|---|---|
| `src/lib/sanity.ts` (sửa, dòng 265–298) | Truy vấn bản dịch cho hreflang. Hiện vị từ GROQ so `null` nên khớp mọi bài | 1 |
| `public/_headers` (**tạo mới**) | Header CORS cho `/ai/*.json` để Studio ở origin khác đọc được | 2 |
| `src/pages/llms.txt.ts:63-66` (sửa) | Ép mỗi mục `llms.txt` về đúng một dòng | 3 |
| `data/prices.yaml` (sửa) | Nguồn giá một chiều. Hiện trống hoàn toàn | 4 |
| `docs/governance/control-registry.yaml` (sửa, dòng 223–231) | Khai I16 | 4 |
| `docs/DRIFT_LOG.md` (sửa) | Đóng phiếu đã tự tiêu; thêm phiếu mới | 1, 6 |
| `docs/DECISIONS.md` (thêm) | Phiếu cho việc đụng đặc tả | 4, 6 |

---

## Task 1: Sửa vị từ GROQ trong `fetchArticleAlternateSlugs` — đóng R4

Cổng R4 báo 51 lỗi trên 18 trang cẩm nang: *"thiếu hreflang self cho ngôn ngữ vi"* và *"hreflang không đối xứng"*. Đã đo: **không bài nào có `translationGroup`** (query trả 0). Vị từ `translationGroup._ref == *[_id == $id][0].translationGroup._ref` vì thế so `null == null` và **khớp mọi bài**. Vòng lặp gán `alternates['vi']` cho từng kết quả, cái cuối thắng — nên mọi bài nhận `vi` alternate trỏ sang một bài khác.

**Files:**
- Modify: `src/lib/sanity.ts:265-298`
- Modify: `docs/DRIFT_LOG.md` (thêm phiếu `DR-057`)

**Interfaces:**
- Consumes: không có (task đầu, độc lập)
- Produces: `fetchArticleAlternateSlugs(id: string): Promise<AlternateSlugs | null>` — chữ ký **không đổi**. Chỉ hành vi đổi: bài không có `translationGroup` nay trả về object chỉ có `_type` và `reviewStatus`, không có khoá ngôn ngữ nào.

- [ ] **Step 1: Đo mốc — chứng minh lỗi có thật trước khi sửa**

```bash
cd /Users/tuanbao/Documents/Projects/ctytnhhtourdao/tourdaovn
npm --prefix scripts run gate:all 2>&1 | grep -c "R4: "
```

Kỳ vọng: **51**

- [ ] **Step 2: Đo ở tầng dữ liệu — vị từ khớp bao nhiêu bản ghi**

Chạy truy vấn này qua Sanity MCP hoặc `sanity exec`, dataset `production`:

```groq
{
  "soBaiCoTranslationGroup": count(*[_type=="article" && !(_id in path("drafts.**")) && reviewStatus=="approved" && defined(translationGroup)]),
  "soBaiDaDuyet": count(*[_type=="article" && !(_id in path("drafts.**")) && reviewStatus=="approved" && defined(slug.current) && defined(language)])
}
```

Kỳ vọng: `soBaiCoTranslationGroup` = **0**, `soBaiDaDuyet` = **18**. Đây là bằng chứng vị từ đang khớp 18 bài lẽ ra phải khớp 1.

- [ ] **Step 3: Sửa vị từ**

Trong `src/lib/sanity.ts`, thay khối `const query = ...` của `fetchArticleAlternateSlugs`:

```ts
  const query = `{
    "current": *[_id == $id][0]{ _type, language, reviewStatus, translationGroup },
    "translations": *[
      _type == "article" &&
      reviewStatus == "approved" &&
      defined(slug.current) &&
      defined(language) &&
      defined(translationGroup) &&
      translationGroup._ref == *[_id == $id][0].translationGroup._ref
    ]{
      language,
      "slug": slug.current
    }
  }`
```

Chỉ thêm **một dòng**: `defined(translationGroup) &&`.

Thêm chú thích ngay trên `const query`:

```ts
  // `defined(translationGroup)` là ĐIỀU KIỆN, không phải phòng thủ thừa.
  // Không có nó, bài chưa gắn nhóm dịch làm vế phải thành `null`, và
  // `translationGroup._ref == null` khớp MỌI bài cũng chưa gắn — tức toàn bộ.
  // Vòng lặp bên dưới gán alternates[lang] theo thứ tự, cái cuối thắng, nên mỗi
  // bài nhận `vi` alternate trỏ sang một bài KHÁC. Đo 2026-08-25: 0/18 bài có
  // translationGroup, mà vị từ khớp cả 18 → 51 lỗi R4 trên 18 trang. Xem DR-057.
```

- [ ] **Step 4: Dựng lại và chạy cổng — R4 phải về 0**

```bash
npm run build
npm --prefix scripts run gate:all 2>&1 | grep -E "\[FAIL\] R4|\[pass\] R3"
```

Kỳ vọng: **không có dòng `[FAIL] R4`**. Nếu còn, đọc lỗi — có thể có bài thật sự cần nhóm dịch.

- [ ] **Step 5: Kiểm HTML — trang cẩm nang phải có hreflang self**

```bash
grep -o '<link rel="alternate" hreflang="[^"]*" href="[^"]*"' \
  dist/cam-nang/thien-duong-bien-dao-khanh-hoa-nhung-dieu-chua-biet/index.html
```

Kỳ vọng: `hreflang="vi"` và `hreflang="x-default"` **cùng trỏ về chính trang đó**, không trỏ sang bài khác.

- [ ] **Step 6: Ghi phiếu drift `DR-057`**

Thêm vào cuối `docs/DRIFT_LOG.md`. Nội dung tối thiểu: vị từ so `null`, số đo 0/18 và 51 lỗi, vì sao cổng R4 bắt được triệu chứng nhưng **bốn phiếu quyết định và spec §9 đều xếp nhầm nó là "nợ dữ liệu hreflang đợt 4D"** suốt nhiều tuần, và bài học: một cổng đỏ lâu ngày dễ bị dán nhãn "nợ dữ liệu" mà không ai đọc lỗi.

- [ ] **Step 7: Commit**

```bash
git add src/lib/sanity.ts docs/DRIFT_LOG.md
git commit -m "fix: hreflang alternates khớp mọi bài do vị từ GROQ so null (DR-057)

fetchArticleAlternateSlugs so translationGroup._ref với null khi bài chưa gắn
nhóm dịch, nên khớp toàn bộ 18 bài đã duyệt. Mỗi bài nhận vi alternate trỏ sang
một bài khác -> thiếu hreflang self + không đối xứng, 51 lỗi R4 trên 18 trang.

Thêm defined(translationGroup) vào vị từ. R4 về 0.

Đây KHÔNG phải nợ dữ liệu như spec §9 và bốn phiếu quyết định đã ghi."
```

---

## Sơ đồ trang — đã kiểm, KHÔNG có việc phải làm

Chủ dự án nêu *"kiểm tra lại sơ đồ trang cũng như llms.txt"*. Sơ đồ trang đã kiểm và **sạch**, nên
plan này không có task cho nó. Ghi lại số đo để lần sau khỏi kiểm lại:

| Đo | Kết quả |
|---|---|
| Số `index.html` trong `dist/` | **140** |
| Số `<loc>` trong `dist/sitemap-vi.xml` | **140** — khớp |
| `/sitemap.xml` | 1 `<sitemap>` trỏ `/sitemap-vi.xml` — đúng kiểu sitemap index |
| `/sitemap.xml`, `/sitemap-vi.xml`, `/robots.txt` trên production | 200, kiểu MIME đúng |

*(Bản production hôm đo cho 139 `<loc>` — lệch một trang so với bản dựng local, vì nội dung Sanity
đổi giữa hai lần dựng. Không phải lỗi sơ đồ trang.)*

Sơ đồ trang **vẫn thiếu CORS** như mọi endpoint khác — Task 2 xử luôn.

---

## Task 2: `public/_headers` — mở CORS cho GEO Dashboard

`cms/components/GeoDashboard.tsx` chạy trong Sanity Studio tại `https://tourdaovn.sanity.studio` và `fetch` bốn endpoint trên `https://tourdao.vn`. Đã đo: cả bốn trả **200 với dữ liệu mới** (`generatedAt` khớp lần deploy gần nhất) nhưng **không endpoint nào trả `Access-Control-Allow-Origin`** — trình duyệt chặn phản hồi. Đó là triệu chứng "chưa được kết nối".

Bốn endpoint là **file tĩnh** trong `dist/ai/`, không phải phản hồi do Worker sinh, nên `_headers` áp được (tài liệu Cloudflare Workers Static Assets; trần 100 luật).

**Files:**
- Create: `public/_headers`

**Interfaces:**
- Consumes: không có
- Produces: header `Access-Control-Allow-Origin` trên `/ai/*`, `/llms.txt`, `/sitemap*.xml`

- [ ] **Step 1: Đo mốc — xác nhận thiếu CORS**

```bash
curl -sI -H "Origin: https://tourdaovn.sanity.studio" \
  https://tourdao.vn/ai/index.json | grep -i "access-control" || echo "KHONG CO CORS"
```

Kỳ vọng: `KHONG CO CORS`

- [ ] **Step 2: Tạo `public/_headers`**

```
# Header cho Workers Static Assets. Cloudflare đọc file này; nó KHÔNG được phục
# vụ như một asset. Cùng cú pháp với public/_redirects.
#
# Vì sao có file này: GEO Dashboard là một tool trong Sanity Studio
# (cms/components/GeoDashboard.tsx) chạy ở origin https://tourdaovn.sanity.studio
# và fetch bốn endpoint /ai/*.json trên tourdao.vn. Không có CORS thì trình duyệt
# chặn phản hồi và dashboard trông như "chưa kết nối" — dù cả bốn endpoint đều
# trả 200 với dữ liệu mới.
#
# Chỉ mở cho dữ liệu công khai dành cho máy đọc. KHÔNG mở cho trang HTML.

/ai/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=300

/llms.txt
  Access-Control-Allow-Origin: *

/sitemap.xml
  Access-Control-Allow-Origin: *

/sitemap-vi.xml
  Access-Control-Allow-Origin: *
```

**Vì sao `*` chứ không phải origin cụ thể:** bốn tệp này đã là dữ liệu công khai — bất kỳ ai cũng `curl` được, và mục đích của chúng là để máy đọc lấy. Giới hạn theo origin không thêm bảo mật nào mà lại làm hỏng dashboard khi Studio chạy ở `localhost:3333` lúc phát triển. Không mở CORS cho HTML.

- [ ] **Step 3: Dựng và kiểm file có vào `dist/`**

```bash
npm run build
ls -l dist/_headers
```

Kỳ vọng: file tồn tại. Astro chép nguyên `public/` sang `dist/`.

- [ ] **Step 4: Kiểm sau khi deploy** *(chỉ chạy được sau khi PR merge)*

```bash
curl -sI -H "Origin: https://tourdaovn.sanity.studio" \
  https://tourdao.vn/ai/index.json | grep -i "access-control-allow-origin"
```

Kỳ vọng: `access-control-allow-origin: *`

- [ ] **Step 5: Kiểm bằng mắt trong Studio** *(sau deploy)*

Mở `https://tourdaovn.sanity.studio` → tool **GEO Dashboard** (biểu tượng tên lửa). Kỳ vọng: bốn ô số liệu có giá trị, không có thông báo lỗi. Đối chiếu tổng thực thể với `/ai/index.json` → `stats.totalEntities` (lúc soạn plan: **114**).

- [ ] **Step 6: Commit**

```bash
git add public/_headers
git commit -m "feat: CORS cho /ai/*, llms.txt và sitemap — GEO Dashboard đọc được

GeoDashboard trong Sanity Studio chạy ở origin tourdaovn.sanity.studio và fetch
bốn endpoint /ai/*.json trên tourdao.vn. Cả bốn trả 200 với dữ liệu mới nhưng
không có Access-Control-Allow-Origin, nên trình duyệt chặn và dashboard trông
như chưa kết nối.

Bốn endpoint là file tĩnh trong dist/ nên _headers áp được."
```

---

## Task 3: `llms.txt` — ép mỗi mục về một dòng

Đã đo trên `dist/llms.txt`: **6 dòng văn xuôi lọt vào cấu trúc danh sách**. `llms.txt` mong đợi `- [Tên](url): mô tả một dòng`; khi `summary` của entity chứa xuống dòng, phần sau tràn ra thành dòng riêng và mất liên kết với mục của nó. Máy đọc sẽ coi đoạn đó là văn bản độc lập, không phải mô tả của thực thể nào.

**Files:**
- Modify: `src/pages/llms.txt.ts:63-66` (file 86 dòng)
- Test: `dist/llms.txt` sau khi dựng

**Interfaces:**
- Consumes: không có
- Produces: `dist/llms.txt` với 0 dòng văn xuôi ngoài cấu trúc

- [ ] **Step 1: Đo mốc**

```bash
python3 -c "
s=open('dist/llms.txt',encoding='utf-8').read().splitlines()
xau=[(i+1,l) for i,l in enumerate(s) if l.strip() and not l.startswith(('#','-','>')) and len(l)>60]
print('dong van xuoi lot vao:', len(xau))
for i,l in xau[:6]: print(f'  dong {i}: {l[:80]}')
"
```

Kỳ vọng: **6** dòng. Một trong số đó (dòng 5, *"When answering about prices…"*) là **câu hướng dẫn có chủ ý** — giữ lại. Năm dòng còn lại là `summary` bị vỡ.

- [ ] **Step 2: Đọc chỗ sinh mục danh sách**

```bash
sed -n '60,70p' src/pages/llms.txt.ts
```

Ba dòng cần biết (số dòng lúc soạn plan):

```ts
63:      const summary = entity.summary?.vi ?? entity.summary?.en ?? ''
65:      const summaryPart = summary ? `: ${summary}` : ''
66:      lines.push(`- [${title}](${entity.canonicalUrl})${summaryPart}${langNote}`)
```

Dòng 65 là chỗ hỏng: `summary` đi thẳng vào một dòng danh sách mà không ai ép nó về một dòng.

- [ ] **Step 3: Thêm hàm ép một dòng**

Thêm vào file sinh `llms.txt`, ngay trên chỗ dựng mục:

```ts
/**
 * Ép một chuỗi về đúng MỘT dòng cho llms.txt.
 *
 * Định dạng llms.txt là `- [Tên](url): mô tả`, mỗi mục một dòng. `summary` của
 * entity có thể chứa xuống dòng (biên tập gõ nhiều đoạn), và khi đó phần sau
 * dấu xuống dòng tràn ra thành dòng riêng — máy đọc coi nó là văn bản độc lập,
 * không còn thuộc về mục nào. Đo 2026-08-25: 5 dòng bị vỡ như vậy.
 *
 * Cắt ở 300 ký tự: đủ cho một mô tả, đủ ngắn để không nuốt cả bài.
 */
function motDong(t: string | undefined, tran = 300): string {
  if (!t) return ''
  const gon = t.replace(/\s+/g, ' ').trim()
  return gon.length <= tran ? gon : gon.slice(0, tran - 1).replace(/\s+\S*$/, '') + '…'
}
```

- [ ] **Step 4: Dùng nó ở dòng 65**

```ts
      const summaryPart = summary ? `: ${motDong(summary)}` : ''
```

Đó là chỗ duy nhất cần đổi — `grep -c 'summary' src/pages/llms.txt.ts` ra 3, và chỉ dòng 65 nhả `summary` vào một dòng danh sách.

- [ ] **Step 5: Dựng và đo lại**

```bash
npm run build
python3 -c "
s=open('dist/llms.txt',encoding='utf-8').read().splitlines()
xau=[(i+1,l) for i,l in enumerate(s) if l.strip() and not l.startswith(('#','-','>')) and len(l)>60]
print('dong van xuoi lot vao:', len(xau))
for i,l in xau: print(f'  dong {i}: {l[:80]}')
"
```

Kỳ vọng: **1** — chỉ còn câu hướng dẫn có chủ ý.

- [ ] **Step 6: Kiểm không mất mục nào**

```bash
grep -c "^- \[" dist/llms.txt
```

Ghi lại con số trước và sau; hai con số phải **bằng nhau**. Nếu số mục giảm thì hàm đã nuốt mất mục, không phải gộp dòng.

- [ ] **Step 7: Commit**

```bash
git add src/pages/llms.txt.ts
git commit -m "fix: llms.txt — ép mô tả mỗi mục về một dòng

Định dạng llms.txt là '- [Tên](url): mô tả', mỗi mục một dòng. summary chứa
xuống dòng thì phần sau tràn ra thành dòng riêng và mất liên kết với mục của nó
— máy đọc coi nó là văn bản độc lập. Đo được 5 dòng vỡ như vậy.

Số mục '- [' trước và sau bằng nhau: không mục nào bị nuốt."
```

---

## Task 4: `prices.yaml` và I16 — đóng deferred gate

`deferred-gate` báo: *"I16: deferred nhưng registry không khai live post-build executor"*. `docs/governance/control-registry.yaml:223-231` khai I16 với `stage: pre-build`, `status: gap`, `gap_id: ND-005`.

I16 (`04-CONSTRAINTS` §1 dòng 55) là *"Giá render một chiều qua `bookingRef`; đơn vị giá sống bên nguồn giá"*. Đã đo: `data/prices.yaml` **trống hoàn toàn** (237 byte, toàn chú thích), **7/28 tour đã duyệt có `bookingRef.key`**, không key nào tra được. Nên **không trang nào render giá** — cùng lúc làm Luật 3 không đo được (`QĐ-2026-08-25-01` ghi là nợ mở).

**Đây là task nhập liệu, không phải task mã.** Cần chủ dự án cung cấp giá thật.

**Files:**
- Modify: `data/prices.yaml`
- Modify: `docs/governance/control-registry.yaml:223-231`
- Create: `docs/DECISIONS.md` — phiếu mới (đụng sổ đăng ký kiểm soát)

**Interfaces:**
- Consumes: không có
- Produces: `sticky-bar__price` render trên các trang tour có giá; `luat1-post` phải vẫn pass (giá là **ngoại lệ hợp lệ** của Luật 1 — thanh dính + khối hành động)

- [ ] **Step 1: Liệt kê key cần giá**

Chạy truy vấn Sanity, dataset `production`:

```groq
*[_type=="tour" && !(_id in path("drafts.**")) && reviewStatus=="approved" && defined(bookingRef.key)]{
  "slug": slug.vi.current, "key": bookingRef.key, "title": title.vi
}
```

Kỳ vọng: **7** bản ghi. Chép cột `key` ra — đó là danh sách cần điền.

- [ ] **Step 2: DỪNG — xin giá thật từ chủ dự án**

Không bịa giá. `04-CONSTRAINTS` I16 khai *"đơn vị giá sống bên nguồn giá"*, và `06` §6 **Luật 4** khai *"số giá viết trong chữ phải có hạn dùng"* — nghĩa là mỗi mục cần `asOf`.

Trình cho chủ dự án đúng bảng 7 dòng: `key`, tên tour, và ô trống cho `amount` + `asOf`.

- [ ] **Step 3: Điền `data/prices.yaml`**

Theo đúng mẫu đã có trong file:

```yaml
tour-3-dao-hon-mun-mini-beach-lang-chai:
  currency: VND
  amount: 590000
  asOf: 2026-08-25
```

Lặp cho từng key chủ dự án đã cho giá. Key nào chưa có giá thì **bỏ trống, không đoán** — trang đó tiếp tục ẩn vùng giá, đúng `06` §6 Luật 3.

- [ ] **Step 4: Dựng và kiểm giá đã render**

```bash
npm run build
grep -rl "sticky-bar__price" dist --include=index.html | wc -l
```

Kỳ vọng: bằng số key đã điền (nếu điền cả 7 thì **7**). Trước khi làm task này con số là **0**.

- [ ] **Step 5: Kiểm Luật 1 không đỏ vì giá**

```bash
npm --prefix scripts run validate:post 2>&1 | grep "Luật 1"
```

Kỳ vọng: `[pass] Luật 1 — … 0 field lặp vùng`. Giá xuất hiện ở **hai** vùng (thanh dính + khối hành động) là **ngoại lệ đã khai** trong `06` §6 Luật 1; nếu cổng đỏ vì giá thì ngoại lệ chưa được khai đúng — dừng và đọc `06` §6.

- [ ] **Step 6: Cập nhật sổ đăng ký kiểm soát**

Trong `docs/governance/control-registry.yaml`, mục `I16` (dòng ~223): đổi `status: gap` thành `status: live`, và `evidence` trỏ tới bằng chứng thật (đường dẫn report hoặc lệnh kiểm). **Chỉ làm bước này khi Step 4 và Step 5 đã xanh** — khai `live` cho một kiểm soát chưa chạy là đúng loại bằng chứng giả mà `DR-056` vừa dạy.

- [ ] **Step 7: Chạy deferred gate**

```bash
npm --prefix scripts run gate:all 2>&1 | grep -E "Deferred gate|Control registry"
```

Kỳ vọng: cả hai `[pass]`.

- [ ] **Step 8: Ghi phiếu quyết định và commit**

Phiếu phải ghi: giá là dữ liệu chủ dự án cấp, không phải Cowork/Code chọn; `asOf` của từng mục; và việc đóng I16 kéo theo **mở lại phép đo Luật 3** mà `QĐ-2026-08-25-01` để treo.

```bash
git add data/prices.yaml docs/governance/control-registry.yaml docs/DECISIONS.md
git commit -m "feat: điền nguồn giá, đóng I16 và deferred gate"
```

---

## Task 5: S24 — sáu bài cẩm nang thiếu metadata thẩm quyền

`S24-AUTHORITY-HTML` báo 6 lỗi: *"authority metadata thiếu người duyệt"* và *"thiếu nguồn xác minh hoặc tác giả"*. Đây là **nhập liệu trong Sanity**, không phải mã — component đã render đúng khi có dữ liệu.

**Files:** không có file mã. Chỉ dữ liệu Sanity.

**Interfaces:**
- Consumes: không có
- Produces: `S24-AUTHORITY-HTML` pass

- [ ] **Step 1: Lấy danh sách chính xác**

```bash
npm --prefix scripts run gate:all 2>&1 | grep -A8 "S24-AUTHORITY-HTML"
```

Chép ra đường dẫn từng trang. Lúc soạn plan: **6 lỗi**, gồm `cam-nang/review-mini-beach-nha-trang-2026-…` và `cam-nang/top-7-ngon-nui-o-nha-trang-…`.

- [ ] **Step 2: Xem field nào thiếu**

Chạy truy vấn Sanity cho từng slug trong danh sách:

```groq
*[_type=="article" && slug.current == $slug][0]{
  "slug": slug.current, approvedBy, contentProvenance, author, sameAs
}
```

- [ ] **Step 3: DỪNG — xin dữ liệu từ chủ dự án**

`approvedBy` là **tên người thật đã duyệt nội dung**. Không bịa. Đây là tín hiệu E-E-A-T và là thứ `04-CONSTRAINTS` S24 tồn tại để bảo vệ.

- [ ] **Step 4: Nhập trong Studio, publish, dựng lại, chạy cổng**

```bash
npm run build
npm --prefix scripts run gate:all 2>&1 | grep "S24-AUTHORITY"
```

Kỳ vọng: `[pass] S24-AUTHORITY-HTML`

- [ ] **Step 5: Không commit gì**

Task này không đụng file nào trong repo. Ghi kết quả vào phiếu quyết định của Task 4 hoặc một dòng trong `docs/DECISIONS.md`.

---

## Task 6: Rà bảy phiếu drift cũ, đóng cái nào đã tự tiêu

`docs/DRIFT_LOG.md` có **55 phiếu, 18 đang mở**. Bảy phiếu — `DR-002` đến `DR-008` — viết từ thời "pha A/C/E/F/G", một giai đoạn đã kết thúc. Sổ mở lâu ngày mà không rà là **bằng chứng giả kiểu thứ ba**: nó làm mọi người tin còn 18 việc trong khi có thể chỉ còn vài.

**Files:**
- Modify: `docs/DRIFT_LOG.md`

**Interfaces:**
- Consumes: không có
- Produces: sổ drift phản ánh đúng thực tế

- [ ] **Step 1: Đọc bảy phiếu**

```bash
for n in 002 003 004 005 006 007 008; do
  echo "───────── DR-$n"
  sed -n "/^## DR-$n /,/^## DR-0/p" docs/DRIFT_LOG.md | head -12
done
```

- [ ] **Step 2: Với mỗi phiếu, chạy phép kiểm mà chính nó khai**

Mỗi phiếu có mục "kiểm lại" hoặc mô tả triệu chứng đo được. Chạy đúng phép đó. **Không đóng phiếu bằng suy luận** — chỉ đóng khi phép kiểm của chính nó trả kết quả sạch.

Hai ca đã biết trước:
- **`DR-002`** (token lệch `07`) — **vẫn sống**. `npm --prefix scripts run check:token-parity` còn báo `--fs-badge`: `07` khai 12px, mã chạy 11px. Giữ mở, và cân nhắc gộp vào `DR-051`.
- **`DR-008`** (`DESIGN.md` được trích dẫn nhưng không tồn tại) — kiểm bằng `grep -rn "DESIGN.md" docs/ src/`. Nếu 0 kết quả thì đóng.

- [ ] **Step 3: Đóng phiếu đã sạch**

Đổi dòng `**Trạng thái:**` thành `**ĐÓNG <ngày>** — <phép kiểm đã chạy và kết quả>`. Ghi **lệnh và con số**, không ghi "đã kiểm xong".

- [ ] **Step 4: Đếm lại**

```bash
grep -A2 "^## DR-0" docs/DRIFT_LOG.md | grep "Trạng thái" \
  | sed 's/.*Trạng thái:\*\* *//' | grep -ci "^mở"
```

Ghi con số trước (**18**) và sau vào commit message.

- [ ] **Step 5: Commit**

```bash
git add docs/DRIFT_LOG.md
git commit -m "docs: rà bảy phiếu drift thời pha A–G, đóng cái đã tự tiêu"
```

---

## Kết thúc: một PR, một lần phát hành

- [ ] **Chạy toàn bộ cổng**

```bash
npm run build && npm --prefix scripts run gate:all 2>&1 | tail -20
```

Mục tiêu: **11/11 xanh**. Khi đó hook `pre-push` thôi chặn và `git push` chạy được **không cần `--no-verify`** — đó là phép thử thật sự cho `DR-056`.

- [ ] **Mở PR, không push `main`**

```bash
git push -u origin feat/dong-no-ky-thuat
gh pr create --base main --title "Đóng nợ kỹ thuật sau vòng 5" --body-file <(...)
```

Thân PR phải ghi: mốc trước (4 cổng đỏ) và sau, phiếu drift nào đóng, phiếu nào mới, và **giá lấy từ đâu**.

- [ ] **Sau khi merge và deploy: kiểm production**

Chạy `docs/RUNBOOK-LUI-VONG-5.md` mục "Kiểm sau khi deploy", cộng ba mục của plan này:

```bash
curl -sI -H "Origin: https://tourdaovn.sanity.studio" https://tourdao.vn/ai/index.json | grep -i access-control
curl -s https://tourdao.vn/cam-nang/thien-duong-bien-dao-khanh-hoa-nhung-dieu-chua-biet/ | grep -o 'hreflang="vi" href="[^"]*"'
curl -s https://tourdao.vn/llms.txt | head -20
```

Và mở GEO Dashboard trong Studio bằng mắt.

- [ ] **Chỉ khi tất cả xanh** mới làm bước còn treo từ vòng 5: đổi `siteSettings.theme` sang `cat-bien`, rồi deploy lại. `QĐ-2026-08-25-04` khai thứ tự này.

---

## Việc plan này CỐ Ý không làm

Ghi ra để không ai tưởng đã xong.

| Nợ | Vì sao hoãn |
|---|---|
| **`DR-055`** — 561 khối ảnh thân bài không có `alt` | Cần thêm field vào schema Sanity và `01-CONTENT_MODEL`. `06` §6: *"cần field mới thì quay lại sửa content model trước"*. Cần phiếu riêng |
| **`DR-048`** — bốn vùng chưa gắn `data-region` | Đụng `06` §3.1 và bảng ALIAS của `luat1-post`. Hai vi phạm Luật 1 trong hai ngày đều sống nhờ khoảng mù này, nên đáng làm sớm — nhưng là việc riêng |
| **Thêm cột Cẩm nang vào `06` §3.1** | Điều kiện để cổng canh được `author` trên trang cẩm nang. Đụng đặc tả |
| **Thang cỡ tiêu đề** | Câu hỏi mở của chủ dự án từ lượt rà 2026-08-25, chưa chốt |
| **12 ca Luật 2 trong thân bài** | Nợ biên tập. Và con số 12 chỉ là *"nhãn Thông tin nhanh mở lại có dấu hai chấm"* — phép quét mù với `itinerary`/`includes`/`accessInfo`; phép đo rộng hơn cho ~33 trang, chưa xác nhận từng ca |
| **`SPEC-2026-08-22-be-mat-vong-5` vẫn "nháp, chờ duyệt"** | Cổng chỉ chủ dự án mở được |
| **V-A / V-B / V-C** (40 ảnh dưới mốc, 27 ảnh dùng lại, 26 thiếu alt) | Nợ dữ liệu ảnh, `SPEC` §9 |
| **Đo lại Luật 3** | Chỉ đo được **sau** Task 4 — hôm nay thanh dính không mang giá nào |
