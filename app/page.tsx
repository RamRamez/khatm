import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
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
                  <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                  <CardDescription className="text-base">
                    {campaign.type === "general" ? (
                      <span>ختم کامل قرآن کریم</span>
                    ) : (
                      <span>سوره {campaign.surah_name}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/campaign/${campaign.id}`}>
                    <Button className="w-full text-lg h-12" size="lg">
                      شروع قرائت
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto text-center py-12">
            <CardContent>
              <p className="text-muted-foreground text-lg">
                در حال حاضر کمپین فعالی وجود ندارد
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
