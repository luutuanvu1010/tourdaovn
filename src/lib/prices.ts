import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import type { PriceEntry } from './types'

/**
 * Đọc và parse prices.yaml → Map<bookingRef, PriceEntry>.
 * Dùng process.cwd() vì astro build và astro dev luôn chạy từ project root.
 * (Không dùng import.meta.url — file bị bundle vào dist/_worker.js khi
 * Cloudflare adapter prerender, import.meta.url trỏ sai vị trí.)
 */
export function loadPrices(filename = 'data/prices.yaml'): Map<string, PriceEntry> {
  const path = resolve(process.cwd(), filename)
  const raw = readFileSync(path, 'utf-8')
  const data = parseYaml(raw) as Record<string, PriceEntry> | null
  if (!data) return new Map()
  return new Map(Object.entries(data))
}
