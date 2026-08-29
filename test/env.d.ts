/// <reference types="@cloudflare/vitest-pool-workers/types" />

// Lệch so với brief: @cloudflare/vitest-pool-workers@0.22.0 đã bỏ interface
// `ProvidedEnv` mở rộng qua `declare module 'cloudflare:test'`. Kiểu của `env`
// (từ `cloudflare:test`) giờ là `Cloudflare.Env` toàn cục — namespace do
// `@cloudflare/workers-types` khai báo rỗng để dự án mở rộng bằng declaration
// merging. Khai báo dưới đây thay thế đúng vai trò của `ProvidedEnv` cũ.
import type { D1Migration } from '@cloudflare/vitest-pool-workers'
import type { D1Database } from '@cloudflare/workers-types'

declare global {
  namespace Cloudflare {
    interface Env {
      BOOKING_DB: D1Database
      TEST_MIGRATIONS: D1Migration[]
    }
  }
}
