import { NextResponse } from 'next/server'
import { getDuaByKey, isStaticDua } from '@/lib/dua-data'
import { QURAN_SURAHS } from '@/lib/quran-data'
import { SAHIFA_ITEMS, fetchSahifaVerses } from '@/lib/sahifa-data'
import { createClient } from '@/lib/supabase/server'
import { CampaignType } from '@/lib/types'

function getSahifaByKey(key?: string | null) {
  if (!key) return undefined
  const match = /^sahifa-(\d+)$/.exec(key)
  if (!match) return undefined
  const id = Number(match[1])
  if (!Number.isFinite(id)) return undefined
  return SAHIFA_ITEMS.find(item => item.id === id)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: encodedSlug } = await params
  // Decode the slug to handle Persian/Arabic characters
  const slug = decodeURIComponent(encodedSlug)
  const supabase = await createClient()
  const sessionId = request.headers.get('x-session-id')
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-client-ip')?.trim() ||
    request.headers.get('cf-connecting-ip')?.trim() ||
    request.headers.get('fastly-client-ip')?.trim() ||
    null
  const ua = request.headers.get('user-agent') || ''

  const detectDeviceType = (userAgent: string): string => {
    const uaLower = userAgent.toLowerCase()
    if (uaLower.includes('ipad') || uaLower.includes('tablet')) return 'tablet'
    if (
      uaLower.includes('mobi') ||
      uaLower.includes('android') ||
      uaLower.includes('iphone') ||
      uaLower.includes('ipod')
    ) {
      return 'mobile'
    }
    return 'desktop'
  }
  const deviceType = detectDeviceType(ua) || 'unknown'
  const detectOs = (
    userAgent: string,
  ): { os: string; osVersion: string | null } => {
    const uaLower = userAgent.toLowerCase()
    if (uaLower.includes('android')) {
      const match = /android\s([0-9._]+)/i.exec(userAgent)
      return { os: 'android', osVersion: match?.[1] || null }
    }
    if (
      uaLower.includes('iphone') ||
      uaLower.includes('ipad') ||
      uaLower.includes('ipod')
    ) {
      const match = /os\s([0-9_]+)/i.exec(userAgent)
      return { os: 'ios', osVersion: match?.[1]?.replace(/_/g, '.') || null }
    }
    if (uaLower.includes('mac os x')) {
      const match = /mac os x\s([0-9_]+)/i.exec(userAgent)
      return { os: 'macos', osVersion: match?.[1]?.replace(/_/g, '.') || null }
    }
    if (uaLower.includes('windows')) {
      const match = /windows nt\s([0-9.]+)/i.exec(userAgent)
      return { os: 'windows', osVersion: match?.[1] || null }
    }
    if (uaLower.includes('linux')) {
      return { os: 'linux', osVersion: null }
    }
    return { os: 'unknown', osVersion: null }
  }
  const { os: deviceOs, osVersion: deviceOsVersion } = detectOs(ua)
  const ipToStore = ip || 'unknown'
  const deviceOsToStore = deviceOs || 'unknown'
  const deviceOsVersionToStore = deviceOsVersion || 'unknown'

  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    // Get campaign details with current position
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Handle dua campaigns separately
    if (campaign.type === CampaignType.Dua) {
      const dua = getDuaByKey(campaign.dua_key)
      if (!dua) {
        return NextResponse.json(
          { error: 'Dua not found for campaign' },
          { status: 400 },
        )
      }

      if (isStaticDua(dua)) {
        const totalItems = dua.totalItems ?? 1
        const currentIndex =
          campaign.current_dua_index && campaign.current_dua_index <= totalItems
            ? campaign.current_dua_index
            : 1

        let nextIndex = currentIndex + 1
        let newCompletionCount = campaign.completion_count || 0

        if (nextIndex > totalItems) {
          nextIndex = 1
          newCompletionCount = newCompletionCount + 1
        }

        await supabase
          .from('campaigns')
          .update({
            current_dua_index: nextIndex,
            completion_count: newCompletionCount,
          })
          .eq('id', campaign.id)

        // Log activity
        await supabase.from('campaign_activity_logs').insert({
          campaign_id: campaign.id,
          user_id: user?.id ?? null,
          session_id: sessionId,
          ip_address: ipToStore,
          device_type: deviceType,
          device_os: deviceOsToStore,
          device_os_version: deviceOsVersionToStore,
        })

        return NextResponse.json({
          title: dua.title,
          arabic: dua.arabic,
          translation: dua.translation,
          audio_url: dua.audioUrl || null,
          item_index: currentIndex,
          total_items: totalItems,
          completion_count: newCompletionCount,
        })
      }

      const sahifa = getSahifaByKey(campaign.dua_key)
      if (!sahifa) {
        return NextResponse.json(
          { error: 'Sahifa dua not found' },
          { status: 400 },
        )
      }

      let verses
      try {
        verses = await fetchSahifaVerses(sahifa.id)
      } catch (error) {
        console.error('Failed to load Sahifa verses', error)
        return NextResponse.json(
          { error: 'Unable to load Sahifa verses from source' },
          { status: 502 },
        )
      }
      if (!verses?.length) {
        return NextResponse.json(
          { error: 'No verses found for this Sahifa dua' },
          { status: 502 },
        )
      }
      const totalItems = verses.length
      const currentIndex =
        campaign.current_dua_index && campaign.current_dua_index <= totalItems
          ? campaign.current_dua_index
          : 1

      const currentVerse = verses[(currentIndex - 1) % totalItems]
      let nextIndex = currentIndex + 1
      let newCompletionCount = campaign.completion_count || 0

      if (nextIndex > totalItems) {
        nextIndex = 1
        newCompletionCount = newCompletionCount + 1
      }

      await supabase
        .from('campaigns')
        .update({
          current_dua_index: nextIndex,
          completion_count: newCompletionCount,
        })
        .eq('id', campaign.id)

      // Log activity
      await supabase.from('campaign_activity_logs').insert({
        campaign_id: campaign.id,
        user_id: user?.id ?? null,
        session_id: sessionId,
        ip_address: ipToStore,
        device_type: deviceType,
        device_os: deviceOsToStore,
        device_os_version: deviceOsVersionToStore,
      })

      return NextResponse.json({
        title: sahifa.title,
        arabic: currentVerse.arabic,
        translation: currentVerse.translation,
        audio_url: null,
        item_index: currentIndex,
        total_items: totalItems,
        completion_count: newCompletionCount,
      })
    }

    // Get current position - for surah-based campaigns, default to the campaign's surah
    let currentSurah =
      campaign.current_surah_number ||
      (campaign.type === CampaignType.Surah ? campaign.surah_number : 1)
    let currentVerse = campaign.current_verse_number || 1

    // Get the current surah info
    const surah = QURAN_SURAHS.find(s => s.number === currentSurah)
    if (!surah) {
      return NextResponse.json(
        { error: 'Invalid surah number' },
        { status: 400 },
      )
    }

    // Prepare the response with current verse
    const nextVerse = {
      surah_number: currentSurah,
      verse_number: currentVerse,
      surah_name: surah.persianName,
      completion_count: campaign.completion_count || 0,
    }

    // Calculate the next position for the next user
    let nextSurah = currentSurah
    let nextVerseNumber = currentVerse + 1

    if (campaign.type === CampaignType.General) {
      // For general campaigns, iterate through all surahs
      if (nextVerseNumber > surah.verses) {
        // Move to next surah
        nextSurah = currentSurah + 1
        nextVerseNumber = 1

        // If we've finished all surahs, start over and increment completion
        if (nextSurah > 114) {
          nextSurah = 1
          nextVerseNumber = 1
          const newCompletionCount = (campaign.completion_count || 0) + 1

          // Increment completion count in database
          // The incremented count will be shown when the first verse is displayed (next API call)
          await supabase
            .from('campaigns')
            .update({
              current_surah_number: nextSurah,
              current_verse_number: nextVerseNumber,
              completion_count: newCompletionCount,
            })
            .eq('id', campaign.id)
        } else {
          // Just update position
          await supabase
            .from('campaigns')
            .update({
              current_surah_number: nextSurah,
              current_verse_number: nextVerseNumber,
            })
            .eq('id', campaign.id)
        }
      } else {
        // Still in same surah, just increment verse
        await supabase
          .from('campaigns')
          .update({
            current_verse_number: nextVerseNumber,
          })
          .eq('id', campaign.id)
      }
    } else {
      // For surah-specific campaigns
      if (nextVerseNumber > surah.verses) {
        // Start over and increment completion
        nextVerseNumber = 1
        // Ensure we keep the correct surah number for surah-based campaigns
        nextSurah = campaign.surah_number
        const newCompletionCount = (campaign.completion_count || 0) + 1

        // Increment completion count in database
        // The incremented count will be shown when the first verse is displayed (next API call)
        await supabase
          .from('campaigns')
          .update({
            current_surah_number: nextSurah,
            current_verse_number: nextVerseNumber,
            completion_count: newCompletionCount,
          })
          .eq('id', campaign.id)
      } else {
        // Just increment verse
        await supabase
          .from('campaigns')
          .update({
            current_verse_number: nextVerseNumber,
          })
          .eq('id', campaign.id)
      }
    }

    // Log activity
    await supabase.from('campaign_activity_logs').insert({
      campaign_id: campaign.id,
      user_id: user?.id ?? null,
      session_id: sessionId,
      ip_address: ipToStore,
      device_type: deviceType,
      device_os: deviceOsToStore,
      device_os_version: deviceOsVersionToStore,
    })

    return NextResponse.json(nextVerse)
  } catch (error) {
    console.error('Error getting next verse:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
