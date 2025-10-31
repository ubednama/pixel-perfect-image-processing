"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { RotateCcw } from "lucide-react"
import type { ImageEdits } from "@/types/image-edits"

interface EffectControlsProps {
  edits: ImageEdits
  onEditChange: (edits: Partial<ImageEdits>) => void
}

export function EffectControls({ edits, onEditChange }: EffectControlsProps) {
  const handleGrayscaleToggle = (checked: boolean) => {
    onEditChange({ grayscale: checked })
  }

  const handleNegateToggle = (checked: boolean) => {
    onEditChange({ negate: checked })
  }

  const handleBlurChange = (value: number[]) => {
    onEditChange({ blur: value[0] })
  }

  const handleSharpenChange = (value: number[]) => {
    onEditChange({ 
      sharpen: {
        ...edits.sharpen,
        sigma: value[0],
        enabled: value[0] > 0
      }
    })
  }

  const handleGammaChange = (value: number[]) => {
    onEditChange({ gamma: value[0] })
  }

  const handleMedianChange = (value: number[]) => {
    onEditChange({ median: value[0] })
  }

  const handleBlurInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0
    const clampedValue = Math.max(0, Math.min(20, value))
    onEditChange({ blur: clampedValue })
  }

  const handleSharpenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value) || 0
    const clampedValue = Math.max(0, Math.min(10, value))
    onEditChange({ 
      sharpen: {
        ...edits.sharpen,
        sigma: clampedValue,
        enabled: clampedValue > 0
      }
    })
  }

  const handleGammaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value) || 1
    const clampedValue = Math.max(0.1, Math.min(3, value))
    onEditChange({ gamma: clampedValue })
  }

  const handleMedianInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 1
    const clampedValue = Math.max(1, Math.min(7, value))
    onEditChange({ median: clampedValue })
  }

  const resetBlur = () => {
    onEditChange({ blur: 0 })
  }

  const resetSharpen = () => {
    onEditChange({ 
      sharpen: {
        ...edits.sharpen,
        sigma: 0,
        enabled: false
      }
    })
  }

  const resetGrayscale = () => {
    onEditChange({ grayscale: false })
  }

  const resetNegate = () => {
    onEditChange({ negate: false })
  }

  const resetGamma = () => {
    onEditChange({ gamma: 1 })
  }

  const resetMedian = () => {
    onEditChange({ median: 1 })
  }

  return (
    <div className="space-y-6">
      {/* Grayscale */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Grayscale</Label>
        <div className="flex items-center gap-2">
          <Switch checked={edits.grayscale} onCheckedChange={handleGrayscaleToggle} />
          <Button
            variant="outline"
            size="sm"
            onClick={resetGrayscale}
            disabled={!edits.grayscale}
            className="h-8 w-8 p-0 bg-transparent"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      {/* Negate */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Negate</Label>
        <div className="flex items-center gap-2">
          <Switch checked={edits.negate} onCheckedChange={handleNegateToggle} />
          <Button
            variant="outline"
            size="sm"
            onClick={resetNegate}
            disabled={!edits.negate}
            className="h-8 w-8 p-0 bg-transparent"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      {/* Blur */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Blur</Label>
        <div className="space-y-3">
          <Slider value={[edits.blur]} onValueChange={handleBlurChange} min={0} max={20} step={1} className="w-full" />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={edits.blur}
              onChange={handleBlurInputChange}
              min={0}
              max={20}
              className="w-20 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">px</span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetBlur}
              disabled={edits.blur === 0}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Sharpen */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Sharpen</Label>
        <div className="space-y-3">
          <Slider
            value={[edits.sharpen.sigma]}
            onValueChange={handleSharpenChange}
            min={0}
            max={10}
            step={0.1}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={edits.sharpen.sigma}
              onChange={handleSharpenInputChange}
              min={0}
              max={10}
              step={0.1}
              className="w-20 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">σ</span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetSharpen}
              disabled={edits.sharpen.sigma === 0}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Gamma */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Gamma</Label>
        <div className="space-y-3">
          <Slider
            value={[edits.gamma]}
            onValueChange={handleGammaChange}
            min={0.1}
            max={3}
            step={0.1}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={edits.gamma}
              onChange={handleGammaInputChange}
              min={0.1}
              max={3}
              step={0.1}
              className="w-20 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">γ</span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetGamma}
              disabled={edits.gamma === 1}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Median Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Median Filter</Label>
        <div className="space-y-3">
          <Slider
            value={[edits.median]}
            onValueChange={handleMedianChange}
            min={1}
            max={7}
            step={2}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={edits.median}
              onChange={handleMedianInputChange}
              min={1}
              max={7}
              step={2}
              className="w-20 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">px</span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetMedian}
              disabled={edits.median === 1}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
