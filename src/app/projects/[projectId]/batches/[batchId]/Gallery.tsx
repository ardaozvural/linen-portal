"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  CheckCheck,
  ChevronRight,
  Download,
  FolderKanban,
  Home,
  Images,
  PanelLeft,
  X,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
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
    const clean = url.split("?")[0]
    const base  = clean.split("/").pop() || ""
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
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/* ─────────────────────────── component ─────────────────────── */

export default function Gallery({ projectId, batchId }: { projectId: string; batchId: string }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMdUp, setIsMdUp]                     = useState(false)
  const [selected, setSelected]                 = useState<ImageRow | null>(null)
  const [localImages, setLocalImages]           = useState<ImageRow[]>([])
  const [isLoadingImages, setIsLoadingImages]   = useState(true)
  const [loadError, setLoadError]               = useState<string | null>(null)
  const [sliderVal, setSliderVal]               = useState(50)
  const [localStatus, setLocalStatus]           = useState<string>("pending")
  const [localNote, setLocalNote]               = useState<string>("")
  const [isSaving, setIsSaving]                 = useState(false)
  const [isApprovingAll, setIsApprovingAll]     = useState(false)

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

  /* fetch images */
  useEffect(() => {
    let active = true
    ;(async () => {
      setIsLoadingImages(true)
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
        setLocalImages([])
        setSelected(null)
        setIsLoadingImages(false)
        return
      }

      const nextImages = (data || []) as ImageRow[]
      setLocalImages(nextImages)
      setSelected((prev) => {
        if (!nextImages.length) return null
        if (prev) {
          const stillThere = nextImages.find((img) => img.id === prev.id)
          if (stillThere) return stillThere
        }
        return null   // otomatik açılmayı kapat
      })
      setIsLoadingImages(false)
    })()
    return () => { active = false }
  }, [batchId, router])

  /* sync local form state when selection changes */
  useEffect(() => {
    if (!selected) return
    setSliderVal(50)
    setLocalStatus(normalizeStatus(selected.status))
    setLocalNote(selected.client_note ?? "")
  }, [selected])

  /* keyboard close */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  /* body scroll lock while modal is open */
  useEffect(() => {
    if (!selected) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [selected])

  /* responsive breakpoint */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = () => setIsMdUp(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const selectedStyle = useMemo(() => statusStyles(selected?.status ?? "pending"), [selected?.status])

  /* save */
  async function saveStatus(nextStatus: string, nextNote?: string) {
    if (!selected || isSaving) return
    const statusToSave = normalizeStatus(nextStatus)
    const noteToSave   = typeof nextNote === "string" ? nextNote : localNote
    const statusToPersist =
      statusToSave === "approved" || statusToSave === "revision" ? statusToSave : null
    const prev = selected

    setSelected({ ...selected, status: statusToSave, client_note: noteToSave })
    setLocalImages((imgs) =>
      imgs.map((img) => img.id === selected.id ? { ...img, status: statusToSave, client_note: noteToSave } : img)
    )
    setLocalStatus(statusToSave)

    try {
      setIsSaving(true)
      if (statusToPersist) {
        const updated = await updateImageStatus(selected.id, statusToPersist, noteToSave)
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

  async function handleApproveAll() {
    if (localImages.length === 0 || isApprovingAll) return
    setIsApprovingAll(true)
    try {
      const updatedRows = await Promise.all(localImages.map((img) => updateImageStatus(img.id, "approved")))
      const updatedMap  = new Map(updatedRows.filter(Boolean).map((row) => [row.id, row]))
      setLocalImages((imgs) =>
        imgs.map((img) => {
          const u = updatedMap.get(img.id)
          if (!u) return img
          return { ...img, status: u.status ?? img.status,
            client_note: typeof u.client_note === "string" ? u.client_note : img.client_note }
        })
      )
      setSelected((s) => {
        if (!s) return s
        const u = updatedMap.get(s.id)
        if (!u) return s
        return { ...s, status: u.status ?? s.status,
          client_note: typeof u.client_note === "string" ? u.client_note : s.client_note }
      })
    } finally {
      setIsApprovingAll(false)
    }
  }

  const navItems = [
    { href: "/dashboard",                                  label: "Pano",  icon: Home,         badge: null as number | null },
    { href: `/projects/${projectId}`,                      label: "Proje", icon: FolderKanban, badge: null as number | null },
    { href: `/projects/${projectId}/batches/${batchId}`,   label: "Batch", icon: Images,        badge: localImages.length },
  ]

  /* ── Sidebar control panel (shared between mobile & desktop modal) ── */
  const ControlPanel = () => {
    if (!selected) return null
    return (
      <Card className="shadow-sm border-border overflow-hidden h-full flex flex-col">
        {/* card header */}
        <div className="border-b border-border bg-card px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={"size-2 rounded-full shrink-0 " + selectedStyle.dotClass} aria-hidden />
            <p className="text-sm font-medium truncate" title={prettyFilename(selected)}>
              {prettyFilename(selected)}
            </p>
            <span className={cn(
              "ml-auto inline-flex shrink-0 text-xs font-semibold px-2 py-0.5 rounded-sm border",
              selectedStyle.chipBg, selectedStyle.chipText, selectedStyle.chipBorder
            )}>
              {selectedStyle.label}
            </span>
          </div>
        </div>

        {/* card body */}
        <div className="p-4 space-y-4 overflow-auto flex-1">
          {/* status */}
          <div>
            <div className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">STATUS</div>
            <RadioGroup
              value={localStatus}
              onValueChange={(v) => saveStatus(v, localNote)}
              className="mt-3 space-y-1"
            >
              {([
                { value: "pending",  id: "r-pending",  label: "Pending"          },
                { value: "approved", id: "r-approved", label: "Onayla"           },
                { value: "revision", id: "r-revision", label: "Revision needed"  },
              ] as const).map(({ value, id, label }) => {
                const s        = statusStyles(value)
                const isActive = localStatus === value
                return (
                  <div
                    key={value}
                    className={cn(
                      "flex items-center gap-3 min-h-[44px] px-3 rounded-md border transition-colors",
                      isActive ? `${s.chipBg} ${s.chipBorder}` : "border-transparent hover:bg-background"
                    )}
                  >
                    <RadioGroupItem value={value} id={id} />
                    <Label htmlFor={id}
                      className={cn("cursor-pointer font-medium text-sm select-none flex-1", isActive && s.chipText)}>
                      {label}
                    </Label>
                    {isActive && <span className={"size-2 rounded-full shrink-0 " + s.dotClass} aria-hidden />}
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* note */}
          <div>
            <div className="text-xs font-semibold tracking-[0.14em] text-muted-foreground">NOTE</div>
            <Textarea
              className="mt-3 resize-none"
              placeholder="Describe what needs adjusting…"
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              onBlur={() => saveStatus(localStatus, localNote)}
              maxLength={500}
              rows={4}
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>{localNote.length}/500</span>
              {isSaving && (
                <span className="flex items-center gap-1">
                  <Spinner className="size-3" /> Saving…
                </span>
              )}
            </div>
          </div>

          <Button
            disabled={isSaving}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
            onClick={() => saveStatus(localStatus, localNote)}
          >
            {isSaving ? <><Spinner className="size-4" /> Saving…</> : "Değişiklikleri kaydet"}
          </Button>
        </div>
      </Card>
    )
  }

  /* ─────────────────────────── render ─────────────────────── */

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen flex">

        {/* Sidebar */}
        <aside className={cn(
          "hidden md:flex h-screen sticky top-0 border-r border-border bg-card flex-col transition-all duration-200",
          sidebarCollapsed ? "w-20" : "w-64"
        )}>
          <div className="h-16 px-3 border-b border-border flex items-center justify-between">
            <div className={cn("font-semibold tracking-wide", sidebarCollapsed && "hidden")}>Retouchio</div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed((v) => !v)}>
              <PanelLeft className="size-4" />
            </Button>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon     = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm border transition-colors",
                    isActive
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted"
                  )}>
                  <Icon className="size-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.badge !== null && (
                        <span className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">

          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur h-24">
            <div className="h-full px-4 md:px-6 py-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground">Pano</Link>
                <ChevronRight className="size-4" />
                <Link href={`/projects/${projectId}`} className="hover:text-foreground">Proje</Link>
                <ChevronRight className="size-4" />
                <span className="text-foreground">Batch {batchId.slice(0, 8)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <h1 className="text-xl md:text-2xl font-semibold truncate">Batch İnceleme Alanı</h1>
                  <Badge variant="outline"
                    className={cn("shrink-0", batchStatus.chipBg, batchStatus.chipText, batchStatus.chipBorder)}>
                    {batchStatus.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" className="border-border" onClick={() => window.print()}>
                    <Download className="size-4" />
                    <span className="hidden sm:inline">Toplu indir</span>
                  </Button>
                  <Button onClick={handleApproveAll} disabled={isApprovingAll || localImages.length === 0}>
                    {isApprovingAll ? <Spinner className="size-4" /> : <CheckCheck className="size-4" />}
                    <span className="hidden sm:inline">Hepsini onayla</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Grid */}
          <main className="flex-1 overflow-hidden p-4 md:p-6">
            <div className="h-full flex flex-col gap-4 overflow-hidden">
              {/* counts */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Badge variant="outline" className="shrink-0 border-yellow-200 bg-yellow-100 text-yellow-700">
                  Pending {counts.pending}
                </Badge>
                <Badge variant="outline" className="shrink-0 border-green-200 bg-green-100 text-green-700">
                  Approved {counts.approved}
                </Badge>
                <Badge variant="outline" className="shrink-0 border-orange-200 bg-orange-100 text-orange-700">
                  Revision {counts.revision}
                </Badge>
              </div>

              {/* image grid */}
              <div className="flex-1 overflow-auto">
                {isLoadingImages ? (
                  <Card className="p-6 shadow-sm">
                    <p className="text-sm text-muted-foreground">Görseller yükleniyor...</p>
                  </Card>
                ) : loadError ? (
                  <Card className="p-6 shadow-sm">
                    <p className="text-sm text-destructive">Supabase hatası: {loadError}</p>
                  </Card>
                ) : localImages.length === 0 ? (
                  <Card className="p-6 shadow-sm">
                    <p className="text-sm text-muted-foreground">Bu batch&#39;te henüz görsel yok.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {localImages.map((img) => {
                      const s          = statusStyles(img.status || "pending")
                      const fname      = prettyFilename(img)
                      const isSelected = selected?.id === img.id
                      return (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setSelected(img)}
                          className={cn(
                            "group text-left rounded-md border bg-card shadow-sm transition-all hover:shadow-md min-h-[44px]",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isSelected ? "border-primary ring-1 ring-primary/20" : s.border
                          )}
                        >
                          <div className="relative aspect-[3/4] w-full bg-background overflow-hidden rounded-t-md">
                            <img src={img.after_url} alt={fname}
                              className="absolute inset-0 w-full h-full object-contain"
                              loading="lazy" draggable={false} />
                            <div className={cn(
                              "absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-sm border",
                              s.chipBg, s.chipText, s.chipBorder
                            )}>
                              {s.label}
                            </div>
                          </div>
                          <div className="px-3 py-3 border-t border-border">
                            <div className="text-[11px] font-mono text-muted-foreground truncate" title={fname}>
                              {fname}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          DESKTOP MODAL
          ─ overflow-hidden on the dialog; sadece ControlPanel scroll eder
          ─ BeforeAfterCompare hiçbir overflow-auto container içinde değil
          ═══════════════════════════════════════════════════════ */}
      {selected && isMdUp && (
        /* Backdrop — tıklanınca kapat */
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          {/* Dialog kutusu — event propagation'ı durdur */}
          <div
            className="w-full max-w-[95vw] h-[93svh] rounded-xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="h-14 shrink-0 border-b border-border px-4 flex items-center justify-between">
              <div className="min-w-0 flex items-center gap-2">
                <span className={"size-2 rounded-full shrink-0 " + selectedStyle.dotClass} aria-hidden />
                <p className="text-sm font-medium truncate" title={prettyFilename(selected)}>
                  {prettyFilename(selected)}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Modal body — 2 kolon, overflow-hidden */}
            <div className="flex-1 min-h-0 grid grid-cols-[1fr_300px] gap-4 p-4 overflow-hidden">
              {/* Sol: compare görsel — overflow YOK, drag güvenli alan */}
              <div className="flex flex-col justify-center min-h-0">
                <BeforeAfterCompare
                  beforeSrc={selected.before_url}
                  afterSrc={selected.after_url}
                  value={sliderVal}
                  onChange={setSliderVal}
                  imageClassName={selectedStyle.border}
                  aspectClassName="aspect-[3/4]"
                />
              </div>

              {/* Sağ: kontrol paneli — kendi scroll'u var */}
              <div className="min-h-0 overflow-auto">
                <ControlPanel />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MOBİL MODAL
          ─ Tek kolon, üstten aşağı açılır
          ═══════════════════════════════════════════════════════ */}
      {selected && !isMdUp && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-start"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full h-[92svh] rounded-b-xl border-b border-border bg-background shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="h-14 shrink-0 border-b border-border px-4 flex items-center justify-between">
              <div className="min-w-0 flex items-center gap-2">
                <span className={"size-2 rounded-full shrink-0 " + selectedStyle.dotClass} aria-hidden />
                <p className="text-sm font-medium truncate" title={prettyFilename(selected)}>
                  {prettyFilename(selected)}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                <X className="size-4" />
              </Button>
            </div>

            {/* body — compare önce, scroll sadece aşağıda */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Compare alanı — overflow YOK */}
              <div className="shrink-0 p-3">
                <BeforeAfterCompare
                  beforeSrc={selected.before_url}
                  afterSrc={selected.after_url}
                  value={sliderVal}
                  onChange={setSliderVal}
                  imageClassName={selectedStyle.border}
                  aspectClassName="aspect-[4/3]"
                />
              </div>

              {/* Kontrol paneli — scroll edilebilir */}
              <div className="flex-1 min-h-0 overflow-auto p-3 pt-0">
                <ControlPanel />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
