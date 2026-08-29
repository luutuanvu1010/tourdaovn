// POST /api/dat-tour — route on-demand DUY NHẤT của site (ADR-0027). Mọi logic ở
// src/lib/booking/handler.ts để test không cần Astro; file này chỉ nối binding.
import type { APIRoute } from 'astro'
import { handleBooking } from '../../lib/booking/handler'

export const prerender = false

const handle: APIRoute = ({ request, locals }) => {
  const { env, ctx } = locals.runtime
  return handleBooking(request, env, ctx)
}

export const POST = handle
// M8 (review Task 8): mọi phương thức khác cũng đi qua handleBooking thay vì tự trả 405 tại
// đây — trước kia ALL gõ cứng JSON, lệch với 405 của handleBooking vốn tôn trọng Accept
// (HTML khi Accept không có application/json). Giữ MỘT nguồn sự thật cho phản hồi 405.
export const ALL = handle
