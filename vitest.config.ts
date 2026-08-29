// Test chạy trong workerd (miniflare) để có D1 thật, không mock.
// KHÔNG trỏ wrangler.toml: `main` của nó là dist/_worker.js chỉ có sau khi build;
// test gọi thẳng handleBooking() nên chỉ cần binding D1 và cờ tương thích.
//
// Lệch so với brief: @cloudflare/vitest-pool-workers@0.22.0 (dòng vitest 4) đã bỏ
// subpath `/config` và hàm `defineWorkersConfig`/`defineWorkersProject`. Cấu hình
// giờ đăng ký qua Vite plugin `cloudflareTest()` (export ở gốc package), truyền
// thẳng `defineConfig` của `vitest/config`. `readD1Migrations` vẫn đúng chữ ký,
// chỉ đổi chỗ import — từ gốc package thay vì `/config`.
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const migrations = await readD1Migrations(join(here, 'migrations'))
  return {
    plugins: [
      cloudflareTest({
        miniflare: {
          compatibilityDate: '2026-06-01',
          compatibilityFlags: ['nodejs_compat'],
          d1Databases: { BOOKING_DB: 'booking-test' },
          bindings: { TEST_MIGRATIONS: migrations },
        },
      }),
    ],
    test: {
      include: ['test/**/*.test.ts'],
      setupFiles: ['./test/setup/apply-migrations.ts'],
    },
  }
})
