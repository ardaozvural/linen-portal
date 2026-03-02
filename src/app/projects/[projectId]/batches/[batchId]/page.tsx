// src/app/projects/[projectId]/batches/[batchId]/page.tsx
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import Gallery from "./Gallery"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function BatchPage({
  params,
}: {
  params: Promise<{ projectId: string; batchId: string }>
}) {
  const { projectId, batchId } = await params

  const { data: images, error } = await supabase
    .from("images")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true })

  const count = images?.length ?? 0
  const pendingCount = (images ?? []).filter((i: any) => (i.status ?? "pending") === "pending").length
  const approvedCount = (images ?? []).filter((i: any) => i.status === "approved").length
  const revisionCount = (images ?? []).filter((i: any) => i.status === "revision").length

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="text-xs font-medium tracking-[0.22em]"
              style={{ letterSpacing: "0.22em" }}
            >
              LINEN
            </div>
            <div className="h-4 w-px bg-[var(--border)]" />
            <Link
              href="/dashboard"
              className="text-sm text-[color:var(--color-text-secondary,#635B52)] hover:underline"
            >
              ← Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-[var(--border)]">
              {count} images
            </Badge>
            <Button variant="outline" className="border-[var(--border)]">
              Download ZIP
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-serif leading-tight">
              Batch Review
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-tertiary,#9C9189)]">
              Project: <span className="font-mono">{projectId}</span> · Batch:{" "}
              <span className="font-mono">{batchId}</span>
            </p>
          </div>

          {error ? (
            <div className="text-sm text-red-600">
              Supabase error: {error.message}
            </div>
          ) : null}
        </div>
                  {/* Status summary */}
        {count > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <div className="text-xs text-[color:var(--color-text-tertiary,#9C9189)]">Pending</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-lg font-medium">{pendingCount}</span>
              </div>
            </div>

            <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <div className="text-xs text-[color:var(--color-text-tertiary,#9C9189)]">Approved</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-lg font-medium">{approvedCount}</span>
              </div>
            </div>

            <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <div className="text-xs text-[color:var(--color-text-tertiary,#9C9189)]">Revision</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span className="text-lg font-medium">{revisionCount}</span>
              </div>
            </div>
          </div>
        )}

        {count === 0 ? (
          <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-6">
            ...
          </div>
        ) : (
          <Gallery images={images || []} />
        )}
        {count === 0 ? (
          <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="text-sm text-[color:var(--color-text-secondary,#635B52)]">
              No images in this batch yet.
            </div>
            <div className="mt-1 text-xs text-[color:var(--color-text-tertiary,#9C9189)]">
              Upload images for this batch, then refresh.
            </div>
          </div>
        ) : (
          <Gallery images={images || []} />
        )}
      </div>
    </main>
  )
}
