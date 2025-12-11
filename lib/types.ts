export const CampaignType = {
  General: 'general',
  Surah: 'surah',
  Dua: 'dua',
} as const

export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType]

export interface Campaign {
  id: string
  name: string
  slug: string
  type: CampaignType
  surah_number?: number | null
  surah_name?: string | null
  dua_key?: string | null
  is_active: boolean
  completion_count: number | null
  current_surah_number?: number | null
  current_verse_number?: number | null
  current_dua_index?: number | null
  created_at?: string
  updated_at?: string
  is_public: boolean
}
