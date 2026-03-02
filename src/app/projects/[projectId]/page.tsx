import { redirect } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Params = { projectId: string }

export default async function ProjectPage(props: { params: Params | Promise<Params> }) {
  const { projectId } = await Promise.resolve(props.params)

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single()

  if (pErr || !project) redirect("/dashboard")

  const { data: batches, error: bErr } = await supabase
    .from("batches")
    .select("id")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (bErr || !batches || batches.length === 0) redirect("/dashboard")

  redirect(`/projects/${projectId}/batches/${batches[0].id}`)
}
