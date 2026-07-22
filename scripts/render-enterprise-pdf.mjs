import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')

const input = path.resolve(repoRoot, process.argv[2] ?? 'project/enterprise-docs/MULTI_TENANT_TRAVEL_PLATFORM_STRATEGY.md')
const output = path.resolve(repoRoot, process.argv[3] ?? 'project/enterprise-docs/MULTI_TENANT_TRAVEL_PLATFORM_STRATEGY.pdf')

const PAGE = { w: 1240, h: 1754, marginX: 96, marginTop: 96, marginBottom: 92 }
const contentW = PAGE.w - PAGE.marginX * 2

const colors = {
  ink: '#17202a',
  muted: '#52616b',
  primary: '#0c4a6e',
  accent: '#c2410c',
  border: '#d7e6ee',
  soft: '#f8fbfc',
  codeBg: '#111827',
  code: '#e5eef5',
  tableHead: '#e8f3f7',
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function stripInline(value) {
  return String(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function charsPerLine(fontSize, width = contentW) {
  return Math.max(28, Math.floor(width / (fontSize * 0.55)))
}

function wrapText(text, fontSize, width = contentW) {
  const max = charsPerLine(fontSize, width)
  const words = stripInline(text).split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    if (!line) {
      line = word
      continue
    }
    if ((line + ' ' + word).length <= max) {
      line += ' ' + word
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function parseMarkdown(markdown) {
  const rawLines = markdown.split(/\r?\n/)
  const blocks = []
  let paragraph = []
  let code = null

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ') })
      paragraph = []
    }
  }

  for (const raw of rawLines) {
    const line = raw.trimEnd()
    if (line.startsWith('```')) {
      flushParagraph()
      if (code) {
        blocks.push({ type: 'code', lines: code })
        code = null
      } else {
        code = []
      }
      continue
    }
    if (code) {
      code.push(line)
      continue
    }
    if (!line.trim()) {
      flushParagraph()
      blocks.push({ type: 'space' })
      continue
    }
    if (/^---+$/.test(line.trim())) {
      flushParagraph()
      blocks.push({ type: 'hr' })
      continue
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line)
    if (heading) {
      flushParagraph()
      blocks.push({ type: `h${heading[1].length}`, text: heading[2] })
      continue
    }
    if (/^\|.+\|$/.test(line.trim())) {
      flushParagraph()
      if (/^\|\s*-/.test(line.trim())) continue
      blocks.push({ type: 'tableRow', cells: line.trim().slice(1, -1).split('|').map(cell => stripInline(cell)) })
      continue
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line.trim())
    if (bullet) {
      flushParagraph()
      blocks.push({ type: 'bullet', text: bullet[1] })
      continue
    }
    const numbered = /^\d+\.\s+(.+)$/.exec(line.trim())
    if (numbered) {
      flushParagraph()
      blocks.push({ type: 'bullet', text: numbered[1] })
      continue
    }
    paragraph.push(line.trim())
  }
  flushParagraph()
  return blocks
}

function pageTemplate(body, pageNo, totalPages) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.w}" height="${PAGE.h}" viewBox="0 0 ${PAGE.w} ${PAGE.h}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <rect x="0" y="0" width="${PAGE.w}" height="18" fill="${colors.primary}"/>
  ${body}
  <line x1="${PAGE.marginX}" y1="${PAGE.h - 58}" x2="${PAGE.w - PAGE.marginX}" y2="${PAGE.h - 58}" stroke="${colors.border}" stroke-width="1"/>
  <text x="${PAGE.marginX}" y="${PAGE.h - 32}" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="${colors.muted}">Ke hoach chien luoc Enterprise - Multi-tenant Travel Platform</text>
  <text x="${PAGE.w - PAGE.marginX}" y="${PAGE.h - 32}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="${colors.muted}">${pageNo}/${totalPages}</text>
</svg>`
}

function renderBlocks(blocks) {
  const pages = []
  let y = PAGE.marginTop
  let body = ''

  const ensure = (height) => {
    if (y + height <= PAGE.h - PAGE.marginBottom) return
    pages.push(body)
    body = ''
    y = PAGE.marginTop
  }

  const text = (line, x, yy, size, fill = colors.ink, weight = 400, family = 'Arial, Helvetica, sans-serif') => {
    body += `<text x="${x}" y="${yy}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>\n`
  }

  for (const block of blocks) {
    if (block.type === 'space') {
      y += 8
      continue
    }
    if (block.type === 'hr') {
      ensure(28)
      body += `<line x1="${PAGE.marginX}" y1="${y + 8}" x2="${PAGE.w - PAGE.marginX}" y2="${y + 8}" stroke="${colors.border}" stroke-width="2"/>\n`
      y += 30
      continue
    }
    if (block.type === 'h1') {
      const lines = wrapText(block.text, 44)
      ensure(lines.length * 52 + 28)
      body += `<rect x="${PAGE.marginX - 18}" y="${y - 22}" width="${contentW + 36}" height="${lines.length * 52 + 24}" rx="12" fill="${colors.soft}" stroke="${colors.border}" stroke-width="1"/>\n`
      body += `<rect x="${PAGE.marginX - 18}" y="${y - 22}" width="10" height="${lines.length * 52 + 24}" fill="${colors.primary}"/>\n`
      for (const line of lines) {
        text(line, PAGE.marginX, y + 24, 44, colors.primary, 800)
        y += 52
      }
      y += 22
      continue
    }
    if (block.type === 'h2') {
      const lines = wrapText(block.text, 34)
      ensure(lines.length * 42 + 34)
      y += 16
      for (const line of lines) {
        text(line, PAGE.marginX, y + 18, 34, colors.primary, 760)
        y += 42
      }
      body += `<line x1="${PAGE.marginX}" y1="${y - 8}" x2="${PAGE.w - PAGE.marginX}" y2="${y - 8}" stroke="${colors.border}" stroke-width="2"/>\n`
      y += 14
      continue
    }
    if (block.type === 'h3' || block.type === 'h4') {
      const size = block.type === 'h3' ? 27 : 23
      const lines = wrapText(block.text, size)
      ensure(lines.length * (size + 10) + 20)
      y += 10
      for (const line of lines) {
        text(line, PAGE.marginX, y + size, size, '#164e63', 700)
        y += size + 10
      }
      y += 4
      continue
    }
    if (block.type === 'p') {
      const lines = wrapText(block.text, 23)
      ensure(lines.length * 31 + 12)
      for (const line of lines) {
        text(line, PAGE.marginX, y + 23, 23)
        y += 31
      }
      y += 8
      continue
    }
    if (block.type === 'bullet') {
      const lines = wrapText(block.text, 23, contentW - 36)
      ensure(lines.length * 31 + 12)
      text('•', PAGE.marginX + 6, y + 23, 24, colors.accent, 700)
      for (let i = 0; i < lines.length; i++) {
        text(lines[i], PAGE.marginX + 36, y + 23, 23)
        y += 31
      }
      y += 6
      continue
    }
    if (block.type === 'tableRow') {
      const line = block.cells.join(' | ')
      const lines = wrapText(line, 20)
      ensure(lines.length * 27 + 16)
      body += `<rect x="${PAGE.marginX - 8}" y="${y + 2}" width="${contentW + 16}" height="${lines.length * 27 + 10}" fill="${colors.tableHead}" opacity="0.55"/>\n`
      for (const item of lines) {
        text(item, PAGE.marginX, y + 24, 20, colors.ink, 500)
        y += 27
      }
      y += 8
      continue
    }
    if (block.type === 'code') {
      const wrapped = block.lines.flatMap(line => wrapText(line || ' ', 18))
      ensure(wrapped.length * 25 + 34)
      body += `<rect x="${PAGE.marginX - 10}" y="${y}" width="${contentW + 20}" height="${wrapped.length * 25 + 24}" rx="10" fill="${colors.codeBg}"/>\n`
      y += 20
      for (const line of wrapped) {
        text(line, PAGE.marginX, y + 16, 18, colors.code, 400, 'Menlo, Consolas, monospace')
        y += 25
      }
      y += 18
    }
  }

  if (body.trim()) pages.push(body)
  return pages
}

async function main() {
  const markdown = fs.readFileSync(input, 'utf8')
  const blocks = parseMarkdown(markdown)
  const rendered = renderBlocks(blocks)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'enterprise-plan-pdf-'))
  const pageFiles = []

  for (let i = 0; i < rendered.length; i++) {
    const svg = pageTemplate(rendered[i], i + 1, rendered.length)
    const file = path.join(tmp, `page-${String(i + 1).padStart(3, '0')}.png`)
    await sharp(Buffer.from(svg)).png().toFile(file)
    pageFiles.push(file)
  }

  fs.mkdirSync(path.dirname(output), { recursive: true })
  execFileSync('magick', [...pageFiles, '-quality', '92', output], { stdio: 'inherit' })
  console.log(`Rendered ${rendered.length} pages -> ${output}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
