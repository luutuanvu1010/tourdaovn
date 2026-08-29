// html.ts — trang phản hồi tối giản cho trường hợp form gửi không JavaScript (SPEC §4.4).
// Không phải trang tĩnh của site, không vào sitemap; không đọc Sanity (BK1) nên kênh liên hệ
// chỉ là liên kết tới /lien-he/ đã có sẵn.
import { escapeHtml } from './notify/format'

export function renderBookingPage(o: { title: string; heading: string; lines: string[]; backHref: string; ok: boolean }): string {
  const color = o.ok ? '#0C4A6E' : '#96271A'
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(o.title)}</title></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#F8FAFC;color:#0F172A">
<main style="max-width:560px;margin:48px auto;padding:24px;background:#fff;border:1px solid #E2E8F0;border-radius:12px">
<h1 style="font-size:22px;margin:0 0 12px;color:${color}">${escapeHtml(o.heading)}</h1>
${o.lines.map(l => `<p style="margin:0 0 8px;line-height:1.5">${escapeHtml(l)}</p>`).join('\n')}
<p style="margin:20px 0 0"><a href="${escapeHtml(o.backHref)}">← Về trang tour</a> · <a href="/lien-he/">Trang liên hệ</a></p>
</main></body></html>`
}
