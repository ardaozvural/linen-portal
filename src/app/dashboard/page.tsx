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
      <main className="min-h-screen bg-[#F7F5F2] p-16">
        <h1 className="text-4xl font-serif mb-6">Your Projects</h1>
        <p className="text-sm text-[#8A8480]">
          Supabase error: {error.message}
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F5F2] p-16">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h1 className="text-4xl font-serif">Your Projects</h1>
          <p className="mt-2 text-sm text-[#8A8480]">
            Private client deliveries.
          </p>
        </div>
        <Badge variant="outline" className="border-[#E5E1DC] text-[#1C1A18]">
          {projects?.length ?? 0} projects
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {(projects ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="block"
          >
            <Card className="shadow-sm hover:shadow-md transition border border-[#E5E1DC] bg-white cursor-pointer">
              <CardContent className="p-6 space-y-5">
                <div className="rounded-sm border border-[#E5E1DC] bg-[#F7F5F2] p-6">
                  <div className="text-xs text-[#8A8480]">PROJECT</div>
                  <div className="mt-1 text-lg font-medium text-[#1C1A18]">
                    {p.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-[#1C1A18]">
                    {p.client_name}
                  </div>
                  <div className="text-xs text-[#8A8480]">Open →</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(projects ?? []).length === 0 && (
        <div className="mt-10 text-sm text-[#8A8480]">
          No projects yet.
        </div>
      )}
    </main>
  )
}
