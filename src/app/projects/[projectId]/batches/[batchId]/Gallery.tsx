// src/app/projects/[projectId]/batches/[batchId]/Gallery.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { updateImageStatus } from "./actions"
import { useRouter } from "next/navigation"

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
  } catch { }

  const ext = getExtFromUrl(url)
  return `image-${img.id.slice(0, 8)}${ext ? `.${ext}` : ""}`
}

function statusStyles(status: string) {
  switch (normalizeStatus(status)) {
    case "approved":
      return {
        chipBg: "bg-[var(--color-approved-light,#E6F0EB)]",
        chipText: "text-[var(--color-approved,#3A6651)]",
        chipBorder: "border-[var(--color-approved,#3A6651)]",
        border: "border-[var(--color-approved,#3A6651)]",
        label: "Approved",
        dot: "#3A6651",
      }
    case "revision":
      return {
        chipBg: "bg-[var(--color-revision-light,#F4EDDB)]",
        chipText: "text-[var(--color-revision,#8A650E)]",
        chipBorder: "border-[var(--color-revision,#8A650E)]",
        border: "border-[var(--color-revision,#8A650E)]",
        label: "Revision",
        dot: "#8A650E",
      }
    default:
      return {
        chipBg: "bg-[var(--card)]",
        chipText: "text-[color:var(--color-text-secondary,#635B52)]",
        chipBorder: "border-[var(--border)]",
        border: "border-[var(--border)]",
        label: "Pending",
        dot: "#9C9189",
      }
  }
}

// Spinner SVG — no extra dep
function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export default function Gallery({ images }: { images: ImageRow[] }) {
  const router = useRouter()

  const [selected, setSelected] = useState<ImageRow | null>(null)
  const [sliderVal, setSliderVal] = useState(50)

  const [localStatus, setLocalStatus] = useState<string>("pending")
  const [localNote, setLocalNote] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [selected])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ── Business logic untouched ──────────────────────────────────────────────
  async function saveStatus(nextStatus: string, nextNote?: string, opts?: { closeAfter?: boolean }) {
    if (!selected) return
    if (isSaving) return

    const statusToSave = normalizeStatus(nextStatus)
    const noteToSave = typeof nextNote === "string" ? nextNote : localNote

    const prev = selected

    // optimistic
    setSelected({ ...selected, status: statusToSave, client_note: noteToSave })
    setLocalStatus(statusToSave)

    try {
      setIsSaving(true)

      await updateImageStatus(selected.id, statusToSave as any)

      router.refresh()

      const shouldClose = opts?.closeAfter ?? false
      if (shouldClose) {
        window.setTimeout(() => {
          setIsSaving(false)
          setSelected(null)
        }, 400)
      } else {
        setIsSaving(false)
      }
    } catch {
      setIsSaving(false)
      setSelected(prev)
      setLocalStatus(normalizeStatus(prev.status))
      setLocalNote(prev.client_note ?? "")
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

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
      {/* ── GRID ─────────────────────────────────────────────────────────── */}
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
                /* min tap height for cards */
                "min-h-[44px]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                s.border,
              ].join(" ")}
            >
              {/* Thumbnail: AFTER only */}
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
                    "absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-sm border",
                    s.chipBg,
                    s.chipText,
                    s.chipBorder,
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
                <div
                  className="text-[11px] font-mono text-[color:var(--color-text-tertiary,#9C9189)] truncate"
                  title={fname}
                >
                  {fname}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── MODAL ────────────────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null)
          }}
        >
          {/*
            Outer: full screen, flex-col, gives modal a max-width on desktop.
            Uses 100dvh so address bar doesn't truncate on mobile.
          */}
          <div className="flex flex-col h-[100dvh] w-full max-w-6xl mx-auto p-2 sm:p-4 md:p-10">
            {/*
              Modal card: flex-col so sticky header works.
              overflow-hidden on this — each inner section self-scrolls.
            */}
            <div className="relative flex flex-col flex-1 min-h-0 rounded-md bg-[var(--card)] shadow-2xl border border-[var(--border)] overflow-hidden">

              {/* ── Sticky modal header ─────────────────────────────────── */}
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 shrink-0">
                {/* filename — truncated with tooltip */}
                <div
                  className={[
                    "flex items-center gap-2 min-w-0 flex-1",
                  ].join(" ")}
                >
                  {/* status dot */}
                  <span
                    className="shrink-0 size-2 rounded-full"
                    style={{ background: selectedStyle.dot }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-sm text-[color:var(--color-text-secondary,#635B52)] truncate"
                    title={prettyFilename(selected)}
                  >
                    {prettyFilename(selected)}
                  </span>
                  {/* status chip — always visible in header */}
                  <span
                    className={[
                      "hidden sm:inline-flex shrink-0 text-xs font-semibold px-2 py-0.5 rounded-sm border",
                      selectedStyle.chipBg,
                      selectedStyle.chipText,
                      selectedStyle.chipBorder,
                    ].join(" ")}
                  >
                    {selectedStyle.label}
                  </span>
                </div>

                {/* Close — always reachable, min 44px tap target */}
                <Button
                  variant="outline"
                  className="shrink-0 border-[var(--border)] min-h-[44px] min-w-[44px] px-4"
                  onClick={() => setSelected(null)}
                  aria-label="Close modal"
                >
                  Close
                </Button>
              </div>

              {/*
                ── Body: flex-col on mobile, flex-row on lg.
                   Each half is independently scrollable.
              */}
              <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

                {/* ── Left: compare + slider ─────────────────────────── */}
                <div className="flex flex-col flex-1 min-h-0 p-4">
                  {/*
                    Compare area: use aspect-ratio rather than vh units so it
                    behaves correctly inside a scrollable flex child.
                  */}
                  <div
                    className={[
                      "relative w-full flex-1 min-h-0 rounded-md border bg-[var(--background)] overflow-hidden",
                      "aspect-[3/4] sm:aspect-[4/3] lg:aspect-[3/4]",
                      selectedStyle.border,
                    ].join(" ")}
                  >
                    {/* AFTER (base layer) */}
                    <img
                      src={selected.after_url}
                      className="absolute inset-0 w-full h-full object-contain"
                      alt="After"
                      draggable={false}
                    />
                    {/* BEFORE (clipped by slider) — clipPath logic unchanged */}
                    <img
                      src={selected.before_url}
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ clipPath: `inset(0 ${100 - sliderVal}% 0 0)` }}
                      alt="Before"
                      draggable={false}
                    />

                    {/* Labels */}
                    <div className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-sm border border-[var(--border)] bg-[var(--card)] text-[color:var(--color-text-tertiary,#9C9189)]">
                      BEFORE
                    </div>
                    <div className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-sm border border-[var(--border)] bg-[var(--card)] text-[color:var(--color-text-tertiary,#9C9189)]">
                      AFTER
                    </div>

                    {/* Live slider divider line */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 w-[2px] bg-white/70 shadow"
                      style={{ left: `${sliderVal}%`, transform: "translateX(-50%)" }}
                    />
                  </div>

                  {/* Slider — below compare area, good touch target */}
                  <div className="mt-4 px-1">
                    <Slider
                      value={[sliderVal]}
                      onValueChange={(v) => setSliderVal(v[0] ?? 50)}
                      max={100}
                      step={1}
                      aria-label="Before / After comparison slider"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-[color:var(--color-text-tertiary,#9C9189)] select-none">
                      <span>Before</span>
                      <span>After</span>
                    </div>
                  </div>
                </div>

                {/* ── Right: controls ────────────────────────────────── */}
                <div
                  className={[
                    "overflow-y-auto",
                    "lg:w-[300px] xl:w-[320px] shrink-0",
                    "border-t lg:border-t-0 lg:border-l border-[var(--border)]",
                    "bg-[var(--card)] p-4 lg:p-5 space-y-5",
                  ].join(" ")}
                >
                  {/* STATUS */}
                  <div>
                    <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--color-text-tertiary,#9C9189)]">
                      STATUS
                    </div>

                    <RadioGroup
                      value={localStatus}
                      onValueChange={(value) => saveStatus(value, localNote)}
                      className="mt-3 space-y-1"
                    >
                      {/* Each row ≥ 44px via min-h */}
                      {(
                        [
                          { value: "pending", id: "r-pending", label: "Pending" },
                          { value: "approved", id: "r-approved", label: "Approve" },
                          { value: "revision", id: "r-revision", label: "Revision needed" },
                        ] as const
                      ).map(({ value, id, label }) => {
                        const s = statusStyles(value)
                        const isActive = localStatus === value
                        return (
                          <div
                            key={value}
                            className={[
                              "flex items-center gap-3 min-h-[44px] px-3 rounded-md border transition-colors",
                              isActive
                                ? `${s.chipBg} ${s.chipBorder}`
                                : "border-transparent hover:bg-[var(--background)]",
                            ].join(" ")}
                          >
                            <RadioGroupItem value={value} id={id} />
                            <Label
                              htmlFor={id}
                              className={[
                                "cursor-pointer font-medium text-sm select-none flex-1",
                                isActive ? s.chipText : "",
                              ].join(" ")}
                            >
                              {label}
                            </Label>
                            {isActive && (
                              <span
                                className="size-2 rounded-full shrink-0"
                                style={{ background: s.dot }}
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        )
                      })}
                    </RadioGroup>
                  </div>

                  {/* NOTE */}
                  <div>
                    <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--color-text-tertiary,#9C9189)]">
                      NOTE
                    </div>

                    <Textarea
                      className="mt-3 resize-none"
                      placeholder="Describe what needs adjusting…"
                      value={localNote}
                      onChange={(e) => setLocalNote(e.target.value)}
                      onBlur={() => saveStatus(localStatus, localNote)}
                      maxLength={500}
                      rows={4}
                    />
                    <div className="mt-1.5 flex justify-between text-[11px] text-[color:var(--color-text-tertiary,#9C9189)]">
                      <span>{localNote.length}/500</span>
                      {isSaving && <span className="flex items-center gap-1"><Spinner className="size-3" />Saving…</span>}
                    </div>
                  </div>

                  {/* SAVE */}
                  <div className="pt-1">
                    <Button
                      disabled={isSaving}
                      className="w-full min-h-[44px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                      style={{
                        background: isSaving ? "var(--border)" : "var(--accent)",
                        color: "var(--accent-foreground)",
                        opacity: isSaving ? 0.8 : 1,
                      }}
                      onClick={() => saveStatus(localStatus, localNote, { closeAfter: true })}
                    >
                      {isSaving ? (
                        <>
                          <Spinner className="size-4" />
                          Saving…
                        </>
                      ) : (
                        "Save & Close"
                      )}
                    </Button>

                    {/* Esc hint — hidden on touch devices where it's irrelevant */}
                    <div className="mt-2.5 hidden sm:block text-[11px] text-[color:var(--color-text-tertiary,#9C9189)]">
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