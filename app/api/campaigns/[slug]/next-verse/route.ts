import { QURAN_SURAHS } from '@/lib/quran-data'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: encodedSlug } = await params
  // Decode the slug to handle Persian/Arabic characters
  const slug = decodeURIComponent(encodedSlug)
  const supabase = await createClient()

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

    // Get current position - for surah-based campaigns, default to the campaign's surah
    let currentSurah =
      campaign.current_surah_number ||
      (campaign.type === 'surah' ? campaign.surah_number : 1)
    let currentVerse = campaign.current_verse_number || 1

    // Get the current surah info
    const surah = QURAN_SURAHS.find(s => s.number === currentSurah)
    if (!surah) {
      return NextResponse.json(
        { error: 'Invalid surah number' },
        { status: 400 }
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

    if (campaign.type === 'general') {
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

    return NextResponse.json(nextVerse)
  } catch (error) {
    console.error('Error getting next verse:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
