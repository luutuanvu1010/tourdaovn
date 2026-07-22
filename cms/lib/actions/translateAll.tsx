import React, { useMemo, useState } from 'react'
import type { DocumentActionComponent } from 'sanity'
import { Box, Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { TranslateIcon } from '@sanity/icons'
import { synthApiHeaders, synthApiUrl } from '../synthApi'

const FIELD_LEVEL_TYPES = [
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

function publishedId(id: string): string {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
}

function count(result: any): number {
  return Array.isArray(result?.fieldsTranslated) ? result.fieldsTranslated.length : 0
}

function failedCount(result: any): number {
  return Array.isArray(result?.fieldsFailed) ? result.fieldsFailed.length : 0
}

// 4 trạng thái: dịch hết OK / dịch một phần / fail toàn bộ / thật sự không còn field trống
function resultView(result: any): { tone: 'positive' | 'caution' | 'critical'; message: string } {
  const translated = count(result)
  const failed = failedCount(result)
  if (translated > 0 && failed === 0) return { tone: 'positive', message: `Đã dịch ${translated} mục trống.` }
  if (translated > 0 && failed > 0) return { tone: 'caution', message: `Đã dịch ${translated} mục, THẤT BẠI ${failed} mục — xem cảnh báo bên dưới.` }
  if (failed > 0) return { tone: 'critical', message: `Không dịch được mục nào (${failed} mục trống gặp lỗi provider) — xem cảnh báo bên dưới.` }
  return { tone: 'positive', message: 'Không còn field trống cần dịch.' }
}

export const TranslateAllAction: DocumentActionComponent = (props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const id = useMemo(() => publishedId(props.id), [props.id])
  const enabled = FIELD_LEVEL_TYPES.includes(props.schemaType)

  async function run() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(synthApiUrl('/translate'), {
        method: 'POST',
        headers: synthApiHeaders(),
        body: JSON.stringify({
          id,
          type: props.schemaType,
          dryRun: false,
        }),
      })
      const json = await res.json()
      setResult(json)
      if (!res.ok || json.ok === false) {
        setError(json.error || json.warnings?.[0] || `HTTP ${res.status}: Không thể dịch document này`)
      }
    } catch (err: any) {
      setError(err?.message || 'Translate All thất bại')
    } finally {
      setLoading(false)
    }
  }

  return {
    label: 'Translate All',
    icon: TranslateIcon,
    disabled: !enabled,
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog',
      header: 'Translate All',
      onClose: () => setOpen(false),
      content: (
        <Box padding={4}>
          <Stack space={4}>
            <Text size={1}>
              Dịch toàn bộ field còn trống của document này sang en/zh/ko/ru và ghi vào draft.
            </Text>

            {error ? (
              <Card tone="critical" padding={3} radius={2}>
                <Text size={1}>{error}</Text>
              </Card>
            ) : null}

            {result ? (
              <Card tone={error ? 'critical' : resultView(result).tone} padding={3} radius={2}>
                <Stack space={3}>
                  <Text size={1} weight="semibold">
                    {resultView(result).message}
                  </Text>
                  <Text size={1}>Ghi draft: {result.written ? 'có' : 'không'}</Text>
                  <Text size={1}>Provider: {(result.providersUsed || []).join(', ') || '—'}</Text>
                  {(result.warnings || []).slice(0, 6).map((warning: string) => (
                    <Text key={warning} size={1}>- {warning}</Text>
                  ))}
                </Stack>
              </Card>
            ) : null}

            <Flex gap={3}>
              <Button
                text={loading ? 'Đang dịch...' : 'Translate All'}
                tone="primary"
                disabled={loading}
                onClick={run}
              />
              <Button
                text="Đóng"
                mode="ghost"
                disabled={loading}
                onClick={() => setOpen(false)}
              />
            </Flex>
          </Stack>
        </Box>
      ),
    },
  }
}
