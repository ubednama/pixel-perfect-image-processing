"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import type { ImageEdits } from "@/types/image-edits"

interface FilterControlsProps {
  edits: ImageEdits
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void
  originalImage: string
}

interface FilterPreset {
  name: string
  edits: Partial<ImageEdits>
}

const filterPresets: FilterPreset[] = [
  {
    name: "None",
    edits: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      grayscale: false,
      negate: false,
      normalize: false,
    },
  },
  {
    name: "Sepia",
    edits: {
      brightness: 10,
      contrast: 15,
      saturation: -20,
      grayscale: false,
      negate: false,
      normalize: false,
    },
  },
  {
    name: "Vintage",
    edits: {
      brightness: 5,
      contrast: 20,
      saturation: -10,
      grayscale: false,
      negate: false,
      normalize: true,
    },
  },
  {
    name: "Noir",
    edits: {
      brightness: -5,
      contrast: 30,
      saturation: 0,
      grayscale: true,
      negate: false,
      normalize: false,
    },
  },
  {
    name: "Technicolor",
    edits: {
      brightness: 10,
      contrast: 25,
      saturation: 40,
      grayscale: false,
      negate: false,
      normalize: true,
    },
  },
  {
    name: "Arctic",
    edits: {
      brightness: 15,
      contrast: 10,
      saturation: -15,
      grayscale: false,
      negate: false,
      normalize: false,
    },
  },
  {
    name: "High Contrast",
    edits: {
      brightness: 0,
      contrast: 50,
      saturation: 0,
      grayscale: false,
      negate: false,
      normalize: true,
    },
  },
  {
    name: "Inverted",
    edits: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      grayscale: false,
      negate: true,
      normalize: false,
    },
  },
]

export function FilterControls({ edits, onEditChange, originalImage }: FilterControlsProps) {
  const [selectedFilter, setSelectedFilter] = useState("None")
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({})

  useEffect(() => {
    // Generate thumbnails for each filter
    filterPresets.forEach((preset) => {
      generateThumbnail(preset.name, preset.edits)
    })
  }, [originalImage])

  const generateThumbnail = async (filterName: string, filterEdits: Partial<ImageEdits>) => {
    const canvas = canvasRefs.current[filterName]
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const size = 80
      canvas.width = size
      canvas.height = size

      // Calculate crop to center square
      const sourceSize = Math.min(img.width, img.height)
      const sourceX = (img.width - sourceSize) / 2
      const sourceY = (img.height - sourceSize) / 2

      // Build filter string
      const filters = []
      if (filterEdits.brightness !== undefined && filterEdits.brightness !== 0) {
        filters.push(`brightness(${100 + filterEdits.brightness}%)`)
      }
      if (filterEdits.contrast !== undefined && filterEdits.contrast !== 0) {
        filters.push(`contrast(${100 + filterEdits.contrast}%)`)
      }
      if (filterEdits.saturation !== undefined && filterEdits.saturation !== 0) {
        filters.push(`saturate(${100 + filterEdits.saturation}%)`)
      }
      if (filterEdits.grayscale) {
        filters.push("grayscale(100%)")
      }

      ctx.filter = filters.join(" ") || "none"
      ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size)

      // Apply sepia tint for sepia filter
      if (filterName === "Sepia") {
        ctx.globalCompositeOperation = "multiply"
        ctx.fillStyle = "rgba(196, 154, 108, 0.4)"
        ctx.fillRect(0, 0, size, size)
        ctx.globalCompositeOperation = "source-over"
      }

      // Apply blue tint for arctic filter
      if (filterName === "Arctic") {
        ctx.globalCompositeOperation = "multiply"
        ctx.fillStyle = "rgba(173, 216, 230, 0.3)"
        ctx.fillRect(0, 0, size, size)
        ctx.globalCompositeOperation = "source-over"
      }
    }

    img.src = originalImage
  }

  const handleFilterSelect = (preset: FilterPreset) => {
    setSelectedFilter(preset.name)
    onEditChange(preset.edits, `Applied ${preset.name} filter`)
  }

  const handleResetFilter = () => {
    const nonePreset = filterPresets[0] // "None" is always first
    setSelectedFilter("None")
    onEditChange(nonePreset.edits, "Reset filter to None")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Quick Filters</span>
        <Button
          onClick={handleResetFilter}
          disabled={selectedFilter === "None"}
          className="h-8 w-8 p-0 bg-transparent"
          variant="outline"
        >
          <RotateCcw size={14} />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {filterPresets.map((preset, index) => (
          <motion.div
            key={preset.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex-shrink-0"
          >
            <button
              onClick={() => handleFilterSelect(preset)}
              className={`group relative flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                selectedFilter === preset.name
                  ? "bg-primary/20 border-2 border-primary"
                  : "bg-muted/30 border-2 border-transparent hover:border-border"
              }`}
            >
              <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted border border-border">
                <canvas
                  ref={(el) => {
                    canvasRefs.current[preset.name] = el
                  }}
                  className="w-full h-full object-cover"
                  width={80}
                  height={80}
                />
                {selectedFilter === preset.name && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-center min-w-0 max-w-20 truncate">{preset.name}</span>
            </button>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Click any filter to apply it instantly. This will update the adjustment sliders below.
      </p>
    </div>
  )
}
