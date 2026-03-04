"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Gallery from "./Gallery"

export default function BatchPage() {
  const router = useRouter()
  const params = useParams<{ projectId: string; batchId: string }>()
  const projectId = params?.projectId
  const batchId = params?.batchId

  useEffect(() => {
    if (!projectId || !batchId) return
    let active = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (active && !data.session) {
        router.replace("/")
      }
    })()
    return () => {
      active = false
    }
  }, [batchId, projectId, router])

  if (!projectId || !batchId) return null

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Gallery projectId={projectId} batchId={batchId} />
    </main>
  )
}
