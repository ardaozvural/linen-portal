import { redirect } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const projectSlug = params.projectId

  // project'i bul
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("slug", projectSlug)
    .single()

  if (pErr || !project) {
    redirect("/dashboard")
  }

  // en güncel batch'i bul
  const { data: batches } = await supabase
    .from("batches")
    .select("id")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1)

  const latest = batches?.[0]
  if (!latest) redirect("/dashboard")

  // direkt batch review'a git
  redirect(`/projects/${project.slug}/batches/${latest.id}`)
}
