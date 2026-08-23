import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runHook, bashInput, repoGia } from './hook-harness'

const HOOK = 'guard-deploy.sh'

test('lệnh không phải deploy thì không đụng tới', () => {
  const dir = repoGia({ ahead: 5, distFresh: false })
  for (const cmd of ['npm run build', 'git status', 'npm --prefix scripts test']) {
    assert.equal(runHook(HOOK, bashInput(cmd), dir).denied, false, cmd)
  }
})

test('D-A: có commit chưa push thì chặn mọi lệnh deploy', () => {
  const dir = repoGia({ ahead: 3, distFresh: true })
  for (const cmd of ['npm run deploy', 'npx wrangler deploy', 'npm run deploy:preview']) {
    const r = runHook(HOOK, bashInput(cmd), dir)
    assert.equal(r.denied, true, cmd)
    assert.match(r.reason, /3 commit chưa push/)
  }
})

test('D-A: đã push hết thì cho qua', () => {
  const dir = repoGia({ ahead: 0, distFresh: true })
  assert.equal(runHook(HOOK, bashInput('npm run deploy'), dir).denied, false)
})

test('D-B: wrangler deploy trần với dist cũ hơn src thì chặn', () => {
  const dir = repoGia({ ahead: 0, distFresh: false })
  const r = runHook(HOOK, bashInput('npx wrangler deploy'), dir)
  assert.equal(r.denied, true)
  assert.match(r.reason, /dist\/ cũ hơn src\//)
})

test('D-B: npm run deploy tự build nên dist cũ không phải lý do chặn', () => {
  const dir = repoGia({ ahead: 0, distFresh: false })
  assert.equal(runHook(HOOK, bashInput('npm run deploy'), dir).denied, false)
})

test('D-B: chuỗi có build trước thì cũng cho qua', () => {
  const dir = repoGia({ ahead: 0, distFresh: false })
  assert.equal(runHook(HOOK, bashInput('npm run build && npx wrangler deploy'), dir).denied, false)
})
