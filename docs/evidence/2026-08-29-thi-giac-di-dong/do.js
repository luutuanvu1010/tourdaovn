// Đo K1–K7 cho SPEC-2026-08-29-thi-giac-di-dong.
// Dán vào console Chrome. Dùng Y HỆT đoạn này cho cả lần đo trước và sau.
// Tham số: url tương đối cần đo, ví dụ '/' hoặc '/tour/vinh-san-ho/'
window.__do = async function (url) {
  document.getElementById('__probe')?.remove()
  const f = document.createElement('iframe')
  f.id = '__probe'
  f.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;z-index:2147483647;border:0'
  f.src = url
  document.body.appendChild(f)
  await new Promise(r => { f.onload = r; setTimeout(r, 10000) })
  await new Promise(r => setTimeout(r, 1500))

  const d = f.contentDocument, w = f.contentWindow, de = d.documentElement
  const vh = w.innerHeight, vw = w.innerWidth

  // K4: ba ngoại lệ có tên — đệm 0, R3 không chạm tới chúng
  const LOAI_KHOI_K4 = el =>
    el.tagName === 'SCRIPT' ||
    el.classList.contains('site-home-hero') ||
    (el.tagName === 'DIV' && !el.className)

  const main = d.querySelector('main') || d.body
  const conMain = [...main.children]
  const pad = new Set()
  conMain.filter(el => !LOAI_KHOI_K4(el)).forEach(el => {
    const s = w.getComputedStyle(el)
    pad.add(s.paddingTop); pad.add(s.paddingBottom)
  })

  // K3: CHỈ đếm phần tử đang hiển thị. Nav ẩn ở ≤1023px cao 0, mà 0 < 44.
  const nho = []
  d.querySelectorAll('a,button,summary').forEach(el => {
    if (el.offsetParent === null) return
    const r = el.getBoundingClientRect()
    if (r.height === 0) return
    if (r.height < 44) nho.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 30) + ' h=' + Math.round(r.height))
  })

  const theCao = [...d.querySelectorAll('.card')].map(c => Math.round(c.getBoundingClientRect().height))
  const h2 = [...d.querySelectorAll('h2')].map(h => h.textContent.trim())
  const trung = h2.filter((t, i) => t && h2.indexOf(t) !== i)
  const hero = d.querySelector('.site-home-hero')

  return {
    url, vw, vh,
    K1_caoTrang: de.scrollHeight,
    K2_theCaoNhat: theCao.length ? Math.max(...theCao) : null,
    K2_soThe: theCao.length,
    K3_soDichChamNho: nho.length,
    K3_chiTiet: nho,
    K4_giaTriDem: [...pad].sort(),
    K4_soConMainDaLoc: conMain.filter(el => !LOAI_KHOI_K4(el)).length,
    K5_tranNgang: de.scrollWidth - vw,
    K6_h2Trung: [...new Set(trung)],
    K7_heroPhanTram: hero ? +(hero.getBoundingClientRect().height / vh * 100).toFixed(1) : null,
  }
}
