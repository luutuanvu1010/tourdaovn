import { applyD1Migrations, env } from 'cloudflare:test'

// Chạy trước mỗi file test; isolatedStorage mặc định nên mỗi test một D1 sạch.
await applyD1Migrations(env.BOOKING_DB, env.TEST_MIGRATIONS)
