export interface SynthesisEnv {
  OPEN_FETCH_DOMAINS?: string
  SCRAPFLY_KEY?: string
  SANITY_READ_TOKEN?: string
  SANITY_WRITE_TOKEN?: string
  SANITY_STUDIO_PROJECT_ID?: string
  SANITY_STUDIO_DATASET?: string
  DEEPSEEK_API_KEY?: string
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  LLM_PROVIDER_CHAIN?: string
  LLM_TIMEOUT_MS?: string
  DEEPSEEK_MODEL?: string
  OPENAI_MODEL?: string
  ANTHROPIC_MODEL?: string
}

function currentProcessEnv(): SynthesisEnv {
  const p = globalThis as any
  return p.process?.env ?? {}
}

function splitCsv(value: string): string[] {
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export async function loadNodeDotEnv(): Promise<void> {
  const p = globalThis as any
  if (!p.process?.versions?.node) return

  const [{ config }, { resolve, dirname }, { fileURLToPath }] = await Promise.all([
    import('dotenv'),
    import('node:path'),
    import('node:url'),
  ])
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  config({ path: resolve(__dirname, '../../.env'), quiet: true })
  configureSynthesisEnv(p.process.env)
}

export let OPEN_FETCH_DOMAINS = splitCsv(currentProcessEnv().OPEN_FETCH_DOMAINS || 'wikipedia.org,wikidata.org,wikimedia.org')
export let SCRAPFLY_KEY = currentProcessEnv().SCRAPFLY_KEY || ''
export let SANITY_READ_TOKEN = currentProcessEnv().SANITY_READ_TOKEN || ''
export let SANITY_WRITE_TOKEN = currentProcessEnv().SANITY_WRITE_TOKEN || ''
export let SANITY_PROJECT_ID = currentProcessEnv().SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
export let SANITY_DATASET = currentProcessEnv().SANITY_STUDIO_DATASET || 'production'

export const MAX_CONSECUTIVE_ERRORS = 3
export const SCRAPFLY_BASE = 'https://api.scrapfly.io/scrape'
export const FETCH_TIMEOUT_MS = 30_000

// Provider chain prose-LLM (ADR-0014, DECISIONS 2026-06-20 tối) — config.ts là điểm cắm duy nhất
export let DEEPSEEK_API_KEY = currentProcessEnv().DEEPSEEK_API_KEY || ''
export let OPENAI_API_KEY = currentProcessEnv().OPENAI_API_KEY || ''
export let ANTHROPIC_API_KEY = currentProcessEnv().ANTHROPIC_API_KEY || ''
export let LLM_PROVIDER_CHAIN = splitCsv(currentProcessEnv().LLM_PROVIDER_CHAIN || 'deepseek,openai,anthropic')
export let LLM_TIMEOUT_MS = Number(currentProcessEnv().LLM_TIMEOUT_MS || 60_000)
export let LLM_MODELS = {
  deepseek: currentProcessEnv().DEEPSEEK_MODEL || 'deepseek-chat',
  openai: currentProcessEnv().OPENAI_MODEL || 'gpt-4o-mini',
  anthropic: currentProcessEnv().ANTHROPIC_MODEL || 'claude-sonnet-4-6',
}

export function configureSynthesisEnv(env: SynthesisEnv): void {
  OPEN_FETCH_DOMAINS = splitCsv(env.OPEN_FETCH_DOMAINS || 'wikipedia.org,wikidata.org,wikimedia.org')
  SCRAPFLY_KEY = env.SCRAPFLY_KEY || ''
  SANITY_READ_TOKEN = env.SANITY_READ_TOKEN || ''
  SANITY_WRITE_TOKEN = env.SANITY_WRITE_TOKEN || ''
  SANITY_PROJECT_ID = env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
  SANITY_DATASET = env.SANITY_STUDIO_DATASET || 'production'
  DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY || ''
  OPENAI_API_KEY = env.OPENAI_API_KEY || ''
  ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY || ''
  LLM_PROVIDER_CHAIN = splitCsv(env.LLM_PROVIDER_CHAIN || 'deepseek,openai,anthropic')
  LLM_TIMEOUT_MS = Number(env.LLM_TIMEOUT_MS || 60_000)
  LLM_MODELS = {
    deepseek: env.DEEPSEEK_MODEL || 'deepseek-chat',
    openai: env.OPENAI_MODEL || 'gpt-4o-mini',
    anthropic: env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  }
}
