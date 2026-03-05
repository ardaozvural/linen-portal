"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCheck,
  ChevronRight,
  Download,
  FolderKanban,
  Home,
  Images,
  Sparkles,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { BeforeAfterCompare } from "@/components/before-after-compare"
import { updateImageStatus } from "./actions"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

/* ─────────────────────────── types ─────────────────────────── */

type ImageRow = {
  id: string
  before_url: string
  after_url: string
  status: "pending" | "approved" | "revision" | string
  client_note?: string | null
  filename?: string | null
}

/* ─────────────────────────── helpers ───────────────────────── */

function normalizeStatus(s?: string) {
  const v = (s || "pending").toLowerCase()
  if (v === "approved" || v === "revision" || v === "pending") return v
  return "pending"
}

function getExtFromUrl(url?: string) {
  if (!url) return ""
  const clean = url.split("?")[0] || ""
  const last  = clean.split(".").pop() || ""
  if (!last || last.includes("/")) return ""
  return last.toLowerCase()
}

function prettyFilename(img: ImageRow) {
  const raw = (img.filename || "").trim()
  if (raw) return raw
  const url = img.after_url || img.before_url || ""
  try {
    const base = url.split("?")[0].split("/").pop() || ""
    if (base) return base
  } catch { /* noop */ }
  const ext = getExtFromUrl(url)
  return `image-${img.id.slice(0, 8)}${ext ? `.${ext}` : ""}`
}

function statusStyles(status: string) {
  switch (normalizeStatus(status)) {
    case "approved":
      return {
        chipBg: "bg-green-100", chipText: "text-green-700",
        chipBorder: "border-green-200", border: "border-green-200",
        label: "Approved", dotClass: "bg-green-600",
      }
    case "revision":
      return {
        chipBg: "bg-orange-100", chipText: "text-orange-700",
        chipBorder: "border-orange-200", border: "border-orange-200",
        label: "Revision", dotClass: "bg-orange-600",
      }
    default:
      return {
        chipBg: "bg-yellow-100", chipText: "text-yellow-700",
        chipBorder: "border-yellow-200", border: "border-yellow-200",
        label: "Pending", dotClass: "bg-yellow-500",
      }
  }
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path  className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/* ─────────────────────────── component ─────────────────────── */

export default function Gallery({ projectId, batchId }: { projectId: string; batchId: string }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [selected, setSelected]           = useState<ImageRow | null>(null)
  const [localImages, setLocalImages]     = useState<ImageRow[]>([])
  const [isLoadingImages, setIsLoading]   = useState(true)
  const [loadError, setLoadError]         = useState<string | null>(null)
  const [sliderVal, setSliderVal]         = useState(50)
  const [localStatus, setLocalStatus]     = useState<string>("pending")
  const [localNote, setLocalNote]         = useState<string>("")
  const [isSaving, setIsSaving]           = useState(false)
  const [isApprovingAll, setIsApprovingAll] = useState(false)

  /* counts */
  const counts = useMemo(() => ({
    pending:  localImages.filter((i) => normalizeStatus(i.status) === "pending").length,
    approved: localImages.filter((i) => normalizeStatus(i.status) === "approved").length,
    revision: localImages.filter((i) => normalizeStatus(i.status) === "revision").length,
  }), [localImages])

  const batchStatus = useMemo(() => {
    if (counts.revision > 0) return statusStyles("revision")
    if (localImages.length > 0 && counts.approved === localImages.length) return statusStyles("approved")
    return statusStyles("pending")
  }, [counts, localImages.length])

  const selectedStyle = useMemo(
    () => statusStyles(selected?.status ?? "pending"),
    [selected?.status],
  )

  /* fetch images */
  useEffect(() => {
    let active = true
    ;(async () => {
      setIsLoading(true)
      setLoadError(null)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!active) return
      if (!sessionData.session) { router.replace("/"); return }

      const { data, error } = await supabase
        .from("images")
        .select("*")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: true })

      if (!active) return
      if (error) {
        setLoadError(error.message)
        setLocalImages([]); setSelected(null); setIsLoading(false)
        return
      }

      const next = (data || []) as ImageRow[]
      setLocalImages(next)
      setSelected((prev) => {
        if (!next.length) return null
        if (prev) {
          const still = next.find((img) => img.id === prev.id)
          if (still) return still
        }
        return null // do not auto-open
      })
      setIsLoading(false)
    })()
    return () => { active = false }
  }, [batchId, router])

  /* sync form when selection changes */
  useEffect(() => {
    if (!selected) return
    setSliderVal(50)
    setLocalStatus(normalizeStatus(selected.status))
    setLocalNote(selected.client_note ?? "")
  }, [selected])

  /* Escape → close sheet */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  /* save status */
  async function saveStatus(nextStatus: string, nextNote?: string) {
    if (!selected || isSaving) return
    const statusToSave  = normalizeStatus(nextStatus)
    const noteToSave    = typeof nextNote === "string" ? nextNote : localNote
    const toPersist     = statusToSave === "approved" || statusToSave === "revision" ? statusToSave : null
    const prev          = selected

    setSelected({ ...selected, status: statusToSave, client_note: noteToSave })
    setLocalImages((imgs) =>
      imgs.map((img) => img.id === selected.id ? { ...img, status: statusToSave, client_note: noteToSave } : img)
    )
    setLocalStatus(statusToSave)

    try {
      setIsSaving(true)
      if (toPersist) {
        const updated = await updateImageStatus(selected.id, toPersist, noteToSave)
        if (updated) {
          setLocalImages((imgs) =>
            imgs.map((img) =>
              img.id === updated.id
                ? { ...img,
                    status: updated.status ?? img.status,
                    client_note: typeof updated.client_note === "string" ? updated.client_note : img.client_note }
                : img
            )
          )
          setSelected((s) =>
            s && s.id === updated.id
              ? { ...s,
                  status: updated.status ?? s.status,
                  client_note: typeof updated.client_note === "string" ? updated.client_note : s.client_note }
              : s
          )
        }
      }
    } catch {
      setSelected(prev)
      setLocalImages((imgs) =>
        imgs.map((img) => img.id === prev.id ? { ...img, status: prev.status, client_note: prev.client_note } : img)
      )
      setLocalStatus(normalizeStatus(prev.status))
      setLocalNote(prev.client_note ?? "")
    } finally {
      setIsSaving(false)
    }
  }

  /* approve all */
  async function handleApproveAll() {
    if (!localImages.length || isApprovingAll) return
    setIsApprovingAll(true)
    try {
      const rows    = await Promise.all(localImages.map((img) => updateImageStatus(img.id, "approved")))
      const updated = new Map(rows.filter(Boolean).map((r) => [r.id, r]))
      setLocalImages((imgs) =>
        imgs.map((img) => {
          const u = updated.get(img.id)
          if (!u) return img
          return { ...img, status: u.status ?? img.status,
            client_note: typeof u.client_note === "string" ? u.client_note : img.client_note }
        })
      )
      setSelected((s) => {
        if (!s) return s
        const u = updated.get(s.id)
        if (!u) return s
        return { ...s, status: u.status ?? s.status,
          client_note: typeof u.client_note === "string" ? u.client_note : s.client_note }
      })
    } finally {
      setIsApprovingAll(false)
    }
  }

  /* nav items */
  const navItems = [
    { href: "/dashboard",                                label: "Pano",  icon: Home,         badge: null as number | null },
    { href: `/projects/${projectId}`,                    label: "Proje", icon: FolderKanban, badge: null as number | null },
    { href: `/projects/${projectId}/batches/${batchId}`, label: "Batch", icon: Images,        badge: localImages.length },
  ]

  /* ─────────────────────────── render ─────────────────────── */

  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-card flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border">
          <Sparkles className="size-5 text-primary" />
          <span className="font-semibold tracking-wide">Retouchio</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon     = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge !== null && (
                  <span className="ml-auto rounded-sm bg-black/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Batch info footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">Batch ID</div>
          <div className="font-mono text-xs truncate text-foreground">{batchId.slice(0, 16)}…</div>
        </div>
      </aside>

      {/* ══════════════════ MAIN ══════════════════ */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">

            {/* Back */}
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4 mr-1.5" />
                Projeye Dön
              </Button>
            </Link>

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link href="/dashboard" className="hover:text-foreground transition-colors">Pano</Link>
                  <ChevronRight className="size-3.5" />
                  <Link href={`/projects/${projectId}`} className="hover:text-foreground transition-colors">Proje</Link>
                  <ChevronRight className="size-3.5" />
                  <span className="text-foreground font-medium">Batch {batchId.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold">Batch İnceleme</h1>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0", batchStatus.chipBg, batchStatus.chipText, batchStatus.chipBorder)}
                  >
                    {batchStatus.label}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" onClick={() => window.print()}>
                  <Download className="size-4 mr-2" />
                  Toplu İndir
                </Button>
                <Button
                  onClick={handleApproveAll}
                  disabled={isApprovingAll || localImages.length === 0}
                >
                  {isApprovingAll
                    ? <><Spinner className="size-4 mr-2" />İşleniyor…</>
                    : <><CheckCheck className="size-4 mr-2" />Hepsini Onayla</>
                  }
                </Button>
              </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Toplam Görsel", value: localImages.length, color: "text-foreground" },
                { label: "Onaylanan",     value: counts.approved,    color: "text-green-600"   },
                { label: "Bekleyen",      value: counts.pending,     color: "text-yellow-600"  },
                { label: "Revizyon",      value: counts.revision,    color: "text-orange-600"  },
              ].map((stat) => (
                <Card key={stat.label} className="p-5">
                  <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                  <div className={cn("text-2xl font-semibold", stat.color)}>{stat.value}</div>
                </Card>
              ))}
            </div>

            {/* ── Image Grid ── */}
            {isLoadingImages ? (
              <Card className="p-12 text-center">
                <Spinner className="size-6 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Görseller yükleniyor…</p>
              </Card>
            ) : loadError ? (
              <Card className="p-8">
                <p className="text-sm text-destructive font-medium">Hata: {loadError}</p>
              </Card>
            ) : localImages.length === 0 ? (
              <Card className="p-12 text-center">
                <Images className="size-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Bu batch'te henüz görsel yok.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {localImages.map((img) => {
                  const s          = statusStyles(img.status || "pending")
                  const fname      = prettyFilename(img)
                  const isSelected = selected?.id === img.id

                  return (
                    <Card
                      key={img.id}
                      className={cn(
                        "overflow-hidden cursor-pointer transition-all hover:shadow-md",
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2"
                          : "hover:ring-1 hover:ring-border",
                      )}
                      onClick={() => setSelected(img)}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-[3/4] relative bg-muted overflow-hidden">
                        <img
                          src={img.after_url}
                          alt={fname}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                        {/* Status chip */}
                        <div className="absolute top-2 right-2">
                          <span className={cn(
                            "inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded border",
                            s.chipBg, s.chipText, s.chipBorder,
                          )}>
                            {s.label}
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-3 py-2.5 border-t border-border">
                        <div className="text-[11px] font-mono text-muted-foreground truncate" title={fname}>
                          {fname}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══════════════════ SHEET — Item Detail ══════════════════
          • BeforeAfterCompare is OUTSIDE overflow-auto → drag works
          • Control panel below is scrollable
      ═══════════════════════════════════════════════════════════ */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null) }}
      >
        <SheetContent
          side="right"
          showCloseButton
          className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden gap-0"
        >
          {selected && (
            <>
              {/* Sheet header */}
              <SheetHeader className="h-14 shrink-0 border-b border-border px-4 py-0 flex-row items-center gap-2 space-y-0">
                <span className={"size-2 rounded-full shrink-0 " + selectedStyle.dotClass} aria-hidden />
                <SheetTitle
                  className="text-sm font-medium truncate flex-1 text-left"
                  title={prettyFilename(selected)}
                >
                  {prettyFilename(selected)}
                </SheetTitle>
                <span className={cn(
                  "shrink-0 text-xs font-semibold px-2 py-0.5 rounded-sm border mr-6",
                  selectedStyle.chipBg, selectedStyle.chipText, selectedStyle.chipBorder,
                )}>
                  {selectedStyle.label}
                </span>
              </SheetHeader>

              {/* Compare area — NO overflow, drag-safe */}
              <div className="shrink-0 p-4 pb-2">
                <BeforeAfterCompare
                  beforeSrc={selected.before_url}
                  afterSrc={selected.after_url}
                  value={sliderVal}
                  onChange={setSliderVal}
                  imageClassName={selectedStyle.border}
                  aspectClassName="aspect-[3/4]"
                />
              </div>

              {/* Control panel — scrollable */}
              <div className="flex-1 min-h-0 overflow-auto p-4 space-y-5">

                {/* STATUS */}
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-3">
                    Status
                  </p>
                  <RadioGroup
                    value={localStatus}
                    onValueChange={(v) => saveStatus(v, localNote)}
                    className="space-y-1"
                  >
                    {([
                      { value: "pending",  id: "r-pending",  label: "Pending"         },
                      { value: "approved", id: "r-approved", label: "Onayla"          },
                      { value: "revision", id: "r-revision", label: "Revision needed" },
                    ] as const).map(({ value, id, label }) => {
                      const s        = statusStyles(value)
                      const isActive = localStatus === value
                      return (
                        <div
                          key={value}
                          className={cn(
                            "flex items-center gap-3 min-h-[44px] px-3 rounded-md border transition-colors",
                            isActive ? `${s.chipBg} ${s.chipBorder}` : "border-transparent hover:bg-muted",
                          )}
                        >
                          <RadioGroupItem value={value} id={id} />
                          <Label
                            htmlFor={id}
                            className={cn("cursor-pointer font-medium text-sm select-none flex-1", isActive && s.chipText)}
                          >
                            {label}
                          </Label>
                          {isActive && <span className={"size-2 rounded-full shrink-0 " + s.dotClass} aria-hidden />}
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>

                {/* NOTE */}
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-3">
                    Not
                  </p>
                  <Textarea
                    className="resize-none"
                    placeholder="Düzeltilmesi gerekenleri açıklayın…"
                    value={localNote}
                    onChange={(e) => setLocalNote(e.target.value)}
                    onBlur={() => saveStatus(localStatus, localNote)}
                    maxLength={500}
                    rows={3}
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>{localNote.length}/500</span>
                    {isSaving && (
                      <span className="flex items-center gap-1">
                        <Spinner className="size-3" /> Kaydediliyor…
                      </span>
                    )}
                  </div>
                </div>

                {/* Save */}
                <Button
                  disabled={isSaving}
                  className="w-full"
                  onClick={() => saveStatus(localStatus, localNote)}
                >
                  {isSaving
                    ? <><Spinner className="size-4 mr-2" />Kaydediliyor…</>
                    : "Değişiklikleri Kaydet"
                  }
                </Button>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  )
}
