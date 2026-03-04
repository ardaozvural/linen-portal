"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export function BeforeAfterCard() {
  const [sliderVal, setSliderVal] = useState(50)

  return (
    <Card className="shadow-sm border border-border bg-card">
      <CardContent className="p-6 space-y-6">
        <div className="relative h-80 border border-border rounded-sm overflow-hidden bg-background">
          <img
            src="https://placehold.co/800x1000?text=After"
            className="absolute inset-0 w-full h-full object-cover"
            alt="After"
          />
          <img
            src="https://placehold.co/800x1000?text=Before"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ clipPath: `inset(0 ${100 - sliderVal}% 0 0)` }}
            alt="Before"
          />
        </div>

        <Slider value={[sliderVal]} onValueChange={(v) => setSliderVal(v[0])} max={100} step={1} />

        <RadioGroup defaultValue="approve" className="space-y-2">
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
