import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function Dashboard() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, client_name, slug, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <main className="min-h-screen bg-background text-foreground p-8 sm:p-12 lg:p-16">
        <h1 className="text-4xl font-serif mb-6">Yapay Zeka Destekli Görsel Optimizasyon</h1>
        <p className="text-sm text-muted-foreground">Supabase hatası: {error.message}</p>
      </main>
    )
  }

  const count = projects?.length ?? 0

  return (
    <main className="min-h-screen bg-background text-foreground p-8 sm:p-12 lg:p-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-4xl font-serif">Yapay Zeka Destekli Görsel Optimizasyon</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ürün ve model bütünlüğü korunur, stüdyo kalite yükselir.</p>
        </div>

        <Badge variant="outline" className="border-border text-foreground">
          {count} proje
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {(projects ?? []).map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="block">
            <Card className="shadow-sm hover:shadow-md transition border-border bg-card cursor-pointer">
              <CardContent className="p-6 space-y-5">
                <div className="rounded-sm border border-border bg-background p-6">
                  <div className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Proje</div>
                  <div className="mt-1 text-lg font-medium text-foreground">{p.name}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-foreground">{p.client_name}</div>
                  <div className="text-xs text-muted-foreground">Aç →</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {count === 0 && <div className="mt-10 text-sm text-muted-foreground">Henüz proje yok.</div>}
    </main>
  )
}
