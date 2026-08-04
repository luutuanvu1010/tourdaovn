import React, { useEffect, useState, useCallback } from 'react'
import { Card, Stack, Text, Badge, Flex, Button, Spinner } from '@sanity/ui'
import { useClient, useFormValue } from 'sanity'
import { LaunchIcon } from '@sanity/icons'

/**
 * Hiển thị chuỗi phân cấp thật của một địa danh, đọc ngược lên gốc rồi xuống con.
 * Ví dụ: Tỉnh Khánh Hoà → Phường Nha Trang → Hòn Mun → (trải nghiệm: Lặn biển).
 *
 * Chỉ đọc, không lưu field nào (P6: chiều ngược suy ở build bằng GROQ, không lưu hai đầu).
 */

interface Node {
  _id: string
  _type: string
  title: string
  placeType?: string
  parentRef?: string
}

const PLACE_TYPE_LABEL: Record<string, string> = {
  province: 'Tỉnh',
  ward: 'Phường',
  commune: 'Xã',
  island: 'Đảo',
  beach: 'Bãi biển',
  landform: 'Địa hình',
  area: 'Khu vực',
}

const TYPE_LABEL: Record<string, string> = {
  place: 'Địa danh',
  touristDestination: 'Điểm đến',
  attraction: 'Điểm tham quan',
  experience: 'Trải nghiệm',
  hotel: 'Khách sạn',
  resort: 'Resort',
  restaurant: 'Nhà hàng',
}

const bare = (id: string) => String(id || '').replace(/^drafts\./, '')

export function PlaceHierarchy(_props: any) {
  const docId = useFormValue(['_id']) as string | undefined
  const client = useClient({ apiVersion: '2026-06-01' })
  const [ancestors, setAncestors] = useState<Node[]>([])
  const [children, setChildren] = useState<Node[]>([])
  const [experiences, setExperiences] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!docId) return
    setLoading(true)
    try {
      const id = bare(docId)

      // Đi ngược lên gốc, tối đa 6 cấp để không kẹt nếu dữ liệu có chu trình.
      const chain: Node[] = []
      let cursor: string | null = id
      const seen = new Set<string>([id])
      for (let i = 0; i < 6 && cursor; i++) {
        const parent: Node | null = await client.fetch(
          `*[_id == $id][0].containedInPlace->{
            _id, _type, "title": coalesce(title.vi, title.en), placeType,
            "parentRef": containedInPlace._ref
          }`,
          { id: cursor },
        )
        if (!parent?._id) break
        const pid = bare(parent._id)
        if (seen.has(pid)) break
        seen.add(pid)
        chain.unshift(parent)
        cursor = parent.parentRef ? bare(parent.parentRef) : null
      }
      setAncestors(chain)

      const kids = await client.fetch<Node[]>(
        `*[_type in ["place","attraction","hotel","resort","restaurant"]
           && containedInPlace._ref in [$id, $draftId]]{
          _id, _type, "title": coalesce(title.vi, title.en), placeType
        } | order(_type asc)`,
        { id, draftId: `drafts.${id}` },
      )
      setChildren(kids)

      const exps = await client.fetch<Node[]>(
        `*[_type == "experience" && venue._ref in [$id, $draftId]]{
          _id, _type, "title": coalesce(title.vi, title.en)
        }`,
        { id, draftId: `drafts.${id}` },
      )
      setExperiences(exps)
    } catch {
      setAncestors([])
      setChildren([])
      setExperiences([])
    } finally {
      setLoading(false)
    }
  }, [client, docId])

  useEffect(() => {
    load()
  }, [load])

  if (!docId) return <Text size={1} muted>Lưu document để xem chuỗi liên kết.</Text>

  if (loading) {
    return (
      <Flex align="center" gap={2} paddingY={2}>
        <Spinner />
        <Text size={1} muted>Đang tải chuỗi liên kết...</Text>
      </Flex>
    )
  }

  const row = (n: Node, muted = false) => (
    <Card key={n._id} padding={3} radius={2} shadow={1} tone={muted ? 'transparent' : 'default'}>
      <Flex align="center" justify="space-between" gap={3}>
        <Flex align="center" gap={2}>
          <Text size={1} weight="semibold">{n.title || '(không tên)'}</Text>
          <Badge fontSize={0} tone="primary">
            {n.placeType ? PLACE_TYPE_LABEL[n.placeType] ?? n.placeType : TYPE_LABEL[n._type] ?? n._type}
          </Badge>
        </Flex>
        <Button
          as="a"
          href={`/intent/edit/id=${n._id};type=${n._type}`}
          target="_blank"
          icon={LaunchIcon}
          mode="ghost"
          fontSize={0}
          text="Mở"
          tone="primary"
        />
      </Flex>
    </Card>
  )

  return (
    <Stack space={3} paddingY={2}>
      <Stack space={2}>
        <Text size={1} muted weight="semibold">Nằm trong (từ gốc xuống)</Text>
        {ancestors.length === 0
          ? <Text size={1} muted>Chưa có đơn vị chứa — đây là gốc, hoặc chưa điền ô "Nằm trong".</Text>
          : ancestors.map((n) => row(n, true))}
      </Stack>

      <Stack space={2}>
        <Text size={1} muted weight="semibold">Chứa trực tiếp ({children.length})</Text>
        {children.length === 0
          ? <Text size={1} muted>Chưa có địa danh hay cơ sở nào trỏ vào đây.</Text>
          : children.map((n) => row(n))}
      </Stack>

      <Stack space={2}>
        <Text size={1} muted weight="semibold">Trải nghiệm tại đây ({experiences.length})</Text>
        {experiences.length === 0
          ? <Text size={1} muted>Chưa có trải nghiệm nào chọn địa danh này làm venue.</Text>
          : experiences.map((n) => row(n))}
      </Stack>
    </Stack>
  )
}
