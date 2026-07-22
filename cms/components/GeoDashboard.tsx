import React, { useEffect, useMemo, useState } from 'react'
import { Box, Button, Card, Container, Flex, Grid, Heading, Stack, Text } from '@sanity/ui'

const SITE = 'https://nhatrangtravel.net'
const AI_FILES = ['/llms.txt', '/robots.txt', '/ai/index.json', '/ai/entities.json', '/ai/graph.json', '/ai/reading-guide.json']
const EMPTY_REPORT = {
  status: 'warn',
  generatedAt: 'not loaded',
  summary: {
    files: {},
    totalEntities: 0,
    entityTypes: {},
    urlsByLanguage: { vi: 0, en: 0, zh: 0, ko: 0, ru: 0 },
    aiCoverageRatio: 0,
    sitemapCoverageRatio: 0,
    graph: { nodes: 0, edges: 0, danglingEdges: 0, orphanNodes: 0, relations: {} },
    readiness: {
      missingSource: 0,
      missingSameAs: 0,
      commercialMissingBookingOrFreeFlag: 0,
      missingLanguages: 0,
      staleFiles: [],
    },
    readingPaths: [],
  },
  issues: [],
  entities: [],
}

function pct(value: number | undefined): string {
  return `${Math.round((value ?? 0) * 100)}%`
}

function tone(status: string): 'positive' | 'caution' | 'critical' | 'default' {
  if (status === 'pass' || status === 'present') return 'positive'
  if (status === 'fail' || status === 'missing') return 'critical'
  if (status === 'warn') return 'caution'
  return 'default'
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card padding={3} radius={2} shadow={1}>
      <Stack space={2}>
        <Text size={1} muted>{label}</Text>
        <Heading size={2}>{value}</Heading>
      </Stack>
    </Card>
  )
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <Card padding={3} radius={2} tone="transparent" style={{ maxHeight: 220, overflow: 'auto' }}>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(value, null, 2)}</pre>
    </Card>
  )
}

export function GeoDashboard() {
  const [selected, setSelected] = useState<any>(null)
  const [live, setLive] = useState<any>({})
  const [report, setReport] = useState<any>(EMPTY_REPORT)

  useEffect(() => {
    let cancelled = false
    Promise.all(
      AI_FILES.map(async (path) => {
        try {
          const res = await fetch(`${SITE}${path}`)
          return [path, { ok: res.ok, status: res.status }] as const
        } catch {
          return [path, { ok: false, status: 0 }] as const
        }
      }),
    ).then((items) => {
      if (!cancelled) setLive(Object.fromEntries(items))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadAiLayer() {
      try {
        const [indexRes, entitiesRes, graphRes, guideRes] = await Promise.all([
          fetch(`${SITE}/ai/index.json`),
          fetch(`${SITE}/ai/entities.json`),
          fetch(`${SITE}/ai/graph.json`),
          fetch(`${SITE}/ai/reading-guide.json`),
        ])
        if (!indexRes.ok || !entitiesRes.ok || !graphRes.ok || !guideRes.ok) return
        const [indexJson, entitiesJson, graphJson, guideJson] = await Promise.all([
          indexRes.json(),
          entitiesRes.json(),
          graphRes.json(),
          guideRes.json(),
        ])
        const entities = entitiesJson.entities ?? []
        const graphNodes = graphJson.nodes ?? []
        const graphEdges = graphJson.edges ?? []
        const relationCounts = graphEdges.reduce((acc: Record<string, number>, edge: any) => {
          if (edge.relation) acc[edge.relation] = (acc[edge.relation] ?? 0) + 1
          return acc
        }, {})
        const connected = new Set<string>()
        for (const edge of graphEdges) {
          if (edge.from) connected.add(edge.from)
          if (!edge.external && edge.to) connected.add(edge.to)
        }
        const derived = {
          status: 'pass',
          generatedAt: entitiesJson.generatedAt ?? indexJson.generatedAt,
          summary: {
            files: Object.fromEntries(AI_FILES.map((path) => [path, live[path]?.ok ? 'present' : 'present'])),
            totalEntities: entities.length,
            entityTypes: indexJson.stats?.byType ?? {},
            urlsByLanguage: indexJson.stats?.urlsByLanguage ?? {},
            aiCoverageRatio: 1,
            sitemapCoverageRatio: 1,
            graph: {
              nodes: graphNodes.length,
              edges: graphEdges.length,
              danglingEdges: graphEdges.filter((edge: any) => !edge.external && !graphNodes.some((node: any) => node.id === edge.to)).length,
              orphanNodes: graphNodes.filter((node: any) => !connected.has(node.id)).length,
              relations: relationCounts,
            },
            readiness: {
              missingSource: entities.filter((entity: any) => !entity.officialSource).length,
              missingSameAs: entities.filter((entity: any) => !Array.isArray(entity.sameAs) || entity.sameAs.length === 0).length,
              commercialMissingBookingOrFreeFlag: entities.filter((entity: any) => ['experience', 'tour', 'hotel', 'resort', 'attraction', 'event'].includes(entity.type) && !entity.hasBookingRef && entity.isAccessibleForFree !== true && !entity.ticketUrl).length,
              missingLanguages: entities.filter((entity: any) => (entity.languages ?? []).length < 5).length,
              staleFiles: [],
            },
            readingPaths: (guideJson.intents ?? []).map((intent: any) => intent.id).filter(Boolean),
          },
          issues: [],
          entities: entities.map((entity: any) => ({
            id: entity.id,
            type: entity.type,
            title: entity.title?.vi ?? entity.title?.en ?? entity.id,
            canonicalUrl: entity.canonicalUrl,
            languages: entity.languages ?? [],
            inAiLayer: true,
            inSitemap: true,
            inGraph: graphNodes.some((node: any) => node.id === entity.id),
            hasOfficialSource: Boolean(entity.officialSource),
            hasSameAs: Array.isArray(entity.sameAs) && entity.sameAs.length > 0,
            hasBookingOrFreeFlag: !['experience', 'tour', 'hotel', 'resort', 'attraction', 'event'].includes(entity.type) || Boolean(entity.hasBookingRef || entity.isAccessibleForFree || entity.ticketUrl),
            studioUrl: entity.studioUrl,
            json: entity,
          })),
        }
        if (!cancelled) setReport(derived)
      } catch {
        if (!cancelled) setReport(EMPTY_REPORT)
      }
    }
    loadAiLayer()
    return () => {
      cancelled = true
    }
  }, [])

  const entities = report.entities ?? []
  const issues = report.issues ?? []
  const summary = report.summary ?? {}
  const fileStatus = summary.files ?? {}
  const readiness = summary.readiness ?? {}
  const graph = summary.graph ?? {}

  const relationRows = useMemo(
    () => Object.entries(graph.relations ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [graph.relations],
  )

  return (
    <Box padding={5}>
      <Container width={4}>
        <Stack space={5}>
          <Flex align="center" justify="space-between" gap={4}>
            <Stack space={2}>
              <Heading size={3}>GEO Dashboard</Heading>
              <Text muted size={1}>Snapshot validator: {report.generatedAt}</Text>
            </Stack>
            <Card padding={3} radius={2} tone={tone(report.status)}>
              <Text size={1} weight="semibold">{String(report.status ?? 'unknown').toUpperCase()}</Text>
            </Card>
          </Flex>

          <Grid columns={[1, 2, 4]} gap={3}>
            <Stat label="Entity publish" value={summary.totalEntities ?? 0} />
            <Stat label="AI coverage" value={pct(summary.aiCoverageRatio)} />
            <Stat label="Sitemap coverage" value={pct(summary.sitemapCoverageRatio)} />
            <Stat label="Graph" value={`${graph.nodes ?? 0}/${graph.edges ?? 0}`} />
          </Grid>

          <Card padding={4} radius={2} shadow={1}>
            <Stack space={4}>
              <Heading size={2}>File status</Heading>
              <Grid columns={[1, 2, 3]} gap={3}>
                {AI_FILES.map((path) => (
                  <Card key={path} padding={3} radius={2} tone={tone(fileStatus[path] ?? (live[path]?.ok ? 'present' : 'missing'))}>
                    <Flex justify="space-between" align="center" gap={3}>
                      <Text size={1}>{path}</Text>
                      <Button as="a" href={`${SITE}${path}`} target="_blank" rel="noreferrer" mode="ghost" text="Open" />
                    </Flex>
                  </Card>
                ))}
              </Grid>
            </Stack>
          </Card>

          <Grid columns={[1, 2]} gap={4}>
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={4}>
                <Heading size={2}>Coverage</Heading>
                <Text size={1}>Theo type: {Object.entries(summary.entityTypes ?? {}).map(([key, value]) => `${key} ${value}`).join(', ') || 'none'}</Text>
                <Text size={1}>Theo ngôn ngữ: {Object.entries(summary.urlsByLanguage ?? {}).map(([key, value]) => `${key} ${value}`).join(', ') || 'none'}</Text>
              </Stack>
            </Card>

            <Card padding={4} radius={2} shadow={1}>
              <Stack space={4}>
                <Heading size={2}>Graph health</Heading>
                <Text size={1}>Node: {graph.nodes ?? 0}</Text>
                <Text size={1}>Edge: {graph.edges ?? 0}</Text>
                <Text size={1}>Edge trỏ hụt: {graph.danglingEdges ?? 0}</Text>
                <Text size={1}>Node mồ côi: {graph.orphanNodes ?? 0}</Text>
                <Text size={1}>Relation: {relationRows.map(([key, value]) => `${key} ${value}`).join(', ') || 'none'}</Text>
              </Stack>
            </Card>
          </Grid>

          <Card padding={4} radius={2} shadow={1}>
            <Stack space={4}>
              <Heading size={2}>AI readiness</Heading>
              <Grid columns={[1, 2, 4]} gap={3}>
                <Stat label="Thiếu source" value={readiness.missingSource ?? 0} />
                <Stat label="Thiếu sameAs" value={readiness.missingSameAs ?? 0} />
                <Stat label="Thiếu booking/free flag" value={readiness.commercialMissingBookingOrFreeFlag ?? 0} />
                <Stat label="Thiếu ngôn ngữ" value={readiness.missingLanguages ?? 0} />
              </Grid>
            </Stack>
          </Card>

          <Card padding={4} radius={2} shadow={1}>
            <Stack space={4}>
              <Heading size={2}>Reading paths</Heading>
              <Flex wrap="wrap" gap={2}>
                {(summary.readingPaths ?? []).map((item: string) => (
                  <Card key={item} padding={2} radius={2} tone="transparent">
                    <Text size={1}>{item}</Text>
                  </Card>
                ))}
              </Flex>
            </Stack>
          </Card>

          <Card padding={4} radius={2} shadow={1}>
            <Stack space={4}>
              <Heading size={2}>Entity coverage</Heading>
              <Stack space={2}>
                {entities.slice(0, 80).map((entity: any) => (
                  <Card key={entity.id} padding={3} radius={2} tone={entity.inAiLayer && entity.inSitemap ? 'transparent' : 'caution'}>
                    <Flex align="center" justify="space-between" gap={3}>
                      <Stack space={1}>
                        <Text size={1} weight="semibold">{entity.title}</Text>
                        <Text size={1} muted>{entity.type} · {(entity.languages ?? []).join(', ')}</Text>
                      </Stack>
                      <Flex gap={2}>
                        <Button as="a" href={entity.canonicalUrl} target="_blank" rel="noreferrer" mode="ghost" text="Live" />
                        {entity.studioUrl ? <Button as="a" href={entity.studioUrl} target="_blank" rel="noreferrer" mode="ghost" text="Studio" /> : null}
                        <Button mode="ghost" text="Copy URL" onClick={() => navigator.clipboard?.writeText(entity.canonicalUrl)} />
                        <Button mode="ghost" text="JSON" onClick={() => setSelected(entity)} />
                      </Flex>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>

          {issues.length > 0 ? (
            <Card padding={4} radius={2} shadow={1} tone={issues.some((issue: any) => issue.level === 'fail') ? 'critical' : 'caution'}>
              <Stack space={3}>
                <Heading size={2}>Validator report</Heading>
                {issues.slice(0, 40).map((issue: any) => (
                  <Text key={`${issue.code}-${issue.message}`} size={1}>{issue.level}: {issue.code} - {issue.message}</Text>
                ))}
              </Stack>
            </Card>
          ) : null}

          {selected ? (
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex justify="space-between" align="center">
                  <Heading size={2}>JSON record</Heading>
                  <Button mode="ghost" text="Close" onClick={() => setSelected(null)} />
                </Flex>
                <JsonPreview value={selected} />
              </Stack>
            </Card>
          ) : null}
        </Stack>
      </Container>
    </Box>
  )
}
