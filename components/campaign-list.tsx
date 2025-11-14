"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { useState } from "react";

export default function CampaignList({ campaigns }: { campaigns: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

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
              <Badge variant={campaign.is_active ? "default" : "secondary"}>
                {campaign.is_active ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
