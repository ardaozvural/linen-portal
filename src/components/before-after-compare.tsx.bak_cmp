"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type BeforeAfterCompareProps = {
  beforeSrc: string
  afterSrc: string
  value: number
  onChange: (value: number) => void
  className?: string
  imageClassName?: string
  aspectClassName?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function BeforeAfterCompare({
  beforeSrc,
  afterSrc,
  value,
  onChange,
  className,
  imageClassName,
  aspectClassName = "aspect-[16/10]",
}: BeforeAfterCompareProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const dragSourceRef = useRef<"image" | "track">("image")
  const activePointerIdRef = useRef<number | null>(null)

  const updateFromClientX = (clientX: number, source: "image" | "track") => {
    const rect =
      source === "image"
        ? imageRef.current?.getBoundingClientRect()
        : trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const next = ((clientX - rect.left) / rect.width) * 100
    onChange(clamp(next, 0, 100))
  }

  const endDrag = (pointerId?: number | null) => {
    if (pointerId != null && rootRef.current?.hasPointerCapture(pointerId)) {
      rootRef.current.releasePointerCapture(pointerId)
    }
    draggingRef.current = false
    activePointerIdRef.current = null
  }

  const onWindowPointerMove = (e: PointerEvent) => {
    if (!draggingRef.current) return
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return
    e.preventDefault()
    updateFromClientX(e.clientX, dragSourceRef.current)
  }

  const onWindowPointerEnd = (e: PointerEvent) => {
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return
    endDrag(activePointerIdRef.current)
  }

  const startDrag = (
    e: React.PointerEvent<HTMLElement>,
    source: "image" | "track",
    captureTarget?: HTMLElement | null,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    dragSourceRef.current = source
    draggingRef.current = true
    activePointerIdRef.current = e.pointerId

    const captureEl = captureTarget ?? rootRef.current
    if (captureEl && captureEl.setPointerCapture) {
      captureEl.setPointerCapture(e.pointerId)
    }

    updateFromClientX(e.clientX, source)
  }

  useEffect(() => {
    window.addEventListener("pointermove", onWindowPointerMove, { passive: false })
    window.addEventListener("pointerup", onWindowPointerEnd)
    window.addEventListener("pointercancel", onWindowPointerEnd)
    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove)
      window.removeEventListener("pointerup", onWindowPointerEnd)
      window.removeEventListener("pointercancel", onWindowPointerEnd)
      endDrag(activePointerIdRef.current)
    }
  }, [])

  const onRootPointerDownCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    const path = e.nativeEvent.composedPath()
    const sourceEl = path.find((node) => {
      if (!(node instanceof HTMLElement)) return false
      return node.dataset.compareSource != null
    }) as HTMLElement | undefined

    const sourceAttr = sourceEl?.dataset.compareSource
    if (!sourceAttr) return

    const source = sourceAttr === "track" ? "track" : "image"
    startDrag(e, source, rootRef.current)
  }

  return (
    <div ref={rootRef} className={cn("space-y-3", className)} onPointerDownCapture={onRootPointerDownCapture}>
      <div
        ref={imageRef}
        className={cn(
          "relative rounded-md border bg-background overflow-hidden touch-none select-none pointer-events-auto cursor-ew-resize",
          imageClassName,
          aspectClassName,
        )}
        style={{ cursor: "ew-resize" }}
        data-compare-source="image"
        onPointerDown={(e) => startDrag(e, "image", e.currentTarget)}
      >
        <img
          src={afterSrc}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          alt="After"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
        <img
          src={beforeSrc}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
          alt="Before"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />

        <div className="pointer-events-none absolute top-3 left-3 text-[10px] px-2 py-1 rounded-sm border border-border bg-card text-muted-foreground">
          BEFORE
        </div>
        <div className="pointer-events-none absolute top-3 right-3 text-[10px] px-2 py-1 rounded-sm border border-border bg-card text-muted-foreground">
          AFTER
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-[2px] bg-card/70 shadow"
          style={{ left: `${value}%`, transform: "translateX(-50%)" }}
        />

        <button
          type="button"
          aria-label="Drag compare handle"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-7 rounded-full border border-border bg-card shadow-sm touch-none pointer-events-auto"
          style={{ left: `${value}%` }}
          data-compare-source="image"
          onPointerDown={(e) => startDrag(e, "image", e.currentTarget)}
        />
      </div>

      <div className="px-1">
        <div
          ref={trackRef}
          className="relative h-2 rounded-full bg-border touch-none select-none pointer-events-auto"
          data-compare-source="track"
          onPointerDown={(e) => startDrag(e, "track", e.currentTarget)}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${value}%` }} />
          <button
            type="button"
            aria-label="Drag track handle"
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full border border-border bg-card shadow-sm touch-none pointer-events-auto"
            style={{ left: `${value}%` }}
            data-compare-source="track"
            onPointerDown={(e) => startDrag(e, "track", e.currentTarget)}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground select-none">
          <span>Before</span>
          <span>After</span>
        </div>
      </div>
    </div>
  )
}
