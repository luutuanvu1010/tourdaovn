import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Box, Button, Card, Container, Flex, Grid, Heading,
  Select, Stack, Tab, TabList, TabPanel, Text, TextArea,
  TextInput, Badge, Inline, Label, Tooltip,
} from '@sanity/ui'
import {
  CheckmarkCircleIcon, WarningOutlineIcon, ErrorOutlineIcon,
  ClockIcon, RocketIcon, CodeIcon, ActivityIcon, ChartUpwardIcon,
  LinkIcon, EarthGlobeIcon, SparklesIcon, ImageIcon, UnknownIcon,
} from '@sanity/icons'
import { synthApiHeaders, synthApiUrl } from '../lib/synthApi'
import { getScrapableTypes, getEntityLabel } from '../lib/entityTypes'

const ENTITY_TYPES = getScrapableTypes()

// ============================================================
// Types
// ============================================================

interface RunRecord {
  id: string
  timestamp: string
  entity: string
  name: string
  urls: string[]
  dryRun: boolean
  success: boolean
  docId?: string
  durationMs: number
  report: {
    fetchAdapter: string
    credits: number
    provider: string | null
    imageUploadCount: number
    galleryImageCount: number
  }
  fieldsFilled: number
  fieldsMissing: number
  validatorErrors: number
  validatorWarnings: number
  error?: string
}

interface DashboardStats {
  totalRuns: number
  successRuns: number
  failedRuns: number
  totalCredits: number
  avgCreditsPerRun: number
  scraplfyRuns: number
  directRuns: number
  providers: Record<string, number>
  imagesUploaded: number
  avgDurationMs: number
  entities: Record<string, number>
}

// ============================================================
// Helpers
// ============================================================

const HISTORY_KEY = 'synth_history'
const MAX_HISTORY = 100

function loadHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(history: RunRecord[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)))
  } catch { /* quota exceeded, silently drop oldest */ }
}

function parseUrls(value: string): string[] {
  return value.split(/\n|,/).map(s => s.trim()).filter(Boolean)
}

function computeStats(history: RunRecord[]): DashboardStats {
  const stats: DashboardStats = {
    totalRuns: history.length,
    successRuns: 0, failedRuns: 0,
    totalCredits: 0, avgCreditsPerRun: 0,
    scraplfyRuns: 0, directRuns: 0,
    providers: {}, imagesUploaded: 0,
    avgDurationMs: 0, entities: {},
  }

  let totalDuration = 0
  for (const r of history) {
    if (r.success) stats.successRuns++
    else stats.failedRuns++
    stats.totalCredits += r.report?.credits ?? 0
    stats.imagesUploaded += r.report?.imageUploadCount ?? 0
    totalDuration += r.durationMs ?? 0
    if (r.report?.fetchAdapter === 'scrapfly') stats.scraplfyRuns++
    else if (r.report?.fetchAdapter === 'direct') stats.directRuns++
    const p = r.report?.provider
    if (p) stats.providers[p] = (stats.providers[p] ?? 0) + 1
    stats.entities[r.entity] = (stats.entities[r.entity] ?? 0) + 1
  }

  if (history.length > 0) {
    stats.avgCreditsPerRun = Math.round(stats.totalCredits / history.length)
    stats.avgDurationMs = Math.round(totalDuration / history.length)
  }
  return stats
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return iso }
}

// ============================================================
// Components
// ============================================================

function StatCard({ label, value, tone = 'default' as const, icon }: {
  label: string; value: string | number; tone?: 'default' | 'positive' | 'caution' | 'critical'; icon?: React.ComponentType
}) {
  return (
    <Card padding={3} radius={2} tone={tone} style={{ minWidth: 0 }}>
      <Stack space={1}>
        <Flex align="center" gap={1}>
          {icon ? React.createElement(icon as any, { style: { width: 14, height: 14 } }) : null}
          <Text size={0} muted>{label}</Text>
        </Flex>
        <Text size={2} weight="semibold">{value}</Text>
      </Stack>
    </Card>
  )
}

function ProviderBadge({ provider }: { provider: string | null }) {
  if (!provider) return <Badge tone="default">—</Badge>
  const colors: Record<string, 'positive' | 'caution' | 'critical' | 'default'> = {
    deepseek: 'positive',
    openai: 'caution',
    anthropic: 'critical',
  }
  return <Badge tone={colors[provider] ?? 'default'}>{provider}</Badge>
}

function FetchBadge({ adapter }: { adapter: string }) {
  const isScrapfly = adapter === 'scrapfly'
  return (
    <Flex align="center" gap={2}>
      <Badge tone={isScrapfly ? 'positive' : 'default'}>
        {isScrapfly ? <EarthGlobeIcon style={{ width: 12, height: 12 }} /> : <LinkIcon style={{ width: 12, height: 12 }} />}
        {' '}{adapter}
      </Badge>
    </Flex>
  )
}

// ============================================================
// Main Component
// ============================================================

export function SynthTool() {
  const [activeTab, setActiveTab] = useState('synth')

  // Synth form state
  const [entity, setEntity] = useState<string>(ENTITY_TYPES[0] ?? 'place')
  const [name, setName] = useState('')
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<any>(null)

  // History
  const [history, setHistory] = useState<RunRecord[]>(() => loadHistory())
  const stats = useMemo(() => computeStats(history), [history])

  function clearHistory() {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  async function run(dryRun: boolean) {
    const startTime = Date.now()
    setLoading(true)
    setError('')
    setStatus('')
    setResult(null)

    const parsedUrls = parseUrls(urls)

    try {
      const res = await fetch(synthApiUrl('/synth'), {
        method: 'POST',
        headers: synthApiHeaders(),
        body: JSON.stringify({ entity, name, urls: parsedUrls, dryRun }),
      })
      const json = await res.json()
      const durationMs = Date.now() - startTime
      setStatus(`HTTP ${res.status} — ${formatMs(durationMs)}`)
      setResult(json)

      const record: RunRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        entity, name, urls: parsedUrls, dryRun,
        success: json.ok !== false && json.write?.success !== false,
        docId: json.docId,
        durationMs,
        report: json.report ?? {},
        fieldsFilled: json.fields?.filled?.length ?? 0,
        fieldsMissing: json.fields?.missing?.length ?? 0,
        validatorErrors: json.validator?.errors?.length ?? 0,
        validatorWarnings: json.validator?.warnings?.length ?? 0,
        error: json?.write?.error || json?.error || undefined,
      }

      const updated = [...history, record]
      setHistory(updated)
      saveHistory(updated)

      if (!res.ok || json.ok === false) {
        setError(json?.write?.error || json?.error || `HTTP ${res.status}`)
      }
    } catch (err: any) {
      const durationMs = Date.now() - startTime
      setError(err?.message || 'Cào dữ liệu thất bại')
      const record: RunRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        entity, name, urls: parsedUrls, dryRun,
        success: false, durationMs,
        report: { fetchAdapter: '—', credits: 0, provider: null, imageUploadCount: 0, galleryImageCount: 0 },
        fieldsFilled: 0, fieldsMissing: 0,
        validatorErrors: 0, validatorWarnings: 0,
        error: err?.message,
      }
      const updated = [...history, record]
      setHistory(updated)
      saveHistory(updated)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // Render: Tab Synth
  // ============================================================
  function renderSynthTab() {
    return (
      <Stack space={4}>
        <Stack space={2}>
          <Text size={1} weight="semibold">Loại dữ liệu</Text>
          <Select value={entity} onChange={(event) => setEntity(event.currentTarget.value)}>
            {ENTITY_TYPES.map(type => (
              <option key={type} value={type}>{getEntityLabel(type)}</option>
            ))}
          </Select>
        </Stack>

        <Stack space={2}>
          <Text size={1} weight="semibold">Tên</Text>
          <TextInput value={name} onChange={(event) => setName(event.currentTarget.value)}
            placeholder="Tên điểm đến, nhà hàng..." />
        </Stack>

        <Stack space={2}>
          <Text size={1} weight="semibold">URL nguồn (mỗi dòng hoặc cách nhau dấu phẩy)</Text>
          <TextArea rows={5} value={urls} onChange={(event) => setUrls(event.currentTarget.value)}
            placeholder="https://vi.wikipedia.org/wiki/..." />
        </Stack>

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

        {status ? (
          <Card tone="positive" padding={3} radius={2}>
            <Text size={1}>{status}</Text>
          </Card>
        ) : null}

        {error ? (
          <Card tone="critical" padding={3} radius={2}>
            <Text size={1}>{error}</Text>
          </Card>
        ) : null}

        {result ? (
          <Card tone={result.ok === false ? 'critical' : result.validator?.ok ? 'positive' : 'caution'}
            padding={4} radius={2} border>
            <Stack space={4}>
              {/* Header */}
              <Flex align="center" justify="space-between">
                <Text size={1} weight="semibold">Kết quả</Text>
                <Badge tone={result.ok === false ? 'critical' : 'positive'}>
                  {result.ok === false ? 'Thất bại' : 'Thành công'}
                </Badge>
              </Flex>

              {/* Doc info */}
              <Grid columns={[2, 2, 2]} gap={2}>
                <StatCard label="Document ID" value={result.docId || 'dry-run'}
                  icon={CodeIcon} />
                <StatCard label="Trạng thái ghi" value={
                  result.write?.success === false ? 'Thất bại'
                    : result.write?.success ? 'Thành công'
                    : 'Dry-run'
                } icon={result.write?.success ? CheckmarkCircleIcon : UnknownIcon}
                  tone={result.write?.success ? 'positive' : 'default'} />
              </Grid>

              {/* Tool usage */}
              <Card padding={3} radius={2} tone="default">
                <Stack space={2}>
                  <Text size={0} weight="semibold" muted>CÔNG CỤ & TOKEN</Text>
                  <Grid columns={[2, 2, 3]} gap={2}>
                    <Flex align="center" gap={2}>
                      <Text size={1} muted>Fetch:</Text>
                      <FetchBadge adapter={result.report?.fetchAdapter || '—'} />
                    </Flex>
                    <Flex align="center" gap={2}>
                      <Text size={1} muted>Credits:</Text>
                      <Badge tone="default">{result.report?.credits ?? 0}</Badge>
                    </Flex>
                    <Flex align="center" gap={2}>
                      <Text size={1} muted>AI:</Text>
                      <ProviderBadge provider={result.report?.provider} />
                    </Flex>
                  </Grid>
                </Stack>
              </Card>

              {/* LLM Sources */}
              <Card padding={3} radius={2} tone="default">
                <Stack space={2}>
                  <Text size={0} weight="semibold" muted>NGUỒN DỮ LIỆU</Text>
                  <Grid columns={[2, 2, 3]} gap={1}>
                    <Text size={1} muted>Geo: {result.report?.geoSource || '—'}</Text>
                    <Text size={1} muted>SameAs: {result.report?.sameAsSource || '—'}</Text>
                    <Text size={1} muted>OfficialSource: {result.report?.officialSourceSource || '—'}</Text>
                    <Text size={1} muted>Address: {result.report?.addressSource || '—'}</Text>
                    <Text size={1} muted>ContainedInPlace: {result.report?.containedInPlaceSource || '—'}</Text>
                  </Grid>
                </Stack>
              </Card>

              {/* Fields */}
              <Card padding={3} radius={2} tone="default">
                <Stack space={2}>
                  <Text size={0} weight="semibold" muted>FIELD ĐÃ ĐIỀN & THIẾU</Text>
                  <Flex gap={2} wrap="wrap">
                    {(result.fields?.filled || []).map((f: string) => (
                      <Badge key={f} tone="positive">{f}</Badge>
                    ))}
                    {(result.fields?.missing || []).map((f: string) => (
                      <Badge key={f} tone="critical">{f}</Badge>
                    ))}
                  </Flex>
                </Stack>
              </Card>

              {/* Images */}
              <Card padding={3} radius={2} tone="default">
                <Stack space={2}>
                  <Text size={0} weight="semibold" muted>ẢNH</Text>
                  <Grid columns={[2, 2, 3]} gap={1}>
                    <Text size={1} muted>Ảnh chính: {result.report?.imageRef || result.report?.imageCandidate || '—'}</Text>
                    <Text size={1} muted>Đã upload: {result.report?.imageUploadCount ?? 0}</Text>
                    <Text size={1} muted>Vào gallery: {result.report?.galleryImageCount ?? 0}</Text>
                  </Grid>
                  {result.report?.htmlImageCandidate ? (
                    <Text size={1} muted style={{ overflowWrap: 'anywhere' }}>
                      HTML candidate: {result.report.htmlImageCandidate}
                    </Text>
                  ) : null}
                </Stack>
              </Card>

              {/* Validator */}
              <Card padding={3} radius={2}
                tone={result.validator?.ok ? 'positive' : result.validator?.errors?.length > 0 ? 'critical' : 'caution'}>
                <Stack space={2}>
                  <Text size={0} weight="semibold" muted>
                    VALIDATOR ({result.validator?.errors?.length ?? 0} lỗi, {result.validator?.warnings?.length ?? 0} cảnh báo)
                  </Text>
                  {(result.validator?.errors || []).map((e: string, i: number) => (
                    <Flex key={`err-${i}`} gap={2} align="flex-start">
                      <ErrorOutlineIcon style={{ width: 14, height: 14, color: 'var(--card-badge-critical-icon-color)', flexShrink: 0, marginTop: 2 }} />
                      <Text size={1}>{e}</Text>
                    </Flex>
                  ))}
                  {(result.validator?.warnings || []).slice(0, 8).map((w: string, i: number) => (
                    <Flex key={`warn-${i}`} gap={2} align="flex-start">
                      <WarningOutlineIcon style={{ width: 14, height: 14, color: 'var(--card-badge-caution-icon-color)', flexShrink: 0, marginTop: 2 }} />
                      <Text size={1}>{w}</Text>
                    </Flex>
                  ))}
                  {(result.warnings || []).slice(0, 5).map((w: string, i: number) => (
                    <Flex key={`rw-${i}`} gap={2} align="flex-start">
                      <WarningOutlineIcon style={{ width: 14, height: 14, color: 'var(--card-badge-caution-icon-color)', flexShrink: 0, marginTop: 2 }} />
                      <Text size={1}>{w}</Text>
                    </Flex>
                  ))}
                </Stack>
              </Card>
            </Stack>
          </Card>
        ) : null}
      </Stack>
    )
  }

  // ============================================================
  // Render: Tab Lịch sử
  // ============================================================
  function renderHistoryTab() {
    if (history.length === 0) {
      return (
        <Card padding={5} radius={2} tone="default">
          <Stack space={3} style={{ textAlign: 'center' }}>
            <ClockIcon style={{ width: 32, height: 32, opacity: 0.3 }} />
            <Text size={1} muted>Chưa có lần cào nào. Chạy Dry-run hoặc Tạo draft để bắt đầu.</Text>
          </Stack>
        </Card>
      )
    }

    const recent = [...history].reverse().slice(0, 20)

    return (
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">{history.length} lần chạy (hiển thị {recent.length} gần nhất)</Text>
          <Button text="Xóa lịch sử" mode="ghost" tone="critical" fontSize={0}
            onClick={clearHistory} />
        </Flex>

        {recent.map((r) => (
          <Card key={r.id} padding={3} radius={2} tone={r.success ? 'default' : 'critical'} border>
            <Stack space={2}>
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={2}>
                  <Badge tone={r.success ? 'positive' : 'critical'}>{r.entity}</Badge>
                  <Text size={1} weight="semibold">{r.name || '(không tên)'}</Text>
                  {r.dryRun ? <Badge tone="caution">dry-run</Badge> : null}
                </Flex>
                <Text size={0} muted>{formatTime(r.timestamp)}</Text>
              </Flex>

              <Grid columns={[2, 3, 4]} gap={2}>
                <Flex align="center" gap={1}>
                  <Text size={0} muted>Duration:</Text>
                  <Text size={0}>{formatMs(r.durationMs)}</Text>
                </Flex>
                <Flex align="center" gap={1}>
                  <Text size={0} muted>Fetch:</Text>
                  <Text size={0}>{r.report?.fetchAdapter || '—'}</Text>
                </Flex>
                <Flex align="center" gap={1}>
                  <Text size={0} muted>Credits:</Text>
                  <Text size={0}>{r.report?.credits ?? 0}</Text>
                </Flex>
                <Flex align="center" gap={1}>
                  <Text size={0} muted>Fields:</Text>
                  <Text size={0}>{r.fieldsFilled}/{r.fieldsFilled + r.fieldsMissing}</Text>
                </Flex>
              </Grid>

              {r.error ? (
                <Text size={0} style={{ color: 'var(--card-badge-critical-fg-color)' }}>Lỗi: {r.error}</Text>
              ) : null}
            </Stack>
          </Card>
        ))}
      </Stack>
    )
  }

  // ============================================================
  // Render: Tab Dashboard
  // ============================================================
  function renderDashboardTab() {
    if (history.length === 0) {
      return (
        <Card padding={5} radius={2} tone="default">
          <Stack space={3} style={{ textAlign: 'center' }}>
            <ChartUpwardIcon style={{ width: 32, height: 32, opacity: 0.3 }} />
            <Text size={1} muted>Chưa có dữ liệu để thống kê.</Text>
          </Stack>
        </Card>
      )
    }

    return (
      <Stack space={5}>
        {/* Top-level stats */}
        <Grid columns={[2, 3, 4]} gap={3}>
          <StatCard label="Tổng số lần chạy" value={stats.totalRuns} icon={ActivityIcon} />
          <StatCard label="Thành công" value={`${stats.successRuns} (${Math.round(stats.successRuns / stats.totalRuns * 100)}%)`}
            icon={CheckmarkCircleIcon} tone="positive" />
          <StatCard label="Thất bại" value={`${stats.failedRuns} (${Math.round(stats.failedRuns / stats.totalRuns * 100)}%)`}
            icon={ErrorOutlineIcon} tone={stats.failedRuns > 0 ? 'critical' : 'default'} />
          <StatCard label="TB duration" value={formatMs(stats.avgDurationMs)} icon={ClockIcon} />
        </Grid>

        {/* Credits & tools */}
        <Grid columns={[2, 3, 3]} gap={3}>
          <StatCard label="Tổng credits" value={stats.totalCredits} icon={CodeIcon} />
          <StatCard label="TB credits/lần" value={stats.avgCreditsPerRun} icon={ChartUpwardIcon} />
          <StatCard label="Ảnh đã upload" value={stats.imagesUploaded} icon={ImageIcon} />
        </Grid>

        {/* Scrapfly vs Direct */}
        <Card padding={4} radius={2} tone="default" border>
          <Stack space={3}>
            <Text size={1} weight="semibold">FETCH ADAPTER</Text>
            <Grid columns={[2, 2, 2]} gap={3}>
              <Flex align="center" gap={2}>
                <EarthGlobeIcon style={{ width: 16, height: 16 }} />
                <Stack space={0}>
                  <Text size={2} weight="semibold">{stats.scraplfyRuns}</Text>
                  <Text size={0} muted>Scrapfly</Text>
                </Stack>
              </Flex>
              <Flex align="center" gap={2}>
                <LinkIcon style={{ width: 16, height: 16 }} />
                <Stack space={0}>
                  <Text size={2} weight="semibold">{stats.directRuns}</Text>
                  <Text size={0} muted>Direct fetch</Text>
                </Stack>
              </Flex>
            </Grid>
          </Stack>
        </Card>

        {/* LLM Provider breakdown */}
        <Card padding={4} radius={2} tone="default" border>
          <Stack space={3}>
            <Text size={1} weight="semibold">LLM PROVIDER</Text>
            <Grid columns={[2, 3, 3]} gap={3}>
              {Object.entries(stats.providers).map(([provider, count]) => (
                <Flex key={provider} align="center" gap={2}>
                  <SparklesIcon style={{ width: 16, height: 16 }} />
                  <Stack space={0}>
                    <Text size={2} weight="semibold">{count}</Text>
                    <Text size={0} muted>{provider}</Text>
                  </Stack>
                </Flex>
              ))}
              {Object.keys(stats.providers).length === 0 ? (
                <Text size={0} muted>Chưa có dữ liệu</Text>
              ) : null}
            </Grid>
          </Stack>
        </Card>

        {/* Entity breakdown */}
        <Card padding={4} radius={2} tone="default" border>
          <Stack space={3}>
            <Text size={1} weight="semibold">ENTITY TYPE</Text>
            <Grid columns={[2, 3, 4]} gap={2}>
              {Object.entries(stats.entities)
                .sort(([, a], [, b]) => b - a)
                .map(([ent, count]) => (
                <Flex key={ent} align="center" gap={2}>
                  <Badge tone="default">{getEntityLabel(ent)}</Badge>
                  <Text size={1} weight="semibold">{count}</Text>
                </Flex>
              ))}
            </Grid>
          </Stack>
        </Card>
      </Stack>
    )
  }

  // ============================================================
  // Main render
  // ============================================================
  return (
    <Box padding={5}>
      <Container width={3}>
        <Stack space={5}>
          <Stack space={2}>
            <Heading size={2}>Cào dữ liệu</Heading>
            <Text muted size={1}>
              Nhập tên và URL nguồn để dry-run hoặc tạo draft trong Sanity.
              Tab Giám sát hiển thị thống kê lịch sử.
            </Text>
          </Stack>

          {/* Tab bar */}
          <TabList space={2}>
            <Tab id="synth" label="Cào dữ liệu" aria-controls="synth-panel"
              selected={activeTab === 'synth'} onClick={() => setActiveTab('synth')} />
            <Tab id="history" label={`Lịch sử (${history.length})`} aria-controls="history-panel"
              selected={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            <Tab id="dashboard" label="Giám sát" aria-controls="dashboard-panel"
              selected={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          </TabList>

          {/* Tab panels */}
          <TabPanel id="synth-panel" aria-labelledby="synth" hidden={activeTab !== 'synth'}>
            {activeTab === 'synth' ? (
              <Card padding={4} radius={2} shadow={1}>
                {renderSynthTab()}
              </Card>
            ) : null}
          </TabPanel>

          <TabPanel id="history-panel" aria-labelledby="history" hidden={activeTab !== 'history'}>
            {activeTab === 'history' ? renderHistoryTab() : null}
          </TabPanel>

          <TabPanel id="dashboard-panel" aria-labelledby="dashboard" hidden={activeTab !== 'dashboard'}>
            {activeTab === 'dashboard' ? renderDashboardTab() : null}
          </TabPanel>
        </Stack>
      </Container>
    </Box>
  )
}
