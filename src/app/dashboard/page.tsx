import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"

export default async function Dashboard() {
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-screen bg-[#F7F5F2] p-16">
      <h1 className="text-4xl font-serif mb-12">Your Projects</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects?.map((project) => (
          <Link key={project.id} href={`/projects/${project.slug}`}>
            <Card className="shadow-sm hover:shadow-md transition border border-[#E5E1DC] bg-white">
              <CardContent className="p-6 space-y-4">
                <div className="h-40 bg-white border border-[#E5E1DC] rounded-sm" />
                <div>
                  <h2 className="text-lg font-medium">
                    {project.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {project.client_name}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}
