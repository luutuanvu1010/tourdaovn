// Đo bố cục thật bằng Chrome headless qua CDP. Không dùng extension (không tin được ở phiên này).
// Chạy: node do-layout.mjs <url> <width> <height>
const [, , URL_, W, H] = process.argv
const width = +(W || 1366), height = +(H || 768)

const r = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(URL_), { method: 'PUT' })
const target = await r.json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id
  pending.set(i, { res, rej })
  ws.send(JSON.stringify({ id: i, method, params }))
})
await new Promise(res => ws.addEventListener('open', res))
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id).res(m.result); pending.delete(m.id) }
})

await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 })
await send('Page.enable')
await send('Page.navigate', { url: URL_ })
await new Promise(res => setTimeout(res, 3500))

const expr = `(() => {
  const q = s => document.querySelector(s)
  const rect = el => el ? (r => ({t: Math.round(r.top + scrollY), h: Math.round(r.height), l: Math.round(r.left + scrollX), w: Math.round(r.width)}))(el.getBoundingClientRect()) : null
  const de = document.documentElement
  // thủ phạm tràn ngang: mọi element vượt quá mép phải của viewport
  const thuPham = [...document.querySelectorAll('body *')]
    .map(el => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1))
    .slice(0, 8)
    .map(({ el, r }) => ({
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === 'string' ? el.className : '').slice(0, 48),
      left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width)
    }))
  const h1 = q('.detail-title'); const cs = h1 && getComputedStyle(h1)
  const lh = cs ? parseFloat(cs.lineHeight) : 0
  const bar = q('.sticky-bar')
  return {
    url: location.pathname,
    vp: { w: de.clientWidth, h: innerHeight },
    scrollW: de.scrollWidth,
    tranNgang: de.scrollWidth - de.clientWidth,
    h1: h1 ? { fontSize: cs.fontSize, lines: +(h1.getBoundingClientRect().height / lh).toFixed(2), ...rect(h1) } : null,
    crumbBand: rect(q('.crumb-band')),
    titleBand: rect(q('.title-band')),
    hero: rect(q('.hero-shell')),
    stickyBar: rect(bar),
    barDayO: bar ? Math.round(bar.getBoundingClientRect().top + scrollY + bar.getBoundingClientRect().height) : null,
    trongManDau: bar ? (bar.getBoundingClientRect().top + scrollY + bar.getBoundingClientRect().height) <= innerHeight : null,
    coGia: !!q('.sticky-bar__price'),
    coCTA: !!q('.sticky-bar__cta'),
    thuPhamTranNgang: thuPham,
  }
})()`

const { result } = await send('Runtime.evaluate', { expression: expr, returnByValue: true })
console.log(JSON.stringify(result.value, null, 1))
ws.close()
process.exit(0)
