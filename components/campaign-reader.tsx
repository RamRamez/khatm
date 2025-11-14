'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Check,
  Pause,
  Play,
  Settings,
  Share2,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Verse {
  surah: number
  verse: number
  arabic: string
  translation: string
}

export interface Campaign {
  id: string
  name: string
  slug: string
  type: 'general' | 'surah'
  surah_number?: number | null
  surah_name?: string | null
  is_active: boolean
  completion_count: number | null
  current_surah_number?: number | null
  current_verse_number?: number | null
  created_at?: string
  updated_at?: string
  is_public: boolean
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
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasRead, setHasRead] = useState(false)
  const [currentCompletionCount, setCurrentCompletionCount] =
    useState(completionCount)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const hasLoadedInitialVerse = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Only load verse if campaign is active
    if (!campaign.is_active) return

    // Prevent double-call in React Strict Mode (development)
    if (hasLoadedInitialVerse.current) return
    hasLoadedInitialVerse.current = true

    loadNextVerse()
  }, [campaign.is_active])

  // Stop and cleanup audio when verse changes
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  // Toggle audio playback
  const toggleAudio = async () => {
    if (!audioRef.current || !currentVerse) return

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

  async function loadNextVerse() {
    setLoading(true)
    setHasRead(false)
    stopAudio()

    try {
      // Get the next sequential verse from the API and increment position
      const nextVerseResponse = await fetch(
        `/api/campaigns/${campaign.slug}/next-verse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const nextVerseData = await nextVerseResponse.json()

      if (!nextVerseResponse.ok || !nextVerseData) {
        throw new Error('Failed to get next verse')
      }

      const surahNumber = nextVerseData.surah_number
      const verseNumber = nextVerseData.verse_number

      // Update completion count if it changed
      if (nextVerseData.completion_count !== undefined) {
        setCurrentCompletionCount(nextVerseData.completion_count)
      }

      // Fetch the verse in Arabic and Persian
      const [arabicResponse, persianResponse] = await Promise.all([
        fetch(
          `https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}`
        ),
        fetch(
          `https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/fa.fooladvand`
        ),
      ])

      const arabicData = await arabicResponse.json()
      const persianData = await persianResponse.json()

      setCurrentVerse({
        surah: surahNumber,
        verse: verseNumber,
        arabic: arabicData.data.text,
        translation: persianData.data.text,
      })
    } catch (error) {
      console.error('Error loading verse:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAsRead() {
    if (!currentVerse || hasRead) return

    // Just mark as read in UI - position was already incremented when verse was fetched
    setHasRead(true)
  }

  async function handleShare() {
    // Get current URL from browser
    const campaignUrl =
      typeof window !== 'undefined' ? window.location.href : ''

    const shareData = {
      title: `کمپین ${campaign.name}`,
      text: `در کمپین "${campaign.name}" شرکت کنید و با خواندن آیات قرآن کریم به ختم جمعی کمک کنید`,
      url: campaignUrl,
    }

    try {
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share(shareData)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(campaignUrl)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      }
    } catch (err) {
      // User cancelled or error occurred
      console.error('Error sharing:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header with completion count */}
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
                  {campaign.type === 'general'
                    ? 'ختم کامل قرآن کریم'
                    : `سوره ${campaign.surah_name}`}
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

        {/* Verse Display */}
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
        ) : loading ? (
          <Card className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <BookOpen className="w-12 h-12 text-primary animate-pulse" />
              <p className="text-muted-foreground text-lg">
                در حال بارگذاری آیه...
              </p>
            </div>
          </Card>
        ) : currentVerse ? (
          <Card className="p-6 md:p-8">
            {/* Surah and Verse number */}
            <div className="text-center mb-4">
              <p className="text-muted-foreground text-lg">
                سوره {currentVerse.surah} - آیه {currentVerse.verse}
              </p>
            </div>

            {/* Arabic Text with Audio Player */}
            <div className="mb-6 text-center">
              <p
                className="arabic-text text-4xl md:text-5xl leading-relaxed mb-4"
                dir="rtl"
              >
                {currentVerse.arabic}
              </p>

              {/* Audio Controls */}
              <div className="flex flex-col items-center gap-3 mt-4">
                <audio
                  ref={audioRef}
                  src={`https://everyayah.com/data/Alafasy_128kbps/${currentVerse.surah.toString().padStart(3, '0')}${currentVerse.verse.toString().padStart(3, '0')}.mp3`}
                  onEnded={() => setIsPlaying(false)}
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
                <p className="text-xs text-muted-foreground">
                  صدای قاری: مشاری راشد العفاسی
                </p>
              </div>
            </div>

            {/* Persian Translation */}
            <div className="border-t-2 border-border pt-5 mb-5">
              <h3 className="text-xl font-semibold mb-3 text-center text-primary">
                ترجمه (فولادوند):
              </h3>
              <p className="text-lg md:text-xl leading-relaxed text-center max-w-4xl mx-auto">
                {currentVerse.translation}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              {!hasRead ? (
                <Button
                  onClick={handleMarkAsRead}
                  size="lg"
                  className="w-full sm:w-auto text-lg h-14 px-8"
                >
                  <Check className="w-5 h-5 ml-2" />
                  خواندم
                </Button>
              ) : (
                <Button
                  onClick={loadNextVerse}
                  size="lg"
                  className="w-full sm:w-auto text-lg h-14 px-8"
                  variant="default"
                >
                  <ArrowRight className="w-5 h-5 ml-2" />
                  آیه بعدی
                </Button>
              )}
            </div>
          </Card>
        ) : null}

        {/* Share Button */}
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
