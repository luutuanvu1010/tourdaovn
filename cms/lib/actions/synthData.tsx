import React, { useMemo, useState } from 'react'
import type { DocumentActionComponent } from 'sanity'
import { Box, Button, Card, Flex, Select, Stack, Text, TextArea, TextInput } from '@sanity/ui'
import { synthApiHeaders, synthApiUrl } from '../synthApi'
import { getScrapableTypes, getEntityLabel } from '../entityTypes'

const ENTITY_TYPES = getScrapableTypes()

function titleFromDocument(draft: any, published: any): string {
  const doc = draft || published || {}
  return doc.title?.vi || doc.title || ''
}

function urlsFromDocument(draft: any, published: any): string {
  const doc = draft || published || {}
  return [doc.officialSource, ...(Array.isArray(doc.sameAs) ? doc.sameAs : [])]
    .filter(Boolean)
    .join('\n')
}

function parseUrls(value: string): string[] {
  return value.split(/\n|,/).map(s => s.trim()).filter(Boolean)
}

function resultSummary(result: any): string {
  if (!result) return ''
  const warnings = result.validator?.warnings?.length ?? 0
  const errors = result.validator?.errors?.length ?? 0
  return `${result.fields?.filled?.length ?? 0} field, ${errors} lỗi, ${warnings} cảnh báo`
}

function resultError(result: any): string {
  return result?.write?.error || result?.error || ''
}

function topImageCandidates(result: any): any[] {
  return Array.isArray(result?.imageCandidates) ? result.imageCandidates.slice(0, 3) : []
}

export const SynthDataAction: DocumentActionComponent = (props) => {
  const initialTitle = useMemo(() => titleFromDocument(props.draft, props.published), [props.draft, props.published])
  const initialUrls = useMemo(() => urlsFromDocument(props.draft, props.published), [props.draft, props.published])
  const [open, setOpen] = useState(false)
  const [entity, setEntity] = useState(props.schemaType)
  const [name, setName] = useState(initialTitle)
  const [urls, setUrls] = useState(initialUrls)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<any>(null)

  async function run(dryRun: boolean) {
    setLoading(true)
    setError('')
    setStatus('')
    setResult(null)
    try {
      const res = await fetch(synthApiUrl('/synth'), {
        method: 'POST',
        headers: synthApiHeaders(),
        body: JSON.stringify({
          entity,
          name,
          urls: parseUrls(urls),
          dryRun,
        }),
      })
      const json = await res.json()
      setStatus(`HTTP ${res.status} - đã nhận phản hồi`)
      setResult(json)
      if (!res.ok || json.ok === false) {
        setError(resultError(json) || `HTTP ${res.status}`)
      }
    } catch (err: any) {
      setError(err?.message || 'Cào dữ liệu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return {
    label: 'Cào dữ liệu',
    onHandle: () => setOpen(true),
    disabled: !ENTITY_TYPES.includes(props.schemaType as any),
    dialog: open && {
      type: 'dialog',
      header: 'Cào dữ liệu',
      onClose: () => setOpen(false),
      content: (
        <Box padding={4}>
          <Stack space={4}>
            <Stack space={2}>
              <Text size={1} weight="semibold">Loại dữ liệu</Text>
              <Select value={entity} onChange={(event) => setEntity(event.currentTarget.value)}>
                {ENTITY_TYPES.map(type => <option key={type} value={type}>{getEntityLabel(type)}</option>)}
              </Select>
            </Stack>

            <Stack space={2}>
              <Text size={1} weight="semibold">Tên</Text>
              <TextInput value={name} onChange={(event) => setName(event.currentTarget.value)} />
            </Stack>

            <Stack space={2}>
              <Text size={1} weight="semibold">URL nguồn</Text>
              <TextArea rows={4} value={urls} onChange={(event) => setUrls(event.currentTarget.value)} />
            </Stack>

            {error ? (
              <Card tone="critical" padding={3} radius={2}>
                <Text size={1}>{error}</Text>
              </Card>
            ) : null}

            {status ? (
              <Card tone="default" padding={3} radius={2}>
                <Text size={1}>{status}</Text>
              </Card>
            ) : null}

            {result ? (
              <Card tone={result.ok === false ? 'critical' : result.validator?.ok ? 'positive' : 'caution'} padding={3} radius={2}>
                <Stack space={3}>
                  <Text size={1} weight="semibold">{resultSummary(result)}</Text>
                  {resultError(result) ? (
                    <Text size={1}>Lỗi ghi draft: {resultError(result)}</Text>
                  ) : null}
                  <Text size={1}>Doc: {result.docId || 'dry-run'}</Text>
                  <Text size={1}>Trạng thái ghi: {result.write?.success === false ? 'thất bại' : result.write?.success ? 'thành công' : 'dry-run'}</Text>
                  <Text size={1}>Fetch: {result.report?.fetchAdapter || '—'} ({result.report?.credits ?? 0} credits)</Text>
                  <Text size={1}>AI: {result.report?.provider || '—'}</Text>
                  <Text size={1}>Ảnh chính: {result.report?.imageRef || result.report?.imageCandidate || '—'}</Text>
                  <Text size={1}>Ảnh đã upload: {result.report?.imageUploadCount ?? 0}</Text>
                  <Text size={1}>Ảnh vào gallery: {result.report?.galleryImageCount ?? 0}</Text>
                  <Text size={1} style={{ overflowWrap: 'anywhere' }}>Ảnh ứng viên đầu tiên: {result.report?.htmlImageCandidate || '—'}</Text>
                  <Text size={1}>Đã điền: {(result.fields?.filled || []).join(', ') || '—'}</Text>
                  <Text size={1}>Thiếu: {(result.fields?.missing || []).join(', ') || '—'}</Text>
                  <Text size={1}>Ảnh ứng viên HTML: {result.imageCandidates?.length || 0}</Text>
                  {topImageCandidates(result).map((image: any, index: number) => (
                    <Text key={`${image.url}-${index}`} size={1} style={{ overflowWrap: 'anywhere' }}>{index + 1}. {image.url}{image.alt ? ` - ${image.alt}` : ''}</Text>
                  ))}
                  {(result.warnings || []).slice(0, 5).map((warning: string) => (
                    <Text key={warning} size={1}>- {warning}</Text>
                  ))}
                  {(result.validator?.warnings || []).slice(0, 5).map((warning: string) => (
                    <Text key={warning} size={1}>- {warning}</Text>
                  ))}
                </Stack>
              </Card>
            ) : null}

            <Flex gap={3}>
              <Button
                text={loading ? 'Đang chạy...' : 'Dry-run'}
                mode="ghost"
                disabled={loading}
                onClick={() => run(true)}
              />
              <Button
                text={loading ? 'Đang chạy...' : 'Tạo draft'}
                tone="primary"
                disabled={loading}
                onClick={() => run(false)}
              />
            </Flex>
          </Stack>
        </Box>
      ),
    },
  }
}
