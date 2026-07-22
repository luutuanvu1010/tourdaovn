import { test } from 'node:test'
import assert from 'node:assert/strict'

import { looksLikeBlockedHtml } from '../fetcher/scrapfly'

test('scrapfly — nhận diện shell Akamai mỏng là trang chặn', () => {
  const html = `<!doctype html><html><head><title>Access Denied</title></head><body>
    <img src="https://www.akamai.com/site/ko/images/logo/akamai-logo1.svg" alt="Akamai">
    Reference #18.1234
  </body></html>`

  assert.equal(looksLikeBlockedHtml(html), true)
})

test('scrapfly — không coi trang thật dài có chữ Akamai là trang chặn', () => {
  const html = `<!doctype html><html><head><title>Sheraton Nha Trang Hotel & Spa</title></head><body>
    <h1>Sheraton Nha Trang Hotel & Spa</h1>
    <p>${'Nha Trang hotel overview with real property content. '.repeat(20)}</p>
    <script>window.cdn = "akamai"</script>
  </body></html>`

  assert.equal(looksLikeBlockedHtml(html), false)
})
