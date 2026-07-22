import React, { useEffect } from 'react'
import { StringInputProps, useCurrentUser, set } from 'sanity'
import { TextInput } from '@sanity/ui'

/**
 * Input component cho field approvedBy.
 * Khi document chuyển sang reviewStatus = approved, tự điền tên người đăng nhập.
 * Validator I19 yêu cầu approvedBy là tên người thật — component này đảm bảo không
 * bao giờ điền tên role token.
 */
export function ApprovedByInput(props: StringInputProps) {
  const { value, onChange, readOnly, elementProps } = props
  const currentUser = useCurrentUser()

  useEffect(() => {
    // Chỉ điền khi trống và có user đăng nhập
    if (!value && currentUser?.name) {
      onChange(set(currentUser.name))
    }
  }, [currentUser, value, onChange])

  return (
    <TextInput
      {...elementProps}
      value={value ?? ''}
      readOnly={readOnly}
      onChange={(event) => {
        onChange(set(event.currentTarget.value))
      }}
      placeholder={currentUser?.name ?? 'Tên người duyệt'}
    />
  )
}
