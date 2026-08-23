/// <reference types="astro/client" />

// Binding và secret của Worker (SPEC-2026-08-21-dat-tour §4.7, ADR-0027). Khai tay thay vì
// `wrangler types`: runtime types nó sinh ra xung đột với lib DOM mà Astro đang bật; adapter
// cũng chỉ `import type` từ @cloudflare/workers-types (dist/utils/handler.d.ts). Chỉ TÊN,
// không giá trị — giá trị sống ở `wrangler secret` và `.dev.vars` (BK4).
interface Env {
  BOOKING_DB: import('@cloudflare/workers-types').D1Database
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  AWS_SES_REGION?: string
  BOOKING_NOTIFY_EMAIL?: string
  ZALO_BOT_TOKEN?: string
  ZALO_BOT_CHAT_IDS?: string
  TURNSTILE_SECRET_KEY?: string
  // Muối băm IP cho tần suất — RIÊNG với TURNSTILE_SECRET_KEY (F4, review Task 8): xoay khoá
  // Turnstile không được kéo theo việc mọi ip_hash đã lưu bỗng vô nghĩa. Runbook Task 13 nay
  // là 8 giá trị phải `wrangler secret put` (thêm biến này; và QĐ-2026-08-22-07 đổi một khoá API
  // của nhà cung cấp email cũ thành ba biến AWS ở trên — AWS_SES_REGION không bí mật nhưng vẫn
  // phải đi đường này vì wrangler.toml không có [vars], BK4).
  IP_HASH_SALT?: string
  // Cửa thoát TƯỜNG MINH cho dev khi chưa có TURNSTILE_SECRET_KEY: đặt `'1'` trong `.dev.vars`
  // thì endpoint vẫn nhận đơn (Turnstile bỏ qua, có console.warn). Thiếu secret mà KHÔNG có cờ
  // này → endpoint trả 503, không nhận đơn (SPEC §4.7 "hỏng ồn ào, không hỏng câm" + §4.4
  // "bỏ qua kiểm (chỉ dev)"). KHÔNG bao giờ đặt trên production, KHÔNG khai trong
  // `wrangler.toml` — file đó không có `[vars]` (BK4).
  BOOKING_ALLOW_NO_TURNSTILE?: string
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
