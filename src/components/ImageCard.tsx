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
  if (s === "approved")
    return "border-[var(--color-approved)] text-[var(--color-approved)] bg-[var(--color-approved-light)]"
  if (s === "revision")
    return "border-[var(--color-revision)] text-[var(--color-revision)] bg-[var(--color-revision-light)]"
  return "border-[var(--color-border)] text-[var(--color-text-secondary)] bg-white"
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
        "group relative w-full text-left",
        "rounded-[var(--radius-md)] border bg-[var(--color-surface)]",
        "border-[var(--color-border)] shadow-[var(--shadow-card)]",
        "transition-[transform,box-shadow,border-color] duration-150 ease-out",
        "hover:shadow-[var(--shadow-hover)] hover:scale-[1.01]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-[var(--radius-md)]">
        <div className="relative w-full aspect-[3/4] bg-[var(--color-surface-raised)]">
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
            <div className="absolute inset-0 grid place-items-center text-sm text-[var(--color-text-tertiary)]">
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
              <div
                className="absolute inset-y-0 left-0 w-[30%] overflow-hidden"
                style={{ borderRight: "1px solid rgba(24,21,15,0.12)" }}
              >
                <Image src={beforeSrc} alt="Before" fill className="object-cover" sizes="25vw" />
                <div className="absolute left-3 top-3 rounded-[var(--radius-sm)] bg-white/85 px-2 py-1 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-secondary)]">
                  Before
                </div>
              </div>

              <div className="absolute right-3 top-3 rounded-[var(--radius-sm)] bg-white/85 px-2 py-1 text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-secondary)]">
                After
              </div>
            </div>
          ) : null}

          <div className="absolute left-3 top-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-2 py-1 text-xs font-medium",
                statusClasses(image.status ?? "pending")
              )}
            >
              {statusLabel(image.status ?? "pending")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[var(--color-border)]">
        <div className="font-mono text-[11px] text-[var(--color-text-tertiary)] truncate">
          {filename}
        </div>

        {!!image.note && (
          <div className="mt-1 text-xs italic text-[var(--color-text-secondary)] truncate">
            “{image.note}”
          </div>
        )}
      </div>
    </button>
  )
}
