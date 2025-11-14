"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { ArrowRight, BookOpen } from 'lucide-react';
import { QURAN_SURAHS } from "@/lib/quran-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateCampaignPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"general" | "surah">("general");
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

    const surahData = type === "surah" 
      ? QURAN_SURAHS.find(s => s.number === selectedSurah)
      : null;

    const { error: insertError } = await supabase.from("campaigns").insert({
      name: name.trim(),
      type,
      surah_number: type === "surah" ? selectedSurah : null,
      surah_name: surahData?.persianName || null,
      is_active: true,
      created_by: user?.id,
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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
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
                    <div className="flex items-start space-x-2 space-x-reverse">
                      <RadioGroupItem value="general" id="general" />
                      <div className="flex-1">
                        <Label htmlFor="general" className="font-medium cursor-pointer">
                          ختم کامل
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          تمام آیات قرآن کریم به صورت تصادفی برای کاربران نمایش داده می‌شود
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2 space-x-reverse">
                      <RadioGroupItem value="surah" id="surah" />
                      <div className="flex-1">
                        <Label htmlFor="surah" className="font-medium cursor-pointer">
                          بر اساس سوره
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          فقط آیات یک سوره خاص به صورت تصادفی نمایش داده می‌شود
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Surah Selection */}
                {type === "surah" && (
                  <div className="space-y-2">
                    <Label htmlFor="surah-select">انتخاب سوره</Label>
                    <Select
                      value={selectedSurah?.toString()}
                      onValueChange={(v) => setSelectedSurah(parseInt(v))}
                    >
                      <SelectTrigger id="surah-select">
                        <SelectValue placeholder="یک سوره انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {QURAN_SURAHS.map((surah) => (
                          <SelectItem key={surah.number} value={surah.number.toString()}>
                            {surah.number}. {surah.persianName} ({surah.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
