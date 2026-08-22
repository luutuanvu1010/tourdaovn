/// <reference types="astro/client" />

// Binding và secret của Worker (SPEC-2026-08-21-dat-tour §4.7, ADR-0027). Khai tay thay vì
// `wrangler types`: runtime types nó sinh ra xung đột với lib DOM mà Astro đang bật; adapter
// cũng chỉ `import type` từ @cloudflare/workers-types (dist/utils/handler.d.ts). Chỉ TÊN,
// không giá trị — giá trị sống ở `wrangler secret` và `.dev.vars` (BK4).
interface Env {
  BOOKING_DB: import('@cloudflare/workers-types').D1Database
  RESEND_API_KEY?: string
  BOOKING_NOTIFY_EMAIL?: string
  ZALO_BOT_TOKEN?: string
  ZALO_BOT_CHAT_IDS?: string
  TURNSTILE_SECRET_KEY?: string
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
