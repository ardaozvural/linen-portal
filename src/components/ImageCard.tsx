"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type ReviewStatus = "pending" | "approved" | "revision"

export type ImageItem = {
  id: string
  status?: ReviewStatus | null
  before_url?: string | null
  after_url?: string | null
  filename?: string | null
  path?: string | null
  created_at?: string | null
  note?: string | null
}

function statusLabel(s?: ReviewStatus | null) {
  if (s === "approved") return "Approved"
  if (s === "revision") return "Revision"
  return "Pending"
}

function statusClasses(s?: ReviewStatus | null) {
  if (s === "approved") return "bg-green-100 text-green-700 border-green-200"
  if (s === "revision") return "bg-orange-100 text-orange-700 border-orange-200"
  return "bg-muted text-muted-foreground border-border"
}

function prettifyFilename(raw?: string | null) {
  if (!raw) return "Untitled"
  const base = raw.split("/").pop() || raw
  const noExt = base.replace(/\.[a-z0-9]+$/i, "")
  const cleaned = noExt
    .replace(/_result$/i, "")
    .replace(/-result$/i, "")
    .replace(/__+/g, "_")
    .replace(/[_-]+/g, " ")
    .trim()

  if (cleaned.length <= 32) return cleaned
  return cleaned.slice(0, 29) + "…"
}

export function ImageCard({
  image,
  onOpen,
  className,
}: {
  image: ImageItem
  onOpen?: (id: string) => void
  className?: string
}) {
  const beforeSrc = image.before_url ?? ""
  const afterSrc = image.after_url ?? image.before_url ?? ""
  const filename = prettifyFilename(image.filename ?? image.path)

  return (
    <button
      type="button"
      onClick={() => onOpen?.(image.id)}
      className={cn(
        "group relative w-full text-left rounded-md border border-border bg-card shadow-sm",
        "transition-[transform,box-shadow,border-color] duration-150 ease-out",
        "hover:shadow-md hover:scale-[1.01]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-md">
        <div className="relative w-full aspect-[3/4] bg-background">
          {afterSrc ? (
            <Image
              src={afterSrc}
              alt={filename}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              No image
            </div>
          )}

          {beforeSrc && afterSrc ? (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 hidden md:block",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              )}
            >
              <div className="absolute inset-y-0 left-0 w-[30%] overflow-hidden border-r border-border">
                <Image src={beforeSrc} alt="Before" fill className="object-cover" sizes="25vw" />
                <div className="absolute left-3 top-3 rounded-sm bg-card/85 px-2 py-1 text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
                  Before
                </div>
              </div>

              <div className="absolute right-3 top-3 rounded-sm bg-card/85 px-2 py-1 text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
                After
              </div>
            </div>
          ) : null}

          <div className="absolute left-3 top-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-sm border px-2 py-1 text-xs font-medium",
                statusClasses(image.status ?? "pending")
              )}
            >
              {statusLabel(image.status ?? "pending")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border">
        <div className="font-mono text-[11px] text-muted-foreground truncate">{filename}</div>

        {!!image.note && (
          <div className="mt-1 text-xs italic text-muted-foreground truncate">“{image.note}”</div>
        )}
      </div>
    </button>
  )
}
