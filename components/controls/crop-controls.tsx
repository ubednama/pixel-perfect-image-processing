"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Crop, RotateCcw } from "lucide-react"
import type { ImageEdits } from "@/types/image-edits"

interface CropControlsProps {
  edits: ImageEdits
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void
  originalImage: string
  onZoomReset?: () => void
  onCancel?: () => void
  onCropModeEnter?: () => void
  onCropModeToggle?: (enabled: boolean) => void
}

export function CropControls({
  edits,
  onEditChange,
  originalImage,
  onZoomReset,
  onCancel,
  onCropModeEnter,
  onCropModeToggle,
}: CropControlsProps) {
  const [cropMode, setCropMode] = useState(false)

  const handleActivateCrop = () => {
    if (onZoomReset) {
      onZoomReset()
    }
    setCropMode(true)
    if (onCropModeEnter) {
      onCropModeEnter()
    }
    if (onCropModeToggle) {
      onCropModeToggle(true)
    }
  }

  const handleResetCrop = () => {
    onEditChange(
      {
        crop: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          enabled: false,
        },
      },
      "Reset crop",
    )
  }

  return (
    <div className="space-y-4">
      {/* Normal crop controls */}
      <div className="flex gap-2">
        <Button onClick={handleActivateCrop} className="flex-1 gap-2 bg-transparent" variant="outline">
          <Crop size={16} />
          Crop
        </Button>
        <Button
          onClick={handleResetCrop}
          disabled={!edits.crop.enabled}
          className="h-10 w-10 p-0 bg-transparent"
          variant="outline"
        >
          <RotateCcw size={16} />
        </Button>
      </div>
    </div>
  )
}
