import type { APIRoute } from 'astro'
import { buildSitemapPaths, sitemapUrl } from '../lib/sitemap'
import { siteBaseUrl } from '../lib/siteUrl'

export const GET: APIRoute = async ({ site }) => {
  const base = siteBaseUrl(site)
  const paths = await buildSitemapPaths('vi')
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((path) => `  <url><loc>${sitemapUrl(base, path)}</loc></url>`).join('\n') +
    `\n</urlset>\n`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
