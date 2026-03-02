import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  // Project'i slug ile bul
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", projectId)
    .single()

  if (!project) {
    return <div className="p-16">Project not found</div>
  }

  // O projeye ait batch'leri çek
  const { data: batches } = await supabase
    .from("batches")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-screen bg-[#F7F5F2] p-16">
      <div className="flex items-center justify-between mb-12">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Projects
          </Link>
          <h1 className="text-4xl font-serif mt-3">
            {project.name}
          </h1>
        </div>
        <Button variant="outline">Download all</Button>
      </div>

      <div className="space-y-8">
        {batches?.map((batch) => (
          <Card key={batch.id} className="shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">
                  {batch.name}
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {batch.status}
                </div>
              </div>

              <Link
                className="underline"
                href={`/projects/${project.slug}/batches/${batch.id}`}
              >
                Review →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
