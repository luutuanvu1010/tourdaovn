import { test } from 'node:test'
import assert from 'node:assert/strict'

import { harvestImageCandidates } from '../rich-harvester'

test('rich harvester — lấy image candidates từ JSON-LD, OG và HTML', () => {
  const html = `<!doctype html><html><head>
    <meta property="og:image" content="/og.jpg?wid=1200&amp;fit=constrain">
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Hotel","image":["https://cdn.example.com/jsonld.jpg"]}
    </script>
  </head><body>
    <img src="/room.jpg" alt="Phòng hướng biển" width="1200" height="800">
  </body></html>`

  const images = harvestImageCandidates(html, 'https://example.com/hotel')
  assert.deepEqual(images.map(image => image.url), [
    'https://cdn.example.com/jsonld.jpg',
    'https://example.com/og.jpg?wid=1200&fit=constrain',
    'https://example.com/room.jpg',
  ])
  assert.equal(images[2].alt, 'Phòng hướng biển')
})
