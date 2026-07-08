import { surahLoaders } from './loaders.generated'

// Verse text (Uthmani Arabic + Fooladvand Persian) is bundled as static data under
// ./data and loaded per-surah via dynamic import, so displaying verses needs zero
// external network calls. See scripts/generate-quran-text.mjs for how the data is built.

type Ayah = { a: string; t: string }
type SurahData = Record<string, Ayah>

const cache = new Map<number, SurahData>()

async function loadSurah(surah: number): Promise<SurahData> {
  const cached = cache.get(surah)
  if (cached) return cached

  const loader = surahLoaders[surah]
  if (!loader) throw new Error(`No Quran data for surah ${surah}`)

  const data = (await loader()).default as SurahData
  cache.set(surah, data)
  return data
}

export async function getAyahText(
  surah: number,
  verse: number,
): Promise<{ arabic: string; translation: string }> {
  const data = await loadSurah(surah)
  const ayah = data[String(verse)]
  if (!ayah) throw new Error(`Ayah ${surah}:${verse} not found`)
  return { arabic: ayah.a, translation: ayah.t }
}
