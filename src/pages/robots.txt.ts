// robots.txt — sinh build-time, không phải file tĩnh trong public/.
//
// Vì sao là endpoint chứ không phải public/robots.txt: dòng Sitemap phải mang
// tên miền thật, mà tên miền là `site.url` trong src/site.config.ts (ADR-0021).
// File tĩnh sẽ buộc hardcode tên miền lần thứ hai, phá quy tắc một nguồn sự
// thật. Cùng khuôn với llms.txt.ts và sitemap.xml.ts.
//
// Chính sách: mở toàn bộ. Site này chủ động mời crawler, gồm cả AI crawler
// (xem llms.txt và /ai/*.json). Không có trang noindex ở phase 1 — 05-URL_MAP
// mục 1.1 quyết định nền 8: "mọi trang publish đều index".

import type { APIRoute } from 'astro'
import { siteBaseUrl } from '../lib/siteUrl'

export const prerender = true

export const GET: APIRoute = async ({ site }) => {
  const base = siteBaseUrl(site)
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
