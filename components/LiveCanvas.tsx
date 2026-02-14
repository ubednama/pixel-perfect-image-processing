"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ImageEdits } from "@/types/image-edits";
import { CropOverlay } from "@/components/CropOverlay";
import { processImageWithSharp, hasImageEdits } from "@/lib/image-processing";

interface LiveCanvasProps {
  image: string;
  edits: ImageEdits;
  onImageUpdate: (imageUrl: string) => void;
  onZoomChange?: (
    zoom: number,
    viewportBounds: { x: number; y: number; width: number; height: number }
  ) => void;
  showOriginal?: boolean;
}

export function LiveCanvas({
  image,
  edits,
  onImageUpdate,
  onZoomChange,
  showOriginal = false,
}: LiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout>();

  const [zoom, setZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleCanvasMouseEnter = () => {
    document.dispatchEvent(new CustomEvent("canvas-enter"));
  };

  const handleCanvasMouseLeave = () => {
    document.dispatchEvent(new CustomEvent("canvas-leave"));
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.25, Math.min(4, prev * delta)));
  }, []);

  useEffect(() => {
    if (
      onZoomChange &&
      containerDimensions.width &&
      containerDimensions.height &&
      imageDimensions.width &&
      imageDimensions.height
    ) {
      const viewportWidth = containerDimensions.width / zoom;
      const viewportHeight = containerDimensions.height / zoom;

      const imageAspect = imageDimensions.width / imageDimensions.height;
      const containerAspect =
        containerDimensions.width / containerDimensions.height;

      let displayWidth, displayHeight;
      if (imageAspect > containerAspect) {
        displayWidth = containerDimensions.width;
        displayHeight = containerDimensions.width / imageAspect;
      } else {
        displayHeight = containerDimensions.height;
        displayWidth = containerDimensions.height * imageAspect;
      }

      const scaleX = displayWidth / imageDimensions.width;
      const scaleY = displayHeight / imageDimensions.height;

      const viewportBounds = {
        x: Math.max(0, (1 - viewportWidth / displayWidth) / 2),
        y: Math.max(0, (1 - viewportHeight / displayHeight) / 2),
        width: Math.min(1, viewportWidth / displayWidth),
        height: Math.min(1, viewportHeight / displayHeight),
      };

      onZoomChange(zoom, viewportBounds);
    }
  }, [zoom, containerDimensions, imageDimensions, onZoomChange]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const processImage = useCallback(async () => {
    if (!image) return;

    setIsProcessing(true);

    try {
      // If showing original or no edits, just use the original image
      if (showOriginal || !hasImageEdits(edits)) {
        setProcessedImage(image);
        if (!showOriginal) {
          onImageUpdate(image);
        }
        setImageLoaded(true);
        setIsProcessing(false);
        return;
      }

      // Use Sharp API for processing
      const result = await processImageWithSharp(image, edits);

      if (result.success && result.imageUrl) {
        setProcessedImage(result.imageUrl);
        if (!showOriginal) {
          onImageUpdate(result.imageUrl);
        }
        setImageLoaded(true);
        setIsProcessing(false);
      } else {
        throw new Error(result.error || "Failed to process image");
      }
    } catch (error) {
      console.error("Error processing image with Sharp:", error);
      // Fallback to original image on error
      setProcessedImage(image);
      if (!showOriginal) {
        onImageUpdate(image);
      }
      setIsProcessing(false);
    }
  }, [image, edits, onImageUpdate, showOriginal]);

  useEffect(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    processingTimeoutRef.current = setTimeout(() => {
      processImage();
    }, 100); // 100ms debounce

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [processImage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleCropChange = useCallback((newEdits: Partial<ImageEdits>) => {
    // This will be passed down from the parent component
  }, []);

  return (
    <div className="relative flex h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative max-h-full max-w-full"
      >
        <div className="border-border/50 relative rounded-lg border bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
          <div
            ref={containerRef}
            className="canvas-container relative overflow-hidden rounded"
            data-canvas-area="true"
            style={{
              cursor: "none",
              width: "100%",
              height: "70vh",
            }}
            onMouseEnter={handleCanvasMouseEnter}
            onMouseLeave={handleCanvasMouseLeave}
          >
            <canvas
              ref={canvasRef}
              className="transition-all duration-300"
              style={{
                opacity: imageLoaded && !isProcessing ? 1 : 0.7,
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                maxWidth: "none",
                maxHeight: "none",
              }}
            />

            {edits.crop.enabled && !showOriginal && (
              <CropOverlay
                edits={edits}
                onEditChange={handleCropChange}
                containerWidth={containerDimensions.width}
                containerHeight={containerDimensions.height}
              />
            )}

            {/* Before/After overlay */}
            <AnimatePresence>
              {showOriginal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="bg-background/90 border-border/50 absolute top-4 left-4 rounded-full border px-3 py-1 backdrop-blur-sm"
                >
                  <span className="text-sm font-medium">Original</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-background/20 absolute inset-0 flex items-center justify-center rounded backdrop-blur-sm"
                >
                  <div className="bg-background/80 border-border/50 flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur-sm">
                    <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                    <span className="text-sm font-medium">Processing...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 space-y-1 text-center"
          >
            <p className="text-muted-foreground text-xs">
              Live Preview • Zoom: {Math.round(zoom * 100)}%
            </p>
            <p className="text-muted-foreground text-xs">
              Scroll to zoom • {zoom > 1 ? "Zoomed view" : "Fit to container"}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Background decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="from-primary/10 to-accent/10 pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br via-transparent"
      />
    </div>
  );
}
