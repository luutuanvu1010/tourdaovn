import React, { useMemo, useState } from 'react'
import type { FieldProps, Path } from 'sanity'
import { useFormValue } from 'sanity'
import { Box, Button, Card, Flex, Text } from '@sanity/ui'
import { TranslateIcon } from '@sanity/icons'
import { TRANSLATABLE_FIELDS } from '../lib/i18nConfig'
import { synthApiHeaders, synthApiUrl } from '../lib/synthApi'

const SEO_FIELDS = new Set(['metaTitle', 'metaDescription'])
const TARGET_LANGS = ['en', 'zh', 'ko', 'ru']

function stringPath(path: Path): string[] {
  return path.filter((segment): segment is string => typeof segment === 'string')
}

function fieldNameFromPath(path: Path): string | null {
  const parts = stringPath(path)
  if (parts.length === 1 && TRANSLATABLE_FIELDS.includes(parts[0]) && parts[0] !== 'seo') {
    return parts[0]
  }
  if (parts.length === 2 && parts[0] === 'seo' && SEO_FIELDS.has(parts[1])) {
    return `seo.${parts[1]}`
  }
  return null
}

function hasLocaleShape(props: FieldProps): boolean {
  const fields = ((props.schemaType as any).fields || []).map((field: any) => field.name)
  return ['vi', ...TARGET_LANGS].every(lang => fields.includes(lang))
}

function publishedId(id: string): string {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
}

function translatedCount(result: any): number {
  return Array.isArray(result?.fieldsTranslated) ? result.fieldsTranslated.length : 0
}

export function TranslateFieldControl(props: FieldProps) {
  const docId = useFormValue(['_id']) as string | undefined
  const docType = useFormValue(['_type']) as string | undefined
  const field = useMemo(() => fieldNameFromPath(props.path), [props.path])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'positive' | 'critical' | 'caution'>('positive')

  const isEligible = Boolean(field && docId && docType && hasLocaleShape(props))

  async function run() {
    if (!docId || !docType || !field) return

    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(synthApiUrl('/translate'), {
        method: 'POST',
        headers: synthApiHeaders(),
        body: JSON.stringify({
          id: publishedId(docId),
          type: docType,
          field,
          dryRun: false,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || json.warnings?.[0] || `HTTP ${res.status}`)
      }
      const count = translatedCount(json)
      const failed = Array.isArray(json?.fieldsFailed) ? json.fieldsFailed.length : 0
      if (count > 0 && failed > 0) {
        setTone('caution')
        setMessage(`Đã dịch ${count} mục, THẤT BẠI ${failed} mục: ${json.warnings?.[0] || 'lỗi provider'}`)
      } else if (count > 0) {
        setTone('positive')
        setMessage(`Đã dịch ${count} mục trống vào draft.`)
      } else if (failed > 0) {
        setTone('critical')
        setMessage(`Không dịch được mục nào (${failed} mục trống gặp lỗi): ${json.warnings?.[0] || 'lỗi provider'}`)
      } else {
        setTone('positive')
        setMessage('Field này hiện không còn mục trống để dịch.')
      }
    } catch (err: any) {
      setTone('critical')
      setMessage(err?.message || 'Dịch field thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (!isEligible) return props.renderDefault(props)

  return (
    <Box>
      <Flex justify="flex-end" marginBottom={2}>
        <Button
          icon={TranslateIcon}
          text={loading ? 'Đang dịch...' : 'Dịch field trống'}
          mode="ghost"
          tone="primary"
          fontSize={1}
          disabled={loading}
          onClick={run}
        />
      </Flex>
      {props.renderDefault(props)}
      {message ? (
        <Card tone={tone} padding={2} radius={2} marginTop={2}>
          <Text size={1}>{message}</Text>
        </Card>
      ) : null}
    </Box>
  )
}
