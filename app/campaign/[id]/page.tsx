import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import CampaignReader from "@/components/campaign-reader";
import { getTotalVersesForCampaign } from "@/lib/quran-data";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!campaign) {
    notFound();
  }

  // Get total readings count
  const { count: readingsCount } = await supabase
    .from("verse_readings")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", id);

  const totalVerses = getTotalVersesForCampaign(
    campaign.type as "general" | "surah",
    campaign.surah_number
  );

  const completionCount = Math.floor((readingsCount || 0) / totalVerses);

  return (
    <CampaignReader
      campaign={campaign}
      completionCount={completionCount}
      totalVerses={totalVerses}
    />
  );
}
