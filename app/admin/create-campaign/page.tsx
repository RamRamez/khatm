"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QURAN_SURAHS } from "@/lib/quran-data";
import { generateUniqueSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, BookOpen } from 'lucide-react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from "react";

export default function CreateCampaignPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"general" | "surah">("general");
  const [selectedSurah, setSelectedSurah] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Prepare Surah options for Combobox
  const surahOptions = QURAN_SURAHS.map((surah) => ({
    value: surah.number.toString(),
    label: `${surah.number}. ${surah.persianName} (${surah.name})`,
  }));

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("لطفا نام کمپین را وارد کنید");
      return;
    }

    if (type === "surah" && !selectedSurah) {
      setError("لطفا یک سوره انتخاب کنید");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const surahNumber = selectedSurah ? parseInt(selectedSurah) : null;
    const surahData = type === "surah"
      ? QURAN_SURAHS.find(s => s.number === surahNumber)
      : null;

    // Generate unique slug
    const slug = await generateUniqueSlug(
      name.trim(),
      async (checkSlug) => {
        const { data } = await supabase
          .from("campaigns")
          .select("id")
          .eq("slug", checkSlug)
          .single();
        return !!data;
      }
    );

    const { error: insertError } = await supabase.from("campaigns").insert({
      name: name.trim(),
      slug,
      type,
      surah_number: type === "surah" ? surahNumber : null,
      surah_name: surahData?.persianName || null,
      is_active: true,
      is_public: isPublic,
      created_by: user?.id,
      // Set initial position based on campaign type
      current_surah_number: type === "surah" ? surahNumber : 1,
      current_verse_number: 1,
      completion_count: 0,
    });

    if (insertError) {
      setError("خطایی رخ داد. لطفا دوباره تلاش کنید");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href="/admin" className="text-primary hover:underline inline-flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4" />
              بازگشت به پنل مدیریت
            </Link>

            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">ایجاد کمپین جدید</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>اطلاعات کمپین</CardTitle>
              <CardDescription>
                اطلاعات کمپین قرآنی خود را وارد کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCampaign} className="space-y-6">
                {/* Campaign Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">نام کمپین</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: ختم قرآن ماه رمضان"
                    required
                  />
                </div>

                {/* Campaign Type */}
                <div className="space-y-3">
                  <Label>نوع کمپین</Label>
                  <RadioGroup value={type} onValueChange={(v) => setType(v as "general" | "surah")}>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="general" id="general" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="general" className="font-medium cursor-pointer">
                          ختم کامل
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          تمام آیات قرآن کریم به صورت ترتیبی برای کاربران نمایش داده می‌شود
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="surah" id="surah" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="surah" className="font-medium cursor-pointer">
                          بر اساس سوره
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          فقط آیات یک سوره خاص به صورت ترتیبی نمایش داده می‌شود
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Surah Selection */}
                {type === "surah" && (
                  <div className="space-y-2">
                    <Label htmlFor="surah-select">انتخاب سوره</Label>
                    <Combobox
                      options={surahOptions}
                      value={selectedSurah}
                      onValueChange={setSelectedSurah}
                      placeholder="یک سوره انتخاب کنید"
                      searchPlaceholder="جستجوی سوره..."
                      emptyText="سوره‌ای یافت نشد"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Campaign Visibility */}
                <div className="space-y-3">
                  <Label>نمایش کمپین</Label>
                  <RadioGroup value={isPublic ? "public" : "private"} onValueChange={(v) => setIsPublic(v === "public")}>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="public" id="public" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="public" className="font-medium cursor-pointer">
                          عمومی
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          کمپین در صفحه اصل نمایش داده می‌شود و همه کاربران می‌توانند آن را ببینند
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="private" id="private" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="private" className="font-medium cursor-pointer">
                          خصوصی
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          کمپین در صفحه اصل نمایش داده نمی‌شود و فقط از طریق لینک مستقیم قابل دسترسی است
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {error && (
                  <div className="text-destructive text-sm text-center p-3 bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "در حال ایجاد..." : "ایجاد کمپین"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
