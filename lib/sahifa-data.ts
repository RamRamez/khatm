// Source: Arabic from ar.wikisource.org, Persian translation fetched live from erfan.ir.
// Static data now contains only metadata (id, title, order). Arabic/Persian bodies are fetched per request.

export interface SahifaItem {
  id: number
  title: string
  arabic?: string
  translation?: string
  order?: number
}

export interface SahifaVerse {
  arabic: string
  translation: string
}

const SAHIFA_SOURCE_BASE = 'https://erfan.ir/farsi'
const verseCache = new Map<number, SahifaVerse[]>()

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_match, code) => {
      const parsed = Number(code)
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : ''
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function stripFooterNoise(value: string) {
  const patterns = [
    /مشاهده شرح.*/i,
    /کلیه حقوق.*/i,
    /پایگاه اطلاع.*/i,
    /پست الکترونیک.*/i,
    /تلفن\s*:?\s*\d.*/i,
    /info@.*/i,
    /Icon.*/i,
  ]
  let cleaned = value
  for (const p of patterns) {
    const m = cleaned.match(p)
    if (m && m.index !== undefined) {
      cleaned = cleaned.slice(0, m.index)
    }
  }
  // Remove trailing long digit sequences (e.g., phone numbers)
  cleaned = cleaned.replace(/\d{5,}.*$/i, '')
  return cleaned.trim()
}

function cleanTextPreserveParens(raw: string) {
  const noTags = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeHtmlEntities(noTags).replace(/\s+/g, ' ').trim()
}

function parseSahifaVersesFromHtml(html: string): SahifaVerse[] {
  const text = cleanTextPreserveParens(html)

  // Pattern: (n) ... (n) ... , using the SAME number for Arabic then Persian
  const verseRegex =
    /\(\s*(\d+)\s*\)\s*([\s\S]*?)\(\s*\1\s*\)\s*([\s\S]*?)(?=\(\s*\d+\s*\)|$)/g

  const verses: SahifaVerse[] = []
  let match: RegExpExecArray | null
  while ((match = verseRegex.exec(text))) {
    const arabic = stripFooterNoise(match[2]?.trim() ?? '')
    const translation = stripFooterNoise(match[3]?.trim() ?? '')
    if (arabic || translation) {
      verses.push({ arabic, translation })
    }
  }

  return verses
}

export async function fetchSahifaVerses(id: number): Promise<SahifaVerse[]> {
  if (verseCache.has(id)) {
    return verseCache.get(id)!
  }

  // Pages follow the pattern: /farsi/sahifeh<ID>/10011/
  const url = `${SAHIFA_SOURCE_BASE}/sahifeh${id}/10011/`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'khatm-app/1.0 (+https://erfan.ir/)' },
    cache: 'force-cache',
    next: { revalidate: 60 * 60 }, // 1 hour revalidate on Next.js
  })

  if (!res.ok) {
    throw new Error(
      `Failed to fetch Sahifa dua ${id} from source (${res.status})`,
    )
  }

  const html = await res.text()
  const verses = parseSahifaVersesFromHtml(html)

  if (!verses.length) {
    throw new Error(`No verses parsed for Sahifa dua ${id}`)
  }

  verseCache.set(id, verses)
  return verses
}

// Minimal metadata; titles can be updated if richer labels are desired.
export const SAHIFA_ITEMS: SahifaItem[] = Array.from(
  { length: 54 },
  (_v, i) => {
    const id = i + 1
    return {
      id,
      title: `صحیفه سجادیه: دعای ${id}`,
    }
  },
)
