# CoreSchema — lõi dựng site du lịch (tài liệu quản trị + code engine)

Lõi dùng chung để dựng site mới trên stack Sanity + Astro + Cloudflare Pages. Trích từ nhatrangtravel, giữ phần cốt lõi, bỏ mọi nội dung và entity riêng. Copy một lần, dùng cho nhiều site.

## Lõi gồm hai lớp

Lõi là **cả tài liệu quản trị lẫn code engine**, tách bạch rõ:

```
CoreSchema
├── playbook/   LỚP LUẬT — khuôn quản trị dùng chung (CHỈ ĐỌC, bản pin)
│               Hiến pháp, GOVERNANCE, PLAYBOOK 9 bước, governance/, 10 template
└── (còn lại)   LỚP ENGINE — code Astro+Sanity, cổng build:ci, layout, Studio khung
```

- **`playbook/`** là nguồn luật canonical: nguyên tắc bất biến, quy trình, cổng, template
  đặc tả (BINDING_MAP, CONTENT_MODEL, DESIGN_TOKENS, QA_CHECKLIST, OVERLAY...). Đây là bản
  **pin chỉ-đọc** đồng bộ từ playbook gốc; không sửa tay trong Core (tránh hai nguồn sự
  thật — N7). Xem `playbook/README.md` và `playbook/.PINNED_VERSION`.
- **Lớp engine** là hiện thực code tuân theo luật trong `playbook/`. Các ADR cụ thể của
  engine ở `docs/adr/`; runbook deploy ở `SETUP-NEW-SITE.md`.
- **`docs/core-specs/`** — 11 đặc tả **đã điền, đã nghiên cứu kỹ** lấy từ nhatrangtravel
  (SAD, CONSTRAINTS, CONTENT_MODEL, BINDING_MAP, URL_MAP, i18n, DESIGN_TOKENS,
  DESIGN_PATTERNS, QA_CHECKLIST, SCHEMA_PLAN, PROJECT_BRIEF). Khác với `playbook/templates/`
  (rỗng), đây là mẫu có nội dung thật, đã đánh dấu `🔧 SITE-SPECIFIC` tại chỗ riêng site.
  Xem `docs/core-specs/README.md`.

Khi luật (playbook) và code mâu thuẫn, luật thắng và code phải sửa (CONSTITUTION Điều 3).

## Mô hình hai tầng

Starter là engine, không mang entity nào. Mỗi site copy starter rồi tự thêm entity, query, route, schema của mình.

```
site-starter  (tầng chung: config, cổng, layout, Studio khung — TRỐNG entity)
   └── copy ──> tourdao        (thêm 5 entity: Hotel, Tour, Organization, Article, Author)
   └── copy ──> site khác      (entity riêng của site đó)
```

Bộ 5 entity của tourdao được giữ làm ví dụ tham chiếu ở `cms/examples/tourdao/` và
`scripts/examples/`, **không đăng ký ở lõi**. Xem `docs/adr/ADR-0003`.

## Có gì trong starter

- Cấu hình + hạ tầng deploy: `astro.config.mjs`, `package.json`, `wrangler.toml`, `.nvmrc`, `tsconfig.json`, `.gitignore`, `.env.example`, workflow advisory, git pre-push hook.
- Cổng `build:ci` với validator tối thiểu 3 kiểm ở `scripts/` (JSON-LD hợp lệ, reference không gãy, reviewStatus approved). Rule cụ thể khai ở `scripts/gate.config.ts`.
- `src/`: BaseLayout (SEO + JSON-LD head), client Sanity, ROUTE_MAP rỗng, helper JSON-LD guard rỗng, vài component nền (Header, Footer, Breadcrumb, Card, EmptyState), trang chủ/404/sitemap, design token trung lập.
- `cms/`: Sanity Studio khung một ngôn ngữ, `baseFields` (slug, summary, ảnh, cổng reviewStatus), object `seo`, `schemas/index.ts` rỗng.
- `data/prices.example.yaml`: seam giá (giá không nhập vào Sanity).

Không có: entity cụ thể, schema entity, component chi tiết entity, i18n đa ngôn ngữ, bộ 27 validator bách khoa, module synth/translate. Đó là phần mỗi site tự thêm.

## Dựng một site mới từ starter

1. Copy: `cp -R site-starter <ten-site> && cd <ten-site> && rm -rf .git node_modules dist .astro && git init`.
2. Đổi định danh: thay mọi `CHANGE_ME` (grep để tìm) — `astro.config.mjs` (`site`), `wrangler.toml` (`name`), `package.json` (2 script deploy), Header/Footer/index.
3. Tạo Sanity project riêng: `cd cms && npx sanity@latest init --project-name "<ten>" --dataset production --visibility private --output-path .`. Ghi lại projectId.
4. Điền `.env` (copy từ `.env.example`): `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET=production`, `SANITY_READ_TOKEN` (tạo bằng `npx sanity tokens add "cloudflare-read" --role=viewer`).
5. Thêm entity: viết schema trong `cms/schemas/` (spread `baseFieldsBefore`/`baseFieldsAfter`), đăng ký ở `cms/schemas/index.ts`; thêm query, route (`src/lib/routes.ts`), component chi tiết, trang render trong `src/pages/`.
6. Khai cổng: điền `scripts/gate.config.ts` (`publishableTypes`, `requiredFields`, `references`) cho entity của site.
7. Cài hook local: `bash scripts/install-hooks.sh`.
8. Chạy thử: `npm install && npm run dev`. Kiểm cổng: `npm run gate`.

## Deploy

Theo runbook [`SETUP-NEW-SITE.md`](SETUP-NEW-SITE.md) trong lõi. Tóm tắt: GitHub repo mới → Cloudflare Pages Import Git repo (build `npm run build:ci`, output `dist`, 4 biến env, `NODE_VERSION=20`) → Deploy Hook + Sanity webhook để auto-deploy khi publish → gắn custom domain.

## Cổng

**Đường phát hành không có cổng validator** (chốt 2026-08-04, xem `docs/adr/ADR-0022`). `build:ci` = `npm run build` = `astro check && astro build`. Cổng duyệt nội dung tự động duy nhất là `reviewStatus == "approved"` trong Sanity (`docs/adr/ADR-0008`).

Validator vẫn còn nguyên, chỉ là gọi tay:

- `npm run gate` — astro check + `validate:post` + `audit:spec`
- `npm run build:strict` — chuỗi đầy đủ: `check:cwd` → `validate` → build → `validate:post`
- `npm --prefix scripts run validate:min` — V2 reference + V3 governance (đọc Sanity, cần `SANITY_STUDIO_PROJECT_ID`)
- `npm --prefix scripts run validate:jsonld` — V1 JSON-LD, quét `dist/` sau build

Ba kiểm: V1 JSON-LD (quét `dist/`), V2 reference (deref được, đúng type đích), V3 governance (publish phải `reviewStatus == "approved"`, đủ field bắt buộc theo `scripts/gate.config.ts`).

Muốn bật lại fail-closed: đổi `build:ci` về chuỗi đầy đủ **và** đổi build command trên Cloudflare Pages về `npm run build:ci` — thiếu bước thứ hai thì chuỗi chỉ nằm trên giấy.

## Tài liệu quyết định (ADR)

Các quyết định kiến trúc cốt lõi ghi ở [`docs/adr/`](docs/adr/): giá tách CMS (0001), mô hình entity (0002), mô hình hai tầng (0003), một ngôn ngữ mặc định (0004), priceKey tra lúc build (0007), reviewStatus là cổng publish (0008), gỡ cổng validator khỏi đường phát hành (0022).

## Yêu cầu

Node 20 (xem `.nvmrc`). Đăng nhập CLI: `npx wrangler login`, `npx sanity login`.
