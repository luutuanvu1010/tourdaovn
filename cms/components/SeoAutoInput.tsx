import React, { useEffect, useMemo } from 'react'
import { Box, Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { PatchEvent, set, useFormValue } from 'sanity'

const LANGUAGES = ['vi', 'en', 'zh', 'ko', 'ru'] as const

type LocalizedText = Partial<Record<(typeof LANGUAGES)[number], string>>

function cleanLocalized(value: unknown): LocalizedText {
  if (!value || typeof value !== 'object') return {}

  return LANGUAGES.reduce<LocalizedText>((acc, lang) => {
    const text = (value as Record<string, unknown>)[lang]
    if (typeof text === 'string' && text.trim()) acc[lang] = text.trim()
    return acc
  }, {})
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left ?? {}) === JSON.stringify(right ?? {})
}

function mergeMissingSeo(current: unknown, generated: { metaTitle: LocalizedText; metaDescription: LocalizedText }) {
  const value = current && typeof current === 'object' ? current as Record<string, unknown> : {}
  const currentTitle = cleanLocalized(value.metaTitle)
  const currentDescription = cleanLocalized(value.metaDescription)

  return {
    metaTitle: {
      ...generated.metaTitle,
      ...currentTitle,
    },
    metaDescription: {
      ...generated.metaDescription,
      ...currentDescription,
    },
  }
}

export function SeoAutoInput(props: any) {
  const title = useFormValue(['title'])
  const summary = useFormValue(['summary'])

  const generatedSeo = useMemo(
    () => ({
      metaTitle: cleanLocalized(title),
      metaDescription: cleanLocalized(summary),
    }),
    [title, summary],
  )

  useEffect(() => {
    const mergedSeo = mergeMissingSeo(props.value, generatedSeo)
    if (!sameValue(props.value, mergedSeo)) {
      props.onChange(PatchEvent.from(set(mergedSeo)))
    }
  }, [generatedSeo, props])

  function syncFromBasic() {
    props.onChange(PatchEvent.from(set(generatedSeo)))
  }

  return (
    <Stack space={3}>
      <Card border radius={2} padding={3} tone="positive">
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack space={2}>
            <Text size={1} weight="semibold">SEO tự động</Text>
            <Text size={1}>
              Tự điền ô trống từ Title/Summary trong tab Cơ bản; biên tập viên vẫn có thể sửa tay.
            </Text>
          </Stack>
          <Button
            mode="ghost"
            tone="primary"
            text="Đồng bộ lại"
            onClick={syncFromBasic}
          />
        </Flex>
      </Card>
      <Box>{props.renderDefault(props)}</Box>
    </Stack>
  )
}
