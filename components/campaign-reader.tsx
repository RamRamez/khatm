"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Check } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Verse {
  surah: number;
  verse: number;
  arabic: string;
  translation: string;
}

export default function CampaignReader({
  campaign,
  completionCount,
  totalVerses,
}: {
  campaign: any;
  completionCount: number;
  totalVerses: number;
}) {
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRead, setHasRead] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  useEffect(() => {
    loadNextVerse();
  }, []);

  async function loadNextVerse() {
    setLoading(true);
    setHasRead(false);
    
    try {
      // Fetch a verse from the Quran API
      let surahNumber: number;
      let verseNumber: number;

      if (campaign.type === "general") {
        // For general campaigns, get a random verse from any surah
        const randomSurahIndex = Math.floor(Math.random() * 114) + 1;
        surahNumber = randomSurahIndex;
        
        // Fetch surah info to get verse count
        const surahResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
        const surahData = await surahResponse.json();
        verseNumber = Math.floor(Math.random() * surahData.data.numberOfAyahs) + 1;
      } else {
        // For surah-based campaigns
        surahNumber = campaign.surah_number;
        
        // Fetch surah info to get verse count
        const surahResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
        const surahData = await surahResponse.json();
        verseNumber = Math.floor(Math.random() * surahData.data.numberOfAyahs) + 1;
      }

      // Fetch the verse in Arabic and Persian
      const [arabicResponse, persianResponse] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}`),
        fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/fa.fooladvand`)
      ]);

      const arabicData = await arabicResponse.json();
      const persianData = await persianResponse.json();

      setCurrentVerse({
        surah: surahNumber,
        verse: verseNumber,
        arabic: arabicData.data.text,
        translation: persianData.data.text,
      });
    } catch (error) {
      console.error("[v0] Error loading verse:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead() {
    if (!currentVerse || hasRead) return;

    const supabase = createClient();
    
    await supabase.from("verse_readings").insert({
      campaign_id: campaign.id,
      verse_number: currentVerse.verse,
      surah_number: currentVerse.surah,
      session_id: sessionId,
    });

    setHasRead(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header with completion count */}
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline inline-flex items-center gap-2 mb-4">
            <ArrowRight className="w-4 h-4" />
            بازگشت به صفحه اصلی
          </Link>
          
          <Card className="p-6 bg-gradient-to-l from-primary/10 to-accent/10 border-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
                <p className="text-muted-foreground">
                  {campaign.type === "general" ? "ختم کامل قرآن کریم" : `سوره ${campaign.surah_name}`}
                </p>
              </div>
              <div className="text-center bg-card p-6 rounded-lg border-2 border-primary/20">
                <div className="text-5xl font-bold text-primary mb-2">
                  {completionCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  دفعات ختم شده
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Verse Display */}
        {loading ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <BookOpen className="w-12 h-12 text-primary animate-pulse" />
              <p className="text-muted-foreground text-lg">در حال بارگذاری آیه...</p>
            </div>
          </Card>
        ) : currentVerse ? (
          <Card className="p-8 md:p-12">
            {/* Surah and Verse number */}
            <div className="text-center mb-8">
              <p className="text-muted-foreground text-lg">
                سوره {currentVerse.surah} - آیه {currentVerse.verse}
              </p>
            </div>

            {/* Arabic Text */}
            <div className="mb-12 text-center">
              <p className="arabic-text text-4xl md:text-5xl leading-loose" dir="rtl">
                {currentVerse.arabic}
              </p>
            </div>

            {/* Persian Translation */}
            <div className="border-t-2 border-border pt-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-center text-primary">ترجمه:</h3>
              <p className="text-lg md:text-xl leading-relaxed text-center max-w-4xl mx-auto">
                {currentVerse.translation}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
      </div>
    </div>
  );
}
