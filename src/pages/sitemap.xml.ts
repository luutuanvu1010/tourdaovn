import type { APIRoute } from 'astro'
import { LANGS } from '../lib/sitemap'
import { siteBaseUrl } from '../lib/siteUrl'

export const GET: APIRoute = async ({ site }) => {
  const base = siteBaseUrl(site)
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    LANGS.map((lang) => `  <sitemap><loc>${base}/sitemap-${lang}.xml</loc></sitemap>`).join('\n') +
    `\n</sitemapindex>\n`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
