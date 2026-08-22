// POST /api/dat-tour — route on-demand DUY NHẤT của site (ADR-0027). Mọi logic ở
// src/lib/booking/handler.ts để test không cần Astro; file này chỉ nối binding.
import type { APIRoute } from 'astro'
import { handleBooking } from '../../lib/booking/handler'

export const prerender = false

export const POST: APIRoute = ({ request, locals }) => {
  const { env, ctx } = locals.runtime
  return handleBooking(request, env, ctx)
}

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ ok: false, message: 'Chỉ nhận POST.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' },
  })
