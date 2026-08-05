/* ═══════════════════════════════════════════════════════════════
   _shell.js — KHUNG XEM THỬ, KHÔNG THUỘC THIẾT KẾ

   Ba công tắc:
     1. Bộ giao diện  → gắn data-theme lên <html>, đúng cách BaseLayout
        đang làm thật (07-DESIGN_TOKENS §1b).
     2. Số mục dữ liệu → cắt bớt/thêm lại thẻ trong mọi [data-density]
        để xem khối ở 1 mục, 2 mục, 3 mục, 4 mục, 6 mục.
     3. Nhãn đối chiếu → bật/tắt nhãn "§x.y · field" trên từng vùng.

   Bước 8 không dựng lại file này.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var THEMES = [
    ['bien-sau', 'Biển sâu'],
    ['cat-bien', 'Cát biển'],
    ['ngoc-lam', 'Ngọc lam'],
  ];
  var COUNTS = [0, 1, 2, 3, 4, 6];

  function button(label, pressed) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mk-btn';
    b.textContent = label;
    b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    return b;
  }

  function group(labelText, nodes) {
    var g = document.createElement('div');
    g.className = 'mk-group';
    var s = document.createElement('span');
    s.textContent = labelText;
    g.appendChild(s);
    nodes.forEach(function (n) { g.appendChild(n); });
    return g;
  }

  function press(list, active) {
    list.forEach(function (b) {
      b.setAttribute('aria-pressed', b === active ? 'true' : 'false');
    });
  }

  /* ── 2. Số mục dữ liệu ──────────────────────────────────────── */

  var pools = [];

  function collectPools() {
    pools = [];
    document.querySelectorAll('[data-density]').forEach(function (el) {
      pools.push({ el: el, items: Array.prototype.slice.call(el.children) });
    });
  }

  function applyCount(n) {
    pools.forEach(function (p) {
      var max = p.items.length;
      var want = Math.min(n, max);
      // dựng lại đúng `want` thẻ đầu; thẻ thừa gỡ khỏi DOM, thẻ thiếu gắn lại
      p.items.forEach(function (item, i) {
        if (i < want) {
          if (item.parentNode !== p.el) p.el.appendChild(item);
        } else if (item.parentNode === p.el) {
          p.el.removeChild(item);
        }
      });
      // giữ đúng thứ tự sau khi gắn lại
      p.items.slice(0, want).forEach(function (item) { p.el.appendChild(item); });
      p.el.setAttribute('data-count', String(want));
      // khối rỗng thì ẩn hẳn cả section — 06 quyết định nền 2, R4
      var section = p.el.closest('[data-hide-when-empty]');
      if (section) section.hidden = want === 0;
    });
  }

  /* ── dựng thanh điều khiển ──────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    collectPools();

    var chrome = document.querySelector('.mk-chrome');
    if (!chrome) return;

    var themeBtns = THEMES.map(function (t, i) {
      var b = button(t[1], i === 0);
      b.addEventListener('click', function () {
        document.documentElement.setAttribute('data-theme', t[0]);
        press(themeBtns, b);
      });
      return b;
    });

    var countBtns = COUNTS.map(function (c) {
      var b = button(String(c), c === 1);
      b.addEventListener('click', function () {
        applyCount(c);
        press(countBtns, b);
      });
      return b;
    });

    var bindBtn = button('Nhãn binding', false);
    bindBtn.addEventListener('click', function () {
      var on = document.body.classList.toggle('mk-bind');
      bindBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    chrome.appendChild(group('Bộ giao diện', themeBtns));
    chrome.appendChild(group('Số mục', countBtns));
    chrome.appendChild(group('Đối chiếu', [bindBtn]));

    document.documentElement.setAttribute('data-theme', 'bien-sau');
    applyCount(1); // mặc định mở ở trạng thái NGHÈO NHẤT — đúng dữ liệu thật hôm nay
  });
})();
