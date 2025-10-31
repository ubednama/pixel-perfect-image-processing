"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface OriginalPreviewProps {
  originalImage: string
  zoom?: number
  viewportBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export function OriginalPreview({ originalImage, zoom = 1, viewportBounds }: OriginalPreviewProps) {
  const showZoomIndicator = zoom > 1 && viewportBounds

  return (
    <div className="p-6 h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-foreground">Original</h3>
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
          <Image
            src={originalImage || "/placeholder.svg"}
            alt="Original image"
            fill
            className="object-contain"
            sizes="(max-width: 320px) 100vw, 320px"
          />

          {showZoomIndicator && viewportBounds && (
            <div
              className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
              style={{
                left: `${viewportBounds.x * 100}%`,
                top: `${viewportBounds.y * 100}%`,
                width: `${viewportBounds.width * 100}%`,
                height: `${viewportBounds.height * 100}%`,
              }}
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-3 text-center">
          {showZoomIndicator ? `Zoomed ${Math.round(zoom * 100)}% • Red box shows viewport` : "Reference image"}
        </p>
      </motion.div>
    </div>
  )
}
