"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QURAN_SURAHS } from "@/lib/quran-data";
import { createClient } from "@/lib/supabase/client";
import { BookMarked, Calendar, Check, Copy, Trash2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState } from "react";

export default function CampaignList({ campaigns }: { campaigns: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  const [copiedCampaignId, setCopiedCampaignId] = useState<string | null>(null);

  async function toggleCampaignStatus(campaignId: string, currentStatus: boolean) {
    setLoading(campaignId);
    const supabase = createClient();

    await supabase
      .from("campaigns")
      .update({ is_active: !currentStatus })
      .eq("id", campaignId);

    setLoading(null);
    router.refresh();
  }

  function openDeleteDialog(campaign: any) {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteCampaign() {
    if (!campaignToDelete) return;

    setLoading(campaignToDelete.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignToDelete.id);

    setLoading(null);
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);

    if (error) {
      console.error("Error deleting campaign:", error);
      alert(`خطا در حذف کمپین: ${error.message}\n\nلطفا مطمئن شوید که دسترسی های پایگاه داده را اعمال کرده اید.`);
      return;
    }

    router.refresh();
  }

  async function copyCampaignLink(campaign: any) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const campaignUrl = `${origin}/campaign/${encodeURIComponent(campaign.slug)}`;

    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopiedCampaignId(campaign.id);
      setTimeout(() => setCopiedCampaignId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

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

  if (campaigns.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">
            هنوز کمپینی ایجاد نشده است
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{campaign.name}</CardTitle>
                <CardDescription>
                  {campaign.type === "general" ? (
                    <span>ختم کامل قرآن کریم</span>
                  ) : (
                    <span>سوره {campaign.surah_name}</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={campaign.is_active ? "default" : "secondary"}>
                  {campaign.is_active ? "فعال" : "غیرفعال"}
                </Badge>
                {campaign.is_public ? (
                  <Badge variant="default">عمومی</Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">
                    خصوصی
                  </Badge>
                )}
              </div>
            </div>
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

                {campaign.current_surah_number && campaign.current_verse_number && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookMarked className="w-4 h-4" />
                    <span>آخرین آیه خوانده شده:</span>
                    <span className="font-medium text-foreground">
                      سوره {getSurahName(campaign.current_surah_number)}، آیه {campaign.current_verse_number - 1}
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

              {/* Actions */}
              {/* Copy Link Button - More prominent for private campaigns */}
              <Button
                variant="secondary"
                onClick={() => copyCampaignLink(campaign)}
                disabled={loading === campaign.id}
                className="w-full"
              >
                {copiedCampaignId === campaign.id ? (
                  <>
                    <Check className="w-4 h-4 ml-2" />
                    لینک کپی شد
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 ml-2" />
                    کپی لینک کمپین
                  </>
                )}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant={campaign.is_active ? "destructive" : "default"}
                  onClick={() => toggleCampaignStatus(campaign.id, campaign.is_active)}
                  disabled={loading === campaign.id}
                  className="flex-1"
                >
                  {loading === campaign.id
                    ? "در حال بروزرسانی..."
                    : campaign.is_active
                      ? "غیرفعال کردن"
                      : "فعال کردن"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openDeleteDialog(campaign)}
                  disabled={loading === campaign.id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent >
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کمپین</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید کمپین "{campaignToDelete?.name}" را حذف کنید؟
              <br />
              <span className="text-destructive font-semibold">
                این عملیات غیرقابل بازگشت است و تمام اطلاعات مربوط به این کمپین از دیتابیس حذف خواهد شد.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCampaign}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف کمپین
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
