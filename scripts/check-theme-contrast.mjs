#!/usr/bin/env node
// Kiểm tương phản WCAG AA cho MỌI bộ giao diện khai trong tokens.css.
//
// Vì sao cần: bộ giao diện chọn được trong Studio (07-DESIGN_TOKENS §1b). Thêm
// một bộ mới mà mắt thấy "đẹp" nhưng chữ trắng trên nền accent chỉ đạt 3.2 thì
// site vi phạm ngưỡng accessibility ở 04-CONSTRAINTS §3 — mà không ai biết cho
// tới khi đo Lighthouse. Lệnh này đọc thẳng tokens.css nên không có bản chép
// thứ hai để lệch.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(resolve(ROOT, 'src/styles/tokens.css'), 'utf-8')

const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Lấy các token màu trong một khối CSS. */
function tokensIn(block) {
  const out = {}
  for (const m of block.matchAll(/--(c-[\w-]+):\s*(#[0-9A-Fa-f]{6})/g)) out[m[1]] = m[2]
  return out
}

const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')))
const base = tokensIn(rootBlock)

const themes = [['bien-sau (mặc định, :root)', base]]
for (const m of css.matchAll(/:root\[data-theme='([^']+)'\]\s*\{([^}]*)\}/g)) {
  themes.push([m[1], { ...base, ...tokensIn(m[2]) }])
}

const AA = 4.5
const pairs = [
  ['chữ chính / nền', 'c-text', 'c-surface'],
  ['chữ mờ / nền', 'c-text-muted', 'c-surface'],
  ['trắng / primary', null, 'c-primary'],
  ['trắng / accent', null, 'c-accent'],
]

let failed = 0
console.log('=== Tương phản bộ giao diện (WCAG AA ≥ 4.5) ===\n')
for (const [name, t] of themes) {
  console.log(`── ${name}`)
  for (const [label, fg, bg] of pairs) {
    const a = fg ? t[fg] : '#FFFFFF'
    const b = t[bg]
    if (!a || !b) {
      console.log(`     ${label.padEnd(18)} thiếu token — bỏ qua`)
      continue
    }
    const v = ratio(a, b)
    const ok = v >= AA
    if (!ok) failed++
    console.log(`     ${label.padEnd(18)} ${v.toFixed(2).padStart(5)}  ${ok ? '✓' : '✗ RỚT AA'}`)
  }
}

if (failed > 0) {
  console.log(`\n[FAIL] ${failed} cặp rớt ngưỡng AA. Sửa tokens.css rồi chạy lại.`)
  process.exit(1)
}
console.log(`\n[pass] ${themes.length} bộ, tất cả cặp đạt AA.`)
