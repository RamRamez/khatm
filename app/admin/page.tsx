import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, BookOpen } from 'lucide-react';
import CampaignList from "@/components/campaign-list";

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">پنل مدیریت</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">مشاهده سایت</Button>
              </Link>
              <form action="/api/auth/signout" method="post">
                <Button variant="outline" type="submit">
                  خروج
                </Button>
              </form>
            </div>
          </div>

          <Card className="bg-gradient-to-l from-primary/10 to-accent/10">
            <CardHeader>
              <CardTitle>کمپین های قرآنی</CardTitle>
              <CardDescription>
                کمپین های خود را مدیریت کنید یا کمپین جدیدی ایجاد کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/create-campaign">
                <Button size="lg" className="w-full sm:w-auto">
                  <Plus className="w-5 h-5 ml-2" />
                  ایجاد کمپین جدید
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <CampaignList campaigns={campaigns || []} />
      </div>
    </div>
  );
}
