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

  async function loadNextItem() {
    setLoading(true)
    stopAudio()

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

      const [arabicResponse, persianResponse] = await Promise.all([
        fetch(
          `https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}`,
        ),
        fetch(
          `https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/fa.fooladvand`,
        ),
      ])

      const arabicData = await arabicResponse.json()
      const persianData = await persianResponse.json()

      setCurrentContent({
        kind: 'quran',
        surah: surahNumber,
        verse: verseNumber,
        arabic: arabicData.data.text,
        translation: persianData.data.text,
      })
    } catch (error) {
      console.error('Error loading content:', error)
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
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
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
                className="w-full sm:w-auto text-lg h-14 px-8"
                variant="default"
              >
                <ArrowRight className="w-5 h-5 ml-2" />
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
