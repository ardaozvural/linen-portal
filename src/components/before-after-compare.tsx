"use client"

import React, { useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

type BeforeAfterCompareProps = {
  beforeSrc: string
  afterSrc: string
  value: number
  onChange: (value: number) => void
  className?: string
  imageClassName?: string
  aspectClassName?: string
  debug?: boolean
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
  debug = false,
}: BeforeAfterCompareProps) {
  const imageRef = useRef<HTMLDivElement | null>(null)

  const draggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const prevOverflowRef = useRef<string | null>(null)

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) console.log("[Compare]", ...args)
    },
    [debug],
  )

  const lockScroll = () => {
    if (typeof document === "undefined") return
    if (prevOverflowRef.current != null) return
    prevOverflowRef.current = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
  }

  const unlockScroll = () => {
    if (typeof document === "undefined") return
    if (prevOverflowRef.current == null) return
    document.documentElement.style.overflow = prevOverflowRef.current
    prevOverflowRef.current = null
  }

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const rect = imageRef.current?.getBoundingClientRect()
      if (!rect || rect.width <= 0) return
      const next = ((clientX - rect.left) / rect.width) * 100
      onChange(clamp(next, 0, 100))
    },
    [onChange],
  )

  const onImagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    draggingRef.current = true
    pointerIdRef.current = e.pointerId

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
      log("DOWN", { pointerId: e.pointerId, pointerType: e.pointerType, buttons: e.buttons })
      log("capture set:", e.currentTarget.hasPointerCapture(e.pointerId))
    } catch (err) {
      log("setPointerCapture FAILED:", err)
    }

    lockScroll()
    document.body.style.userSelect = "none"
    updateFromClientX(e.clientX)
  }

  const onImagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return
    e.preventDefault()
    updateFromClientX(e.clientX)
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return

    draggingRef.current = false
    pointerIdRef.current = null

    document.body.style.userSelect = ""
    unlockScroll()

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
        log("capture released")
      }
    } catch (err) {
      log("releasePointerCapture FAILED:", err)
    }
  }

  const onLostPointerCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return
    log("LOST CAPTURE — drag aborted", { pointerId: e.pointerId })
    draggingRef.current = false
    pointerIdRef.current = null
    document.body.style.userSelect = ""
    unlockScroll()
  }

  return (
    <div className={cn("space-y-3 select-none touch-none", className)}>
      {/* IMAGE COMPARE */}
      <div
        ref={imageRef}
        className={cn(
          "relative rounded-md border bg-background overflow-hidden cursor-ew-resize",
          imageClassName,
          aspectClassName,
        )}
        onPointerDown={onImagePointerDown}
        onPointerMove={onImagePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={onLostPointerCapture}
      >
        <img
          src={afterSrc}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          alt="Sonra"
          draggable={false}
          onDragStart={(ev) => ev.preventDefault()}
        />
        <img
          src={beforeSrc}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
          alt="Önce"
          draggable={false}
          onDragStart={(ev) => ev.preventDefault()}
        />

        <div className="pointer-events-none absolute top-3 left-3 text-[10px] px-2 py-1 rounded-sm border border-border bg-card text-muted-foreground">
          ÖNCE
        </div>
        <div className="pointer-events-none absolute top-3 right-3 text-[10px] px-2 py-1 rounded-sm border border-border bg-card text-muted-foreground">
          SONRA
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-[2px] bg-card/70 shadow"
          style={{ left: `${value}%`, transform: "translateX(-50%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-7 rounded-full border border-border bg-card shadow-sm"
          style={{ left: `${value}%` }}
        />
      </div>

      {/* TRACK = SHADCN SLIDER (drag kesin) */}
      <div className="px-1">
        <Slider value={[value]} onValueChange={(v) => onChange(v[0] ?? 0)} max={100} step={1} />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground select-none">
          <span>Önce</span>
          <span>Sonra</span>
        </div>
      </div>
    </div>
  )
}
