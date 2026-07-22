// Interface prose-LLM + điều phối chuỗi provider (R1). Không throw — hết chain trả rỗng + warning (R6).
import { LLM_PROVIDER_CHAIN, DEEPSEEK_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY } from '../config'
import { callDeepSeek, callOpenAI, callAnthropic } from './providers'

export interface ProseResult {
  data: Record<string, any> | null
  provider: string | null
  warnings: string[]
}

const PROVIDER_CALLS: Record<string, (instruction: string, content: string) => Promise<string>> = {
  deepseek: callDeepSeek,
  openai: callOpenAI,
  anthropic: callAnthropic,
}

function providerKey(provider: string): string {
  switch (provider) {
    case 'deepseek':
      return DEEPSEEK_API_KEY
    case 'openai':
      return OPENAI_API_KEY
    case 'anthropic':
      return ANTHROPIC_API_KEY
    default:
      return ''
  }
}

function parseJsonLoose(raw: string): Record<string, any> | null {
  try {
    return JSON.parse(raw)
  } catch {
    const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
    try {
      return JSON.parse(stripped)
    } catch {
      return null
    }
  }
}

// Log MỘT LẦN mỗi process khi provider trong chain bị bỏ qua vì thiếu key —
// để CLI/worker thấy rõ chain thực tế, không đổi hành vi fallback (R6).
const missingKeyWarned = new Set<string>()

export async function extractProse(instruction: string, content: string): Promise<ProseResult> {
  const warnings: string[] = []
  let anyKeyAvailable = false

  for (const provider of LLM_PROVIDER_CHAIN) {
    const call = PROVIDER_CALLS[provider]
    if (!call) {
      warnings.push(`Provider không xác định: ${provider}`)
      continue
    }
    if (!providerKey(provider)) {
      if (!missingKeyWarned.has(provider)) {
        missingKeyWarned.add(provider)
        console.warn(`[llm] provider ${provider} bỏ qua: thiếu key`)
      }
      continue // bỏ qua provider không có key
    }
    anyKeyAvailable = true

    try {
      const raw = await call(instruction, content)
      const data = parseJsonLoose(raw)
      if (data) {
        return { data, provider, warnings }
      }
      warnings.push(`${provider}: parse JSON thất bại`)
    } catch (err: any) {
      warnings.push(`${provider}: ${err.message}`)
    }
  }

  if (!anyKeyAvailable) {
    warnings.push(`Không provider nào có key trong chuỗi: ${LLM_PROVIDER_CHAIN.join(', ')}`)
  }

  return { data: null, provider: null, warnings }
}
