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
  compact?: boolean;
}

export function OriginalPreview({
  originalImage,
  zoom = 1,
  viewportBounds,
  compact = false,
}: OriginalPreviewProps) {
  const showZoomIndicator = zoom > 1 && viewportBounds;

  return (
    <div className={compact ? "h-full w-full" : "h-full p-6"}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={compact ? "h-full w-full" : ""}
      >
        {!compact && (
          <h3 className="text-foreground mb-4 text-lg font-semibold">
            Original
          </h3>
        )}
        <div
          className={`bg-muted border-border relative overflow-hidden border ${
            compact ? "h-full w-full" : "aspect-square rounded-lg"
          }`}
        >
          <Image
            src={originalImage || "/placeholder.svg"}
            alt="Original image"
            fill
            className="object-contain"
            sizes={compact ? "150px" : "(max-width: 320px) 100vw, 320px"}
          />

          {showZoomIndicator && viewportBounds && (
            <div
              className={`pointer-events-none absolute border-red-500 bg-red-500/20 ${
                compact ? "border" : "border-2"
              }`}
              style={{
                left: `${Math.max(0, viewportBounds.x * 100)}%`,
                top: `${Math.max(0, viewportBounds.y * 100)}%`,
                width: `${Math.min(100, viewportBounds.width * 100)}%`,
                height: `${Math.min(100, viewportBounds.height * 100)}%`,
              }}
            />
          )}
        </div>
        {!compact && (
          <p className="text-muted-foreground mt-3 text-center text-sm">
            {showZoomIndicator
              ? `Zoomed ${Math.round(zoom * 100)}% \u2022 Red box shows viewport`
              : "Reference image"}
          </p>
        )}
      </motion.div>
    </div>
  );
}
