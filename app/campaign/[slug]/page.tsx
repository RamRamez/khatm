import { notFound } from 'next/navigation'
import CampaignReader from '@/components/campaign-reader'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: encodedSlug } = await params
  // Decode the slug to handle Persian/Arabic characters
  const slug = decodeURIComponent(encodedSlug)
  const supabase = await createClient()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!campaign) {
    notFound()
  }

  // Use the completion_count field from the database instead of calculating it
  const completionCount = campaign.completion_count || 0

  // Check if user is authenticated for admin button
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <CampaignReader
      campaign={campaign}
      completionCount={completionCount}
      isAdmin={!!user}
    />
  )
}
