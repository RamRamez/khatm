import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QURAN_SURAHS } from "@/lib/quran-data";
import { createClient } from "@/lib/supabase/server";
import { BookMarked, BookOpen, Calendar, Settings } from 'lucide-react';
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();

  // Only show public campaigns on homepage
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("is_public", true)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper functions
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  function getSurahName(surahNumber: number) {
    const surah = QURAN_SURAHS.find(s => s.number === surahNumber);
    return surah?.persianName || '';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        {/* Admin Button */}
        {user && (
          <div className="mb-4">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                پنل مدیریت
              </Button>
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            ختم قرآن کریم
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            در کمپین های ختم قرآن شرکت کنید و با خواندن آیات قرآن کریم به ختم جمعی کمک کنید
          </p>
        </div>

        {/* Campaigns Grid */}
        {campaigns && campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                    <Badge variant={campaign.is_active ? "default" : "secondary"}>
                      {campaign.is_active ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {campaign.type === "general" ? (
                      <span>ختم کامل قرآن کریم</span>
                    ) : (
                      <span>سوره {campaign.surah_name}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Campaign Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>تاریخ ایجاد:</span>
                        <span className="font-medium text-foreground">
                          {formatDate(campaign.created_at)}
                        </span>
                      </div>

                      {!campaign.is_active && campaign.updated_at && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>تاریخ پایان:</span>
                          <span className="font-medium text-foreground">
                            {formatDate(campaign.updated_at)}
                          </span>
                        </div>
                      )}

                      {campaign.current_surah_number && campaign.current_verse_number && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookMarked className="w-4 h-4" />
                          <span>آخرین آیه:</span>
                          <span className="font-medium text-foreground">
                            سوره {getSurahName(campaign.current_surah_number)}، آیه {campaign.current_verse_number > 1 ? campaign.current_verse_number - 1 : campaign.current_verse_number}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookMarked className="w-4 h-4" />
                        <span>تعداد ختم:</span>
                        <span className="font-medium text-foreground">
                          {campaign.completion_count || 0} بار
                        </span>
                      </div>
                    </div>

                    {/* Action Button - Only for active campaigns */}
                    {campaign.is_active && (
                      <Link href={`/campaign/${campaign.slug}`}>
                        <Button className="w-full text-lg h-12" size="lg">
                          شروع قرائت
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto text-center py-12">
            <CardContent>
              <p className="text-muted-foreground text-lg">
                در حال حاضر کمپینی وجود ندارد
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
