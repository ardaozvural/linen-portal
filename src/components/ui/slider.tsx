"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full cursor-pointer",
          "data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2",
          /* Use explicit CSS vars so track is always visible in every theme */
          "bg-[var(--slider-track,var(--border,#E6E1DB))]"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute",
            "data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
            /* Accent-coloured filled range */
            "bg-[var(--slider-range,var(--accent,#C05B2F))]"
          )}
        />
      </SliderPrimitive.Track>

      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            /* Larger thumb: 20px → friendlier touch target */
            "block size-5 shrink-0 rounded-full border-2 shadow-md cursor-pointer",
            "border-[var(--slider-thumb-border,var(--border,#E6E1DB))]",
            "bg-[var(--slider-thumb,var(--card,#fff))]",
            "ring-[var(--slider-thumb-ring,var(--accent,#C05B2F))]/30",
            "transition-[box-shadow,transform]",
            "hover:ring-4 hover:scale-110",
            "focus-visible:ring-4 focus-visible:outline-hidden",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }