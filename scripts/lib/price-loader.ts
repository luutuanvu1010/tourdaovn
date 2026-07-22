import { readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'

export type PriceUnit = 'perPax' | 'perRoomNight' | 'perTicket'

export type PriceEntry =
  | { unit: 'perPax'; amount: number }
  | { unit: 'perPax'; tiers: { maxPax: number; amount: number }[] }
  | { unit: 'perRoomNight'; from: number; asOf: string }
  | { unit: 'perTicket'; tickets: { name: string; amount: number }[] }

export function loadPrices(path: string): Map<string, PriceEntry> {
  const raw = readFileSync(path, 'utf-8')
  const data = parseYaml(raw) as Record<string, PriceEntry> | null
  if (!data) return new Map()
  return new Map(Object.entries(data))
}
