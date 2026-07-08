// Proxies the per-ayah recitation audio (Mishary Rashid Alafasy, 128kbps) from
// everyayah.com through our own origin. The browser only ever talks to our domain,
// so the audio works from Iran without a VPN even though everyayah.com is blocked
// there. Range requests are forwarded so seeking/scrubbing still works.

const UPSTREAM_BASE = 'https://everyayah.com/data/Alafasy_128kbps'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const surah = Number(searchParams.get('surah'))
  const verse = Number(searchParams.get('verse'))

  if (
    !Number.isInteger(surah) ||
    !Number.isInteger(verse) ||
    surah < 1 ||
    surah > 114 ||
    verse < 1
  ) {
    return new Response('Invalid surah/verse', { status: 400 })
  }

  const file = `${String(surah).padStart(3, '0')}${String(verse).padStart(3, '0')}.mp3`
  const range = request.headers.get('range')

  let upstream: Response
  try {
    upstream = await fetch(`${UPSTREAM_BASE}/${file}`, {
      headers: range ? { Range: range } : {},
    })
  } catch {
    return new Response('Failed to reach audio source', { status: 502 })
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Audio source error', { status: 502 })
  }

  const headers = new Headers({
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    // Ayah audio never changes, so cache aggressively (browser + any edge/CDN).
    'Cache-Control': 'public, max-age=31536000, immutable',
  })
  const contentLength = upstream.headers.get('content-length')
  if (contentLength) headers.set('Content-Length', contentLength)
  const contentRange = upstream.headers.get('content-range')
  if (contentRange) headers.set('Content-Range', contentRange)

  return new Response(upstream.body, { status: upstream.status, headers })
}
