import { SAHIFA_ITEMS } from '@/lib/sahifa-data'

export const DuaType = {
  Salawat: 'salawat',
  SalawatFatema: 'salawat-fatema',
} as const

export type DuaKey = string

type StaticDua = {
  kind: 'static'
  key: DuaKey
  title: string
  arabic: string
  translation: string
  audioUrl?: string | null
  totalItems?: number
}

type SahifaDua = {
  kind: 'sahifa'
  key: DuaKey
  title: string
  sahifaId: number
}

export type DuaItem = StaticDua | SahifaDua

const STATIC_DUAS: StaticDua[] = [
  {
    kind: 'static',
    key: DuaType.Salawat,
    title: 'صلوات',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    translation: 'خدایا بر محمد و خاندان محمد درود فرست.',
    audioUrl: null,
    totalItems: 1,
  },
  {
    kind: 'static',
    key: DuaType.SalawatFatema,
    title: 'صلوات حضرت فاطمه زهرا (س)',
    arabic:
      'اَللّهُمَّ صَلِّ عَلى فاطِمَةَ وَ اَبيها وَ بَعْلِها وَ بَنيها وَ السِّرِّ الْمُسْتَوْدَعِ فيها بِعَدَدِ ما اَحاطَ بِهِ عِلْمُكَ',
    translation:
      'خداوندا، درود فرست بر فاطمه و پدرش و همسرش و پسرانش و آن راز به ودیعه نهاده شده در او، به تعداد آنچه دانش تو بر آن احاطه دارد.',
    audioUrl: null,
    totalItems: 1,
  },
]

function buildSahifaDuas(): SahifaDua[] {
  return SAHIFA_ITEMS.map(item => ({
    kind: 'sahifa',
    key: `sahifa-${item.id}`,
    sahifaId: item.id,
    title: item.title,
  }))
}

export const DUA_ITEMS: DuaItem[] = [...STATIC_DUAS, ...buildSahifaDuas()]

export function getDuaByKey(key?: string | null): DuaItem | undefined {
  if (!key) return undefined
  return DUA_ITEMS.find(item => item.key === key)
}

export function isStaticDua(
  dua: DuaItem | undefined,
): dua is Extract<DuaItem, { kind: 'static' }> {
  return dua?.kind === 'static'
}

export function getDuaOptions() {
  return DUA_ITEMS.map(item => ({
    value: item.key,
    label: item.title,
  }))
}
