// Re-export cấu hình provider/Sanity từ synthesis/config (R1 — không khai báo lại logic provider).
import {
  LLM_PROVIDER_CHAIN,
  DEEPSEEK_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  LLM_MODELS,
  LLM_TIMEOUT_MS,
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_READ_TOKEN,
  SANITY_WRITE_TOKEN,
} from '../synthesis/config'

export {
  LLM_PROVIDER_CHAIN,
  DEEPSEEK_API_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  LLM_MODELS,
  LLM_TIMEOUT_MS,
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_READ_TOKEN,
  SANITY_WRITE_TOKEN,
}

export const TARGET_LANGS = ['en', 'zh', 'ko', 'ru'] as const
export type TargetLang = (typeof TARGET_LANGS)[number]

export const ROUNDTRIP_MAX_LOSS = 0.3

// 12 entity field-level i18n (DOT1) — loại article (document-level/translationGroup, ADR-0004)
// và category (không có reviewStatus, founder tuyển là duyệt — CLAUDE.md mục 5)
export const ENTITY_TYPES = [
  'touristDestination',
  'place',
  'attraction',
  'restaurant',
  'specialty',
  'hotel',
  'resort',
  'experience',
  'organization',
  'event',
  'tour',
  'person',
]
