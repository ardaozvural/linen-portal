"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export default function ImageCard({
  before,
  after,
}: {
  before: string
  after: string
}) {
  const [sliderVal, setSliderVal] = useState(50)

  return (
    <Card className="shadow-sm border border-[#E5E1DC] bg-white">
      <CardContent className="p-6 space-y-6">
        <div className="relative h-96 border border-[#E5E1DC] rounded-sm overflow-hidden">
          <img
            src={after}
            className="absolute inset-0 w-full h-full object-cover"
            alt="After"
          />
          <img
            src={before}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ clipPath: `inset(0 ${100 - sliderVal}% 0 0)` }}
            alt="Before"
          />
        </div>

        <Slider
          value={[sliderVal]}
          onValueChange={(v) => setSliderVal(v[0])}
          max={100}
          step={1}
        />

        <RadioGroup defaultValue="pending" className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="approve" id="approve" />
            <Label htmlFor="approve">Approve</Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="revise" id="revise" />
            <Label htmlFor="revise">Request revision</Label>
          </div>
        </RadioGroup>

        <Textarea placeholder="Add note (optional)..." />
      </CardContent>
    </Card>
  )
}
