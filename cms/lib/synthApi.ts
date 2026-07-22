export function synthApiUrl(path: '/synth' | '/translate'): string {
  const base = process.env.SANITY_STUDIO_SYNTH_API_URL
  if (!base) throw new Error('Thiếu SANITY_STUDIO_SYNTH_API_URL')

  const url = new URL(base)
  if (url.pathname === '/' || url.pathname === '') {
    url.pathname = path
  } else if (url.pathname.endsWith('/synth') || url.pathname.endsWith('/translate')) {
    url.pathname = url.pathname.replace(/\/(?:synth|translate)$/, path)
  } else {
    url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`
  }
  return url.toString()
}

export function synthApiHeaders(): Record<string, string> {
  return {
    'content-type': 'application/json',
    ...(process.env.SANITY_STUDIO_SYNTH_API_TOKEN
      ? { 'x-synth-token': process.env.SANITY_STUDIO_SYNTH_API_TOKEN }
      : {}),
  }
}
