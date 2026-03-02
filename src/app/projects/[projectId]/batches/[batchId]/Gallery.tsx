// src/app/projects/[projectId]/batches/[batchId]/Gallery.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { updateImageStatus } from "./actions"

type ImageRow = {
  id: string
  before_url: string
  after_url: string
  status: "pending" | "approved" | "revision" | string
  client_note?: string | null
  filename?: string | null
}

function normalizeStatus(s?: string) {
  const v = (s || "pending").toLowerCase()
  if (v === "approved" || v === "revision" || v === "pending") return v
  return "pending"
}

function getExtFromUrl(url?: string) {
  if (!url) return ""
  const clean = url.split("?")[0] || ""
  const last = clean.split(".").pop() || ""
  if (!last || last.includes("/")) return ""
  return last.toLowerCase()
}

function prettyFilename(img: ImageRow) {
  const raw = (img.filename || "").trim()
  if (raw) return raw

  const url = img.after_url || img.before_url || ""
  try {
    const clean = url.split("?")[0]
    const base = clean.split("/").pop() || ""
    if (base) return base
  } catch {}

  const ext = getExtFromUrl(url)
  return `image-${img.id.slice(0, 8)}${ext ? `.${ext}` : ""}`
}

function statusStyles(status: string) {
  switch (normalizeStatus(status)) {
    case "approved":
      return {
        chipBg: "bg-[var(--color-approved-light,#E6F0EB)]",
        chipText: "text-[var(--color-approved,#3A6651)]",
        border: "border-[var(--color-approved,#3A6651)]",
        label: "Approved",
      }
    case "revision":
      return {
        chipBg: "bg-[var(--color-revision-light,#F4EDDB)]",
        chipText: "text-[var(--color-revision,#8A650E)]",
        border: "border-[var(--color-revision,#8A650E)]",
        label: "Revision",
      }
    default:
      return {
        chipBg: "bg-[var(--card)]",
        chipText: "text-[color:var(--color-text-secondary,#635B52)]",
        border: "border-[var(--border)]",
        label: "Pending",
      }
  }
}

export default function Gallery({ images }: { images: ImageRow[] }) {
  const [selected, setSelected] = useState<ImageRow | null>(null)
  const [sliderVal, setSliderVal] = useState(50)

  const [localStatus, setLocalStatus] = useState<string>("pending")
  const [localNote, setLocalNote] = useState<string>("")

  const selectedStyle = useMemo(
    () => statusStyles(selected?.status ?? "pending"),
    [selected?.status]
  )

  useEffect(() => {
    if (!selected) return
    setSliderVal(50)
    setLocalStatus(normalizeStatus(selected.status))
    setLocalNote(selected.client_note ?? "")
  }, [selected])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  async function saveStatus(nextStatus: string, nextNote?: string) {
    if (!selected) return

    const statusToSave = normalizeStatus(nextStatus)
    const noteToSave = typeof nextNote === "string" ? nextNote : localNote

    // optimistic UI
    const prev = selected
    setSelected({ ...selected, status: statusToSave, client_note: noteToSave })
    setLocalStatus(statusToSave)

    try {
      // action imzan: (id, status, note)
      await updateImageStatus(selected.id, statusToSave as any)
    } catch {
      setSelected(prev)
      setLocalStatus(normalizeStatus(prev.status))
      setLocalNote(prev.client_note ?? "")
    }
  }

  if (!images || images.length === 0) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="text-sm text-[color:var(--color-text-secondary,#635B52)]">
          No images in this batch yet.
        </div>
        <div className="mt-1 text-xs text-[color:var(--color-text-tertiary,#9C9189)]">
          Upload images for this batch, then refresh.
        </div>
      </div>
    )
  }

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {images.map((img) => {
          const s = statusStyles(img.status || "pending")
          const fname = prettyFilename(img)

          return (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(img)}
              className={[
                "group text-left",
                "rounded-md border bg-[var(--card)]",
                "shadow-sm hover:shadow-md transition",
                "overflow-hidden",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                s.border,
              ].join(" ")}
            >
              {/* Thumbnail: SADECE AFTER (hover split yok) */}
              <div className="relative aspect-[3/4] w-full bg-[var(--background)]">
                <img
                  src={img.after_url}
                  alt={fname}
                  className="absolute inset-0 w-full h-full object-contain"
                  loading="lazy"
                  draggable={false}
                />

                {/* status chip */}
                <div
                  className={[
                    "absolute top-2 left-2 text-xs px-2 py-1 rounded-sm border",
                    "border-[var(--border)]",
                    s.chipBg,
                    s.chipText,
                  ].join(" ")}
                >
                  {s.label}
                </div>

                {/* Compare hint */}
                <div className="pointer-events-none absolute bottom-2 right-2 rounded-sm border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[10px] text-[color:var(--color-text-tertiary,#9C9189)] opacity-0 group-hover:opacity-100 transition">
                  Compare →
                </div>
              </div>

              {/* meta */}
              <div className="px-3 py-3">
                <div className="text-[11px] font-mono text-[color:var(--color-text-tertiary,#9C9189)] truncate">
                  {fname}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] p-4 md:p-10"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null)
          }}
        >
          <div className="mx-auto h-full max-w-6xl">
            <div className="relative h-full rounded-md bg-[var(--card)] shadow-2xl overflow-hidden border border-[var(--border)]">
              {/* header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div className="text-sm text-[color:var(--color-text-secondary,#635B52)]">
                  {prettyFilename(selected)}
                </div>
                <Button
                  variant="outline"
                  className="border-[var(--border)]"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] h-[calc(100%-52px)]">
                {/* left: compare */}
                <div className="p-4">
                  <div
                    className={[
                      "relative w-full h-[70vh] rounded-md border bg-[var(--background)] overflow-hidden",
                      selectedStyle.border,
                    ].join(" ")}
                  >
                    <img
                      src={selected.after_url}
                      className="absolute inset-0 w-full h-full object-contain"
                      alt="After"
                      draggable={false}
                    />
                    <img
                      src={selected.before_url}
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ clipPath: `inset(0 ${100 - sliderVal}% 0 0)` }}
                      alt="Before"
                      draggable={false}
                    />

                    <div className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-sm border border-[var(--border)] bg-[var(--card)] text-[color:var(--color-text-tertiary,#9C9189)]">
                      BEFORE
                    </div>
                    <div className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-sm border border-[var(--border)] bg-[var(--card)] text-[color:var(--color-text-tertiary,#9C9189)]">
                      AFTER
                    </div>
                  </div>

                  <div className="mt-4">
                    <Slider
                      value={[sliderVal]}
                      onValueChange={(v) => setSliderVal(v[0] ?? 50)}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                {/* right: controls */}
                <div className="border-l border-[var(--border)] bg-[color:var(--color-surface-raised,#FDFCFA)] p-4 lg:p-5 space-y-5">
                  <div>
                    <div className="text-xs font-medium tracking-[0.14em] text-[color:var(--color-text-tertiary,#9C9189)]">
                      STATUS
                    </div>

                    <RadioGroup
                      value={localStatus}
                      onValueChange={(value) => saveStatus(value)}
                      className="mt-3 space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pending" id="pending" />
                        <Label htmlFor="pending">Pending</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="approved" id="approved" />
                        <Label htmlFor="approved">Approve</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="revision" id="revision" />
                        <Label htmlFor="revision">Revision needed</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <div className="text-xs font-medium tracking-[0.14em] text-[color:var(--color-text-tertiary,#9C9189)]">
                      NOTE
                    </div>

                    <Textarea
                      className="mt-3"
                      placeholder="Describe what needs adjusting…"
                      value={localNote}
                      onChange={(e) => setLocalNote(e.target.value)}
                      onBlur={() => saveStatus(localStatus, localNote)}
                      maxLength={500}
                    />
                    <div className="mt-2 text-[11px] text-[color:var(--color-text-tertiary,#9C9189)]">
                      {localNote.length}/500
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      className="w-full"
                      style={{
                        background: "var(--accent)",
                        color: "var(--accent-foreground)",
                      }}
                      onClick={() => saveStatus(localStatus, localNote)}
                    >
                      Save
                    </Button>

                    <div className="mt-3 text-[11px] text-[color:var(--color-text-tertiary,#9C9189)]">
                      Tip: Esc closes modal.
                    </div>
                  </div>
                </div>
              </div>
              {/* /body */}
            </div>
          </div>
        </div>
      )}
    </>
  )
}