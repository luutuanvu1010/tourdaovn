// Ba hàm gọi API prose-LLM, mỗi hàm nhận (instruction, content) trả raw text.
// Lỗi HTTP/timeout throw để llm/index.ts bắt và chuyển sang provider kế (R6).
import { DEEPSEEK_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, LLM_MODELS, LLM_TIMEOUT_MS } from '../config'

const ANTHROPIC_MAX_TOKENS = 4096

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${errorBody.slice(0, 300)}`)
    }

    return await res.json()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Timeout sau ${LLM_TIMEOUT_MS}ms`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function callDeepSeek(instruction: string, content: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) throw new Error('Thiếu DEEPSEEK_API_KEY')

  const body = await postJson(
    'https://api.deepseek.com/chat/completions',
    { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    {
      model: LLM_MODELS.deepseek,
      messages: [
        { role: 'system', content: instruction },
        { role: 'user', content },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    },
  )

  const text = body.choices?.[0]?.message?.content
  if (!text) throw new Error('DeepSeek response thiếu content')
  return text
}

export async function callOpenAI(instruction: string, content: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('Thiếu OPENAI_API_KEY')

  const body = await postJson(
    'https://api.openai.com/v1/chat/completions',
    { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    {
      model: LLM_MODELS.openai,
      messages: [
        { role: 'system', content: instruction },
        { role: 'user', content },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    },
  )

  const text = body.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI response thiếu content')
  return text
}

export async function callAnthropic(instruction: string, content: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error('Thiếu ANTHROPIC_API_KEY')

  const body = await postJson(
    'https://api.anthropic.com/v1/messages',
    {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    {
      model: LLM_MODELS.anthropic,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system: instruction,
      messages: [{ role: 'user', content }],
    },
  )

  const text = body.content?.[0]?.text
  if (!text) throw new Error('Anthropic response thiếu content')
  return text
}
