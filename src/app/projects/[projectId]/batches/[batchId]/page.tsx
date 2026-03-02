import { supabase } from "@/lib/supabase"
import Gallery from "./Gallery"

export default async function BatchPage({
  params,
}: {
  params: Promise<{ projectId: string; batchId: string }>
}) {
  const { batchId } = await params

  const { data: images } = await supabase
    .from("images")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true })

  return (
    <main className="min-h-screen bg-[#F7F5F2] p-16">
      <h1 className="text-4xl font-serif mb-12">Batch Review</h1>

      <Gallery images={images || []} />
    </main>
  )
}
