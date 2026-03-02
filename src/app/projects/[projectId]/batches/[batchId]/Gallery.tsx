"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateImageStatus } from "./actions"

export default function Gallery({ images }: { images: any[] }) {
  const [selected, setSelected] = useState<any | null>(null)
  const [sliderVal, setSliderVal] = useState(50)

  return (
    <>
      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative cursor-pointer"
            onClick={() => {
              setSelected(img)
              setSliderVal(50)
            }}
          >
	<div className="aspect-[4/5] w-full rounded-sm border border-[#E5E1DC] bg-white overflow-hidden">
	  <img
	    src={img.after_url}
	    className="w-full h-full object-contain"
	    alt=""
	  />
	</div>
            {/* STATUS BADGE */}
            <div className="absolute top-2 left-2 text-xs px-2 py-1 bg-white border border-[#E5E1DC]">
              {img.status}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-12 z-50">
          <div className="bg-white p-8 w-[900px] space-y-6 relative">
            <button
              className="absolute top-4 right-4 text-sm"
              onClick={() => setSelected(null)}
            >
              Close
            </button>

	<div className="relative aspect-[4/5] w-full max-h-[80vh] border border-[#E5E1DC] overflow-hidden bg-white">              <img
                src={selected.after_url}
                className="absolute inset-0 w-full h-full object-cover"
                alt=""
              />
              <img
                src={selected.before_url}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: `inset(0 ${100 - sliderVal}% 0 0)` }}
                alt=""
              />
            </div>

            <Slider
              value={[sliderVal]}
              onValueChange={(v) => setSliderVal(v[0])}
              max={100}
              step={1}
            />

            <RadioGroup
              defaultValue={selected.status}
              onValueChange={async (value) => {
                await updateImageStatus(selected.id, value as any)
                setSelected({ ...selected, status: value })
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approve" id="approve" />
                <Label htmlFor="approve">Approve</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="revise" id="revise" />
                <Label htmlFor="revise">Request revision</Label>
              </div>
            </RadioGroup>

            <Textarea placeholder="Add note..." />
          </div>
        </div>
      )}
    </>
  )
}
