"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams<{ projectId: string }>()
  const projectId = params?.projectId

  useEffect(() => {
    if (!projectId) return
    let active = true

    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!active) return
      if (!sessionData.session) {
        router.replace("/")
        return
      }

      const { data: batches, error } = await supabase
        .from("batches")
        .select("id")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (!active) return
      if (error || !batches || batches.length === 0) {
        router.replace("/dashboard")
        return
      }

      router.replace(`/projects/${projectId}/batches/${batches[0].id}`)
    })()

    return () => {
      active = false
    }
  }, [projectId, router])

  return null
}
