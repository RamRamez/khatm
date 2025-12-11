'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Pause,
  Play,
  Settings,
  Share2,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { getDuaByKey } from '@/lib/dua-data'
import { QURAN_SURAHS } from '@/lib/quran-data'
import { CampaignType, type Campaign } from '@/lib/types'

type Content =
  | {
      kind: 'quran'
      surah: number
      verse: number
      arabic: string
      translation: string
    }
  | {
      kind: 'dua'
      title: string
      arabic: string
      translation: string
      audioUrl?: string | null
      itemIndex: number
      totalItems: number
    }

export default function CampaignReader({
  campaign,
  completionCount,
  isAdmin = false,
}: {
  campaign: Campaign
  completionCount: number
  isAdmin?: boolean
}) {
  const [currentContent, setCurrentContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentCompletionCount, setCurrentCompletionCount] =
    useState(completionCount)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [countFlash, setCountFlash] = useState(false)
  const [nextPulse, setNextPulse] = useState(false)
  const [nextBgFlash, setNextBgFlash] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [continuousPlay, setContinuousPlay] = useState(false)
  const hasLoadedInitialContent = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const shouldAutoPlayRef = useRef(false)

  useEffect(() => {
    if (!campaign.is_active) return
    if (hasLoadedInitialContent.current) return
    hasLoadedInitialContent.current = true
    loadNextItem()
  }, [campaign.is_active])

  useEffect(() => {
    if (
      currentContent &&
      !loading &&
      shouldAutoPlayRef.current &&
      continuousPlay &&
      audioRef.current
    ) {
      shouldAutoPlayRef.current = false
      const timer = setTimeout(() => {
        toggleAudio()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentContent, loading, continuousPlay])

  useEffect(() => {
    if (!loading) {
      setCountFlash(true)
      const t = setTimeout(() => setCountFlash(false), 600)
      return () => clearTimeout(t)
    }
  }, [currentCompletionCount, loading])

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const toggleAudio = async () => {
    if (!audioRef.current || !currentContent) return
    if (currentContent.kind === 'dua' && !currentContent.audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      setAudioLoading(true)
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Error playing audio:', error)
      } finally {
        setAudioLoading(false)
      }
    }
  }

  // Compute the next verse locally to show it optimistically.
  const getOptimisticQuran = (): {
    surah: number
    verse: number
    completionBump: boolean
  } | null => {
    if (!currentContent || currentContent.kind !== 'quran') return null
    const currentSurah = currentContent.surah
    const currentVerse = currentContent.verse
    const surahInfo = QURAN_SURAHS.find(s => s.number === currentSurah)
    if (!surahInfo) return null

    let nextSurah = currentSurah
    let nextVerse = currentVerse + 1
    let completionBump = false

    if (nextVerse > surahInfo.verses) {
      if (campaign.type === CampaignType.Surah) {
        // Reset to the same surah, bump completion
        nextSurah = campaign.surah_number ?? currentSurah
        nextVerse = 1
        completionBump = true
      } else {
        // General campaign goes to next surah
        nextSurah = currentSurah + 1
        if (nextSurah > 114) {
          nextSurah = 1
          completionBump = true
        }
        nextVerse = 1
      }
    }

    return { surah: nextSurah, verse: nextVerse, completionBump }
  }

  const getOptimisticDua = (): Content | null => {
    if (campaign.type !== CampaignType.Dua) return null
    const dua = getDuaByKey(campaign.dua_key)
    if (!dua) return null

    const totalItems = 1
    const nextIndex =
      currentContent && currentContent.kind === 'dua'
        ? (currentContent.itemIndex % totalItems || 0) + 1
        : 1

    return {
      kind: 'dua',
      title: dua.title,
      arabic: dua.arabic,
      translation: dua.translation,
      audioUrl: dua.audioUrl || null,
      itemIndex: nextIndex,
      totalItems,
    }
  }

  const fetchAyahText = async (surahNumber: number, verseNumber: number) => {
    const [arabicResponse, persianResponse] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}`),
      fetch(
        `https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/fa.fooladvand`,
      ),
    ])
    const arabicData = await arabicResponse.json()
    const persianData = await persianResponse.json()
    return {
      arabic: arabicData.data.text,
      translation: persianData.data.text,
    }
  }

  async function loadNextItem() {
    setNextPulse(true)
    setTimeout(() => setNextPulse(false), 350)
    setNextBgFlash(true)
    setTimeout(() => setNextBgFlash(false), 300)
    setLoading(true)
    stopAudio()

    const previousContent = currentContent
    const previousCompletion = currentCompletionCount

    // Show an optimistic next verse/item immediately if we can compute it.
    let optimisticContent: Content | null = null
    let optimisticCompletionBump = false

    if (campaign.type === CampaignType.Dua) {
      optimisticContent = getOptimisticDua()
      if (optimisticContent) {
        setCurrentContent(optimisticContent)
        setLoading(false)
      }
    } else {
      const optimisticQuran = getOptimisticQuran()
      if (optimisticQuran) {
        optimisticCompletionBump = optimisticQuran.completionBump
        try {
          const text = await fetchAyahText(
            optimisticQuran.surah,
            optimisticQuran.verse,
          )
          optimisticContent = {
            kind: 'quran',
            surah: optimisticQuran.surah,
            verse: optimisticQuran.verse,
            arabic: text.arabic,
            translation: text.translation,
          }
          setCurrentContent(optimisticContent)
          if (optimisticCompletionBump) {
            setCurrentCompletionCount(c => c + 1)
          }
          setLoading(false)
        } catch (err) {
          console.error('Error fetching optimistic verse:', err)
        }
      }
    }

    try {
      const nextResponse = await fetch(
        `/api/campaigns/${campaign.slug}/next-verse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      )
      const nextData = await nextResponse.json()

      if (!nextResponse.ok || !nextData) {
        throw new Error('Failed to get next content')
      }

      if (nextData.completion_count !== undefined) {
        setCurrentCompletionCount(nextData.completion_count)
      }

      if (campaign.type === CampaignType.Dua) {
        setCurrentContent({
          kind: 'dua',
          title: nextData.title || 'دعای انتخاب شده',
          arabic: nextData.arabic,
          translation: nextData.translation,
          audioUrl: nextData.audio_url || null,
          itemIndex: nextData.item_index || 1,
          totalItems: nextData.total_items || 1,
        })
        return
      }

      const surahNumber = nextData.surah_number
      const verseNumber = nextData.verse_number

      const isSameAsOptimistic =
        optimisticContent &&
        optimisticContent.kind === 'quran' &&
        optimisticContent.surah === surahNumber &&
        optimisticContent.verse === verseNumber

      if (isSameAsOptimistic && optimisticContent) {
        // Keep the optimistic content, just clear the loading state
        setLoading(false)
        return
      }

      const text = await fetchAyahText(surahNumber, verseNumber)
      setCurrentContent({
        kind: 'quran',
        surah: surahNumber,
        verse: verseNumber,
        arabic: text.arabic,
        translation: text.translation,
      })
    } catch (error) {
      console.error('Error loading content:', error)
      // Roll back optimistic UI if the call failed
      if (previousContent) {
        setCurrentContent(previousContent)
      }
      setCurrentCompletionCount(previousCompletion)
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    const campaignUrl =
      typeof window !== 'undefined' ? window.location.href : ''

    const shareData = {
      title: `کمپین ${campaign.name}`,
      text: `در کمپین "${campaign.name}" شرکت کنید و با قرائت کمک کنید`,
      url: campaignUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } else {
        await navigator.clipboard.writeText(campaignUrl)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="text-primary hover:underline inline-flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به صفحه اصلی
            </Link>

            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  پنل مدیریت
                </Button>
              </Link>
            )}
          </div>

          <Card className="p-4 bg-gradient-to-l from-primary/10 to-accent/10 border-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold mb-1">
                  نام کمپین: {campaign.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {campaign.type === CampaignType.General
                    ? 'ختم کامل قرآن کریم'
                    : campaign.type === CampaignType.Surah
                      ? `سوره ${campaign.surah_name}`
                      : getDuaByKey(campaign.dua_key)?.title}
                </p>
              </div>
              <div
                className={`text-center rounded-lg px-3 py-2 transition-colors duration-700 ${
                  countFlash ? 'bg-primary/15' : 'bg-transparent'
                }`}
              >
                <div
                  className={`text-3xl font-bold text-primary mb-1 transition-transform ${
                    countFlash ? 'scale-110 animate-pulse' : ''
                  }`}
                >
                  {currentCompletionCount}
                </div>
                <div className="text-xs text-muted-foreground">
                  دفعات ختم شده
                </div>
              </div>
            </div>
          </Card>
        </div>

        {!campaign.is_active ? (
          <Card className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground text-lg">
                این کمپین به پایان رسیده است
              </p>
              <p className="text-sm text-muted-foreground">
                تعداد ختم انجام شده: {currentCompletionCount} بار
              </p>
            </div>
          </Card>
        ) : currentContent ? (
          <Card className="p-6 md:p-8">
            <div className="text-center mb-4">
              {currentContent.kind === 'quran' ? (
                <p className="text-muted-foreground text-lg">
                  سوره {currentContent.surah} - آیه {currentContent.verse}
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-lg">
                    {currentContent.title}
                  </p>
                  {currentContent.totalItems > 1 && (
                    <p className="text-xs text-muted-foreground">
                      بخش {currentContent.itemIndex} از{' '}
                      {currentContent.totalItems}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6 text-center">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <BookOpen className="w-12 h-12 text-primary animate-pulse" />
                  <p className="text-muted-foreground text-lg">
                    در حال بارگذاری آیه...
                  </p>
                </div>
              ) : (
                <p
                  className="arabic-text text-4xl md:text-5xl leading-relaxed mb-4"
                  dir="rtl"
                  lang="ar"
                >
                  {currentContent.arabic}
                </p>
              )}
              {currentContent.kind === CampaignType.Dua &&
              !currentContent.audioUrl ? null : (
                <div className="flex flex-col items-center gap-3 mt-4">
                  <audio
                    ref={audioRef}
                    src={
                      currentContent.kind === 'quran'
                        ? `https://everyayah.com/data/Alafasy_128kbps/${currentContent.surah
                            .toString()
                            .padStart(3, '0')}${currentContent.verse
                            .toString()
                            .padStart(3, '0')}.mp3`
                        : currentContent.audioUrl || ''
                    }
                    onEnded={() => {
                      setIsPlaying(false)
                      if (continuousPlay) {
                        shouldAutoPlayRef.current = true
                        loadNextItem()
                      }
                    }}
                    onLoadStart={() => setAudioLoading(true)}
                    onCanPlay={() => setAudioLoading(false)}
                    onError={e => {
                      console.error('Error loading audio:', e)
                      setAudioLoading(false)
                    }}
                    preload="metadata"
                    crossOrigin="anonymous"
                  />

                  <Button
                    onClick={toggleAudio}
                    variant="outline"
                    size="lg"
                    className="gap-2 min-w-[140px]"
                    disabled={audioLoading}
                  >
                    {audioLoading ? (
                      <>
                        <Volume2 className="w-5 h-5 animate-pulse" />
                        در حال بارگذاری...
                      </>
                    ) : isPlaying ? (
                      <>
                        <Pause className="w-5 h-5" />
                        توقف
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        پخش صوت
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="continuous-play"
                      checked={continuousPlay}
                      onChange={e => setContinuousPlay(e.target.checked)}
                      className="w-4 h-4 cursor-pointer accent-primary"
                    />
                    <Label
                      htmlFor="continuous-play"
                      className="text-sm cursor-pointer"
                    >
                      پخش خودکار آیات
                    </Label>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    صدای قاری: مشاری راشد العفاسی
                  </p>
                </div>
              )}
            </div>

            <div className="border-t-2 border-border pt-5 mb-5">
              <h3 className="text-xl font-semibold mb-3 text-center text-primary">
                ترجمه:
              </h3>
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <BookOpen className="w-12 h-12 text-primary animate-pulse" />
                  <p className="text-muted-foreground text-lg">
                    در حال بارگذاری ترجمه...
                  </p>
                </div>
              ) : (
                <p className="text-lg md:text-xl leading-relaxed text-center max-w-4xl mx-auto">
                  {currentContent.translation}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                onClick={loadNextItem}
                size="lg"
                className={`w-full sm:w-auto text-lg h-14 px-8 transition duration-1000 shadow-[0_18px_48px_rgba(59,130,246,0.35)] active:shadow-[0_28px_72px_rgba(59,130,246,0.55)] active:-translate-y-0.5 bg-primary text-primary-foreground hover:bg-primary/90 ${
                  nextBgFlash ? 'bg-white text-primary' : ''
                }`}
                variant="default"
              >
                <ArrowRight
                  className={`w-5 h-5 ml-2 transition-transform ${
                    nextPulse ? '-translate-x-1 animate-pulse' : ''
                  }`}
                />
                بعدی
              </Button>
            </div>
          </Card>
        ) : null}

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleShare}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Share2 className="w-5 h-5" />
            {shareSuccess ? 'لینک کپی شد!' : 'اشتراک‌گذاری کمپین'}
          </Button>
        </div>
      </div>
    </div>
  )
}
