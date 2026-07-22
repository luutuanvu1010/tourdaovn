import React, { useRef, useState } from 'react'
import { Box, Button, Card, Flex, Stack, Text, useToast } from '@sanity/ui'
import { ImagesIcon, UploadIcon } from '@sanity/icons'
import { DEFAULT_STUDIO_CLIENT_OPTIONS, PatchEvent, insert, set, useClient, useFormValue } from 'sanity'

const MAX_GALLERY_IMAGES = 30

function newKey() {
  return Math.random().toString(36).slice(2, 12)
}

function baseAlt(title: unknown) {
  if (title && typeof title === 'object' && typeof (title as Record<string, unknown>).vi === 'string') {
    return `${(title as Record<string, string>).vi} - Anh Nha Trang Travel`
  }
  return 'Anh Nha Trang Travel'
}

export function BulkGalleryInput(props: any) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const title = useFormValue(['title'])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  const currentItems = Array.isArray(props.value) ? props.value : []
  const remaining = Math.max(0, MAX_GALLERY_IMAGES - currentItems.length)

  async function uploadFiles(files: File[]) {
    if (!files.length || uploading || remaining <= 0) return

    const selected = files.slice(0, remaining)
    setUploading(true)
    const uploadedItems = []
    const failedFiles = []
    try {
      for (const file of selected) {
        try {
          const asset = await client.assets.upload('image', file, { filename: file.name })
          uploadedItems.push({
            _key: newKey(),
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
            alt: baseAlt(title),
          })
        } catch (err) {
          failedFiles.push(file.name)
        }
      }

      if (uploadedItems.length) {
        props.onChange(PatchEvent.from(
          currentItems.length > 0
            ? insert(uploadedItems, 'after', [-1])
            : set(uploadedItems)
        ))
      }
      toast.push({
        status: failedFiles.length ? 'warning' : 'success',
        title: `Da them ${uploadedItems.length}/${selected.length} anh vao Gallery`,
        description: failedFiles.length ? `Loi: ${failedFiles.join(', ')}` : undefined,
      })
    } catch (err: any) {
      toast.push({
        status: 'error',
        title: 'Tai anh that bai',
        description: err?.message || 'Khong the tai anh len Sanity.',
      })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Stack space={3}>
      <Card border radius={2} padding={3}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Flex align="center" gap={2}>
            <ImagesIcon />
            <Box>
              <Text size={1} weight="semibold">Gallery</Text>
              <Text size={1} muted>
                {currentItems.length}/{MAX_GALLERY_IMAGES} anh
              </Text>
            </Box>
          </Flex>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => uploadFiles(Array.from(event.currentTarget.files || []))}
          />
          <Button
            icon={UploadIcon}
            text={uploading ? 'Dang tai...' : 'Chon nhieu anh'}
            tone="primary"
            disabled={uploading || remaining <= 0}
            onClick={() => inputRef.current?.click()}
          />
        </Flex>
        {remaining <= 0 ? (
          <Box marginTop={3}>
            <Text size={1} muted>Gallery da dat gioi han 30 anh.</Text>
          </Box>
        ) : null}
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}

export { MAX_GALLERY_IMAGES }
