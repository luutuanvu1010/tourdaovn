import React, { useEffect, useState, useCallback } from 'react'
import { Card, Stack, Text, Badge, Flex, Button, Spinner } from '@sanity/ui'
import { useClient, useFormValue } from 'sanity'
import { LaunchIcon } from '@sanity/icons'

interface ExpRef {
  _id: string
  title: string
  experienceType: string
  reviewStatus: string
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  inReview: 'Đang duyệt',
  approved: 'Đã duyệt',
}

const STATUS_TONE: Record<string, 'default' | 'positive' | 'caution' | 'critical'> = {
  draft: 'default',
  inReview: 'caution',
  approved: 'positive',
}

export function IncomingExperiences(_props: any) {
  const docId = useFormValue(['_id']) as string | undefined
  const client = useClient({ apiVersion: '2026-06-01' })
  const [items, setItems] = useState<ExpRef[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRefs = useCallback(async () => {
    if (!docId) return
    setLoading(true)
    try {
      const result = await client.fetch<ExpRef[]>(
        `*[_type == "experience" && venue._ref == $id]{
          _id,
          "title": coalesce(title.vi, title.en),
          "experienceType": coalesce(experienceType->name.vi, experienceType->name.en),
          reviewStatus
        }`,
        { id: docId },
      )
      setItems(result)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [client, docId])

  useEffect(() => {
    fetchRefs()
  }, [fetchRefs])

  if (!docId) {
    return <Text size={1} muted>Lưu document để xem trải nghiệm liên kết.</Text>
  }

  if (loading) {
    return (
      <Flex align="center" gap={2} paddingY={2}>
        <Spinner />
        <Text size={1} muted>Đang tải...</Text>
      </Flex>
    )
  }

  if (items.length === 0) {
    return (
      <Stack paddingY={3} space={2}>
        <Text size={1} muted>
          Chưa có trải nghiệm nào trỏ tới địa danh này.
        </Text>
        <Text size={1} muted>
          Vào menu Trải nghiệm → tạo mới, chọn venue là địa danh này.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack space={2} paddingY={2}>
      {items.map((item) => (
        <Card key={item._id} padding={3} radius={2} shadow={1} tone={item.reviewStatus === 'approved' ? 'positive' : 'default'}>
          <Flex align="center" justify="space-between" gap={3}>
            <Stack space={1}>
              <Text size={1} weight="semibold">{item.title || '(không tên)'}</Text>
              <Flex align="center" gap={2}>
                <Badge tone={item.experienceType ? 'primary' : 'default'} fontSize={0}>
                  {item.experienceType || '—'}
                </Badge>
                <Badge tone={STATUS_TONE[item.reviewStatus] ?? 'default'} fontSize={0}>
                  {STATUS_LABEL[item.reviewStatus] ?? item.reviewStatus}
                </Badge>
              </Flex>
            </Stack>
            <Button
              as="a"
              href={`/intent/edit/id=${item._id};type=experience`}
              target="_blank"
              icon={LaunchIcon}
              mode="ghost"
              fontSize={0}
              text="Sửa"
              tone="primary"
            />
          </Flex>
        </Card>
      ))}
    </Stack>
  )
}
