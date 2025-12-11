export const DuaType = {
  Salawat: 'salawat',
  SalawatFatema: 'salawat-fatema',
} as const

export type DuaKey = (typeof DuaType)[keyof typeof DuaType]

export interface DuaItem {
  key: DuaKey
  title: string
  arabic: string
  translation: string
  audioUrl?: string | null
}

export const DUA_ITEMS: DuaItem[] = [
  {
    key: DuaType.Salawat,
    title: 'صلوات',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    translation: 'خدایا بر محمد و خاندان محمد درود فرست.',
    audioUrl: null,
  },
  {
    key: DuaType.SalawatFatema,
    title: 'صلوات حضرت فاطمه زهرا (س)',
    arabic:
      'اَللّهُمَّ صَلِّ عَلى فاطِمَةَ وَ اَبيها وَ بَعْلِها وَ بَنيها وَ السِّرِّ الْمُسْتَوْدَعِ فيها بِعَدَدِ ما اَحاطَ بِهِ عِلْمُكَ',
    translation:
      'خداوندا، درود فرست بر فاطمه و پدرش و همسرش و پسرانش و آن راز به ودیعه نهاده شده در او، به تعداد آنچه دانش تو بر آن احاطه دارد.',
    audioUrl: null,
  },
]

export function getDuaByKey(key?: string | null): DuaItem | undefined {
  if (!key) return undefined
  return DUA_ITEMS.find(item => item.key === key)
}

export function getDuaOptions() {
  return DUA_ITEMS.map(item => ({
    value: item.key,
    label: item.title,
  }))
}
