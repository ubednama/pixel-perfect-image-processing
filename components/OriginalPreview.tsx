"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface OriginalPreviewProps {
  originalImage: string;
  zoom?: number;
  viewportBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function OriginalPreview({
  originalImage,
  zoom = 1,
  viewportBounds,
}: OriginalPreviewProps) {
  const showZoomIndicator = zoom > 1 && viewportBounds;

  return (
    <div className="h-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h3 className="text-foreground mb-4 text-lg font-semibold">Original</h3>
        <div className="bg-muted border-border relative aspect-square overflow-hidden rounded-lg border">
          <Image
            src={originalImage || "/placeholder.svg"}
            alt="Original image"
            fill
            className="object-contain"
            sizes="(max-width: 320px) 100vw, 320px"
          />

          {showZoomIndicator && viewportBounds && (
            <div
              className="pointer-events-none absolute border-2 border-red-500 bg-red-500/20"
              style={{
                left: `${viewportBounds.x * 100}%`,
                top: `${viewportBounds.y * 100}%`,
                width: `${viewportBounds.width * 100}%`,
                height: `${viewportBounds.height * 100}%`,
              }}
            />
          )}
        </div>
        <p className="text-muted-foreground mt-3 text-center text-sm">
          {showZoomIndicator
            ? `Zoomed ${Math.round(zoom * 100)}% • Red box shows viewport`
            : "Reference image"}
        </p>
      </motion.div>
    </div>
  );
}
