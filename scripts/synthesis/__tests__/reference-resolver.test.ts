import { test } from 'node:test'
import assert from 'node:assert/strict'

import { containedInPlaceCandidates } from '../reference-resolver'

test('reference resolver — chuẩn hoá container island có ngữ cảnh sau dấu phẩy', () => {
  assert.deepEqual(
    containedInPlaceCandidates('Đảo Hòn Tằm, Nha Trang'),
    ['Đảo Hòn Tằm, Nha Trang', 'Đảo Hòn Tằm', 'Hòn Tằm'],
  )
})
