"use client";

import { CropOverlayOnCanvas } from "@/components/CropOverlayOnCanvas";
import {
  hasImageEdits,
  hasOnlyLiveAdjustments,
  processImageWithSharp,
} from "@/lib/image-processing";
import type { ImageEdits } from "@/types/image-edits";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CanvasViewportProps {
  image: string;
  edits: ImageEdits;
  onImageUpdate: (imageUrl: string) => void;
  onZoomChange?: (
    zoom: number,
    viewportBounds: { x: number; y: number; width: number; height: number }
  ) => void;
  onEditChange?: (edits: Partial<ImageEdits>, action?: string) => void;
  showOriginal?: boolean;
  notifyOfChange?: () => void;
  cropMode?: boolean;
  onCropModeToggle?: (enabled: boolean) => void;
  onShowOriginalToggle?: (show: boolean) => void;
  processedImage?: string;
}

export function CanvasViewport({
  image,
  edits,
  onImageUpdate,
  onZoomChange,
  onEditChange,
  showOriginal = false,
  notifyOfChange,
  cropMode = false,
  onCropModeToggle: _onCropModeToggle,
  onShowOriginalToggle,
  processedImage,
}: CanvasViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewportDimensions, setViewportDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [originalImageDimensions, setOriginalImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const currentZoomRef = useRef(zoom);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    currentZoomRef.current = zoom;
  }, [zoom]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!e.isPrimary) return;
      setIsDragging(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [panOffset]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !e.isPrimary) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(
          t1.clientX - t2.clientX,
          t1.clientY - t2.clientY
        );
        pinchStartRef.current = { dist, zoom: currentZoomRef.current };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(
          t1.clientX - t2.clientX,
          t1.clientY - t2.clientY
        );
        const scale = dist / pinchStartRef.current.dist;
        const newZoom = Math.max(
          0.25,
          Math.min(4, pinchStartRef.current.zoom * scale)
        );
        setZoom(newZoom);
      }
    };

    const handleTouchEnd = () => {
      pinchStartRef.current = null;
    };

    viewport.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    viewport.addEventListener("touchmove", handleTouchMove, { passive: false });
    viewport.addEventListener("touchend", handleTouchEnd);
    viewport.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      viewport.removeEventListener("touchstart", handleTouchStart);
      viewport.removeEventListener("touchmove", handleTouchMove);
      viewport.removeEventListener("touchend", handleTouchEnd);
      viewport.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine which image to display
  // We show the processed image if:
  // 1. We are NOT showing the original (Before/After view)
  // 2. We are NOT in crop mode (need original to adjust crop box)
  // 3. A processed image exists

  // Store the dimensions of the BASE image (unprocessed) for consistent CSS transform calculations
  const [baseDimensions, setBaseDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Load base image dimensions whenever the base image changes
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      setBaseDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      // Also init originalImageDimensions if not set (for safety)
      setOriginalImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    const updateViewportDimensions = () => {
      if (viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        setViewportDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateViewportDimensions();
    window.addEventListener("resize", updateViewportDimensions);
    return () => window.removeEventListener("resize", updateViewportDimensions);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    // Only zoom if dragging pinch (trackpad) or holding Ctrl/Cmd (mouse wheel)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.25, Math.min(4, prev * delta)));
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const calculateImageTransforms = useCallback(
    (imgWidth: number, imgHeight: number) => {
      if (!viewportDimensions.width || !viewportDimensions.height)
        return { scale: 1, rotationScale: 1 };

      // Calculate base fit-to-view scale
      const scaleX = viewportDimensions.width / imgWidth;
      const scaleY = viewportDimensions.height / imgHeight;
      const baseScale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave padding

      // Calculate rotation compensation scale
      const rotation = (edits.rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rotation));
      const sin = Math.abs(Math.sin(rotation));

      // Calculate rotated bounding box
      const rotatedWidth = imgWidth * cos + imgHeight * sin;
      const rotatedHeight = imgWidth * sin + imgHeight * cos;

      // Calculate scale needed to fit rotated image in viewport
      const rotatedScaleX = viewportDimensions.width / rotatedWidth;
      const rotatedScaleY = viewportDimensions.height / rotatedHeight;
      const rotationScale = Math.min(rotatedScaleX, rotatedScaleY) * 0.9;

      return { scale: baseScale, rotationScale };
    },
    [viewportDimensions, edits.rotation]
  );

  const processImage = useCallback(async () => {
    if (!image) {
      return;
    }

    setIsProcessing(true);

    try {
      // If showing original or no edits, just use the original image
      if (showOriginal || !hasImageEdits(edits)) {
        onImageUpdate(image);
        setImageLoaded(true);
        setIsProcessing(false);
        return;
      }

      const result = await processImageWithSharp(image, edits);

      if (result.success && result.imageUrl) {
        onImageUpdate(result.imageUrl);
      } else {
        throw new Error(result.error || "Failed to process image");
      }

      setImageLoaded(true);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing image with Sharp:", error);
      toast.error(
        "Failed to process image (likely too large). Showing original."
      );
      onImageUpdate(image);
      setImageLoaded(true);
      setIsProcessing(false);
    }
  }, [image, edits, onImageUpdate, showOriginal]);

  useEffect(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    const timeout = hasOnlyLiveAdjustments(edits) ? 50 : 300;

    processingTimeoutRef.current = setTimeout(() => {
      processImage();
    }, timeout);

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [processImage, edits]);

  useEffect(() => {
    // Use baseDimensions for stable zoom calculation relation
    if (onZoomChange && baseDimensions.width && baseDimensions.height) {
      // Red box indicator calculation: indicator_width = thumbnail_width / zoom_level
      const viewportBounds = {
        x: 0,
        y: 0,
        width: 1 / zoom, // This creates the correct red box size
        height: 1 / zoom,
      };
      onZoomChange(zoom, viewportBounds);
    }
  }, [zoom, baseDimensions, onZoomChange]);

  calculateImageTransforms(
    baseDimensions.width || 1,
    baseDimensions.height || 1
  );

  // Reset zoom when entering crop mode
  useEffect(() => {
    if (cropMode) {
      setZoom(1);
    }
  }, [cropMode]);

  const handleCanvasMouseEnter = () => {
    document.dispatchEvent(new CustomEvent("canvas-enter"));
  };

  const handleCanvasMouseLeave = () => {
    document.dispatchEvent(new CustomEvent("canvas-leave"));
  };

  const _handleApplyFilter = (
    filterEdits: Partial<ImageEdits>,
    filterName: string
  ) => {
    if (onEditChange) {
      onEditChange(filterEdits, `Applied ${filterName} filter`);
    }
    if (notifyOfChange) {
      notifyOfChange();
    }
  };

  const [processedImageLoaded, setProcessedImageLoaded] = useState(false);

  // Reset processed image load state when URL changes
  useEffect(() => {
    setProcessedImageLoaded(false);
  }, [processedImage]);

  const computeBaseStyle = useCallback(() => {
    if (showOriginal) {
      return {
        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
        filter: "none",
      };
    }

    const filters: string[] = [];

    // Build filter string from edits
    if (edits.brightness !== 0) {
      filters.push(`brightness(${100 + edits.brightness}%)`);
    }
    if (edits.contrast !== 0) {
      filters.push(`contrast(${100 + edits.contrast}%)`);
    }
    if (edits.saturation !== 0) {
      filters.push(`saturate(${100 + edits.saturation}%)`);
    }
    if (edits.grayscale) {
      filters.push("grayscale(100%)");
    }
    if (edits.blur > 0) {
      filters.push(`blur(${edits.blur}px)`);
    }
    if (edits.sharpen.enabled && edits.sharpen.sigma > 0) {
      filters.push(`contrast(${100 + edits.sharpen.sigma * 2}%)`);
    }

    // Build transform string from edits
    const transforms: string[] = [];
    transforms.push(`translate(${panOffset.x}px, ${panOffset.y}px)`);

    // Apply zoom and rotation scaling
    let effectiveZoom = zoom;
    if (edits.rotation !== 0 && baseDimensions.width && baseDimensions.height) {
      const { rotationScale } = calculateImageTransforms(
        baseDimensions.width,
        baseDimensions.height
      );
      effectiveZoom =
        zoom *
        (rotationScale /
          (Math.min(
            viewportDimensions.width / baseDimensions.width,
            viewportDimensions.height / baseDimensions.height
          ) *
            0.9));
    }

    transforms.push(`scale(${effectiveZoom})`);
    if (edits.rotation !== 0) {
      transforms.push(`rotate(${edits.rotation}deg)`);
    }
    if (edits.flipHorizontal) {
      transforms.push("scaleX(-1)");
    }
    if (edits.flipVertical) {
      transforms.push("scaleY(-1)");
    }

    let scaleX = 1;
    let scaleY = 1;
    if (
      edits.width > 0 &&
      edits.height > 0 &&
      baseDimensions.width &&
      baseDimensions.height
    ) {
      const targetWidth =
        edits.unit === "px"
          ? edits.width
          : (edits.width / 100) * baseDimensions.width;
      const targetHeight =
        edits.unit === "px"
          ? edits.height
          : (edits.height / 100) * baseDimensions.height;
      scaleX = targetWidth / baseDimensions.width;
      scaleY = targetHeight / baseDimensions.height;
      transforms.push(`scaleX(${scaleX}) scaleY(${scaleY})`);
    }

    return {
      transform: transforms.length > 0 ? transforms.join(" ") : "none",
      filter: filters.length > 0 ? filters.join(" ") : "none",
    };
  }, [
    edits,
    showOriginal,
    zoom,
    baseDimensions,
    viewportDimensions,
    calculateImageTransforms,
    panOffset.x,
    panOffset.y,
  ]);

  const computeProcessedStyle = useCallback(() => {
    return {
      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
      filter: "none",
    };
  }, [zoom, panOffset]);

  const baseStyle = computeBaseStyle();
  const processedStyle = computeProcessedStyle();
  const shouldShowProcessed = !showOriginal && !cropMode && !!processedImage;

  return (
    <div
      ref={viewportRef}
      className="from-muted/5 to-muted/15 border-border/30 canvas-viewport relative h-full w-full touch-none overflow-hidden rounded-xl border bg-linear-to-br shadow-sm"
      data-canvas-area="true"
      style={{ minHeight: "600px", cursor: isDragging ? "grabbing" : "grab" }}
      onMouseEnter={handleCanvasMouseEnter}
      onMouseLeave={handleCanvasMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-4">
        {/* Base Image Layer (Optimistic UI) */}
        {/* Always present but hidden when processed image is fully loaded to prevent double rendering */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image || "/placeholder.svg"}
          alt="Base Preview"
          className="pointer-events-none absolute block origin-center object-contain transition-all duration-200 ease-out"
          style={{
            ...baseStyle,
            opacity:
              shouldShowProcessed && processedImageLoaded
                ? 0
                : imageLoaded
                  ? 1
                  : 0,
            transform: isDragging
              ? `${baseStyle.transform} scale(0.98)`
              : baseStyle.transform,
          }}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Processed Image Layer (Final Result) */}
        {/* On top, fades in when ready */}
        {shouldShowProcessed && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={processedImage}
            alt="Processed Preview"
            className="pointer-events-none absolute block origin-center object-contain transition-all duration-200 ease-out"
            style={{
              ...processedStyle,
              opacity: processedImageLoaded ? 1 : 0,
              transform: isDragging
                ? `${processedStyle.transform} scale(0.98)`
                : processedStyle.transform,
            }}
            onLoad={(e) => {
              setProcessedImageLoaded(true);
              const img = e.currentTarget;

              // Auto-fit logic matches original logic
              if (viewportDimensions.width && viewportDimensions.height) {
                const contentWidth = img.naturalWidth;
                const contentHeight = img.naturalHeight;
                const scaleX = (viewportDimensions.width - 64) / contentWidth;
                const scaleY = (viewportDimensions.height - 64) / contentHeight;
                const fitZoom = Math.min(scaleX, scaleY);
                const targetZoom = fitZoom < 1 ? fitZoom : 1;

                // Only autofit on first load logic (shared with base) or significant change?
                // Keeping simple: if this logic causes jumpiness, we might need to restrict it.
                // For now, mirroring previous logic but only if zoom is default.
                if (zoom === 1) {
                  setZoom(targetZoom);
                }
              }
            }}
          />
        )}
      </div>

      {/* Processing overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-background/30 absolute inset-0 flex items-center justify-center backdrop-blur-md"
          >
            <div className="bg-background/95 border-border/60 flex items-center gap-3 rounded-xl border px-6 py-3 shadow-lg backdrop-blur-md">
              <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-foreground text-sm font-medium">
                Processing...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Before/After overlay */}
      <AnimatePresence>
        {showOriginal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
            className="bg-background/95 border-border/60 absolute top-2 left-2 rounded-xl border px-2 py-1 text-xs shadow-lg backdrop-blur-md sm:top-6 sm:left-6 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="text-foreground font-medium">Original</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom indicator & Image Dimensions */}
      <div className="bg-background/95 border-border/60 absolute bottom-1.5 left-1.5 flex items-center gap-3 rounded-xl border px-1.5 py-1 text-[10px] font-medium shadow-lg backdrop-blur-md sm:bottom-4 sm:left-4 sm:px-3 sm:py-2 sm:text-xs">
        <span className="text-foreground">{Math.round(zoom * 100)}%</span>
        {baseDimensions.width > 0 && (
          <>
            <div className="bg-border h-3 w-px"></div>
            <span className="text-muted-foreground">
              {baseDimensions.width} × {baseDimensions.height} px
            </span>
          </>
        )}
      </div>

      {/* Mobile Compare Button */}
      {onShowOriginalToggle && hasImageEdits(edits) && (
        <div className="absolute top-2 right-2 z-40 sm:top-4 sm:right-4 md:hidden">
          <button
            type="button"
            className="bg-background/95 border-border/60 active:bg-muted flex h-9 items-center gap-2 rounded-xl border px-3 shadow-lg backdrop-blur-md"
            onPointerDown={() => onShowOriginalToggle(true)}
            onPointerUp={() => onShowOriginalToggle(false)}
            onPointerLeave={() => onShowOriginalToggle(false)}
            onPointerCancel={() => onShowOriginalToggle(false)}
            title="Hold to Compare"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="hidden text-xs font-medium md:inline">
              Compare
            </span>
          </button>
        </div>
      )}

      {/* Scroll Hint */}
      <div className="bg-background/95 border-border/60 absolute right-4 bottom-4 hidden rounded-xl border px-3 py-2 shadow-lg backdrop-blur-md md:block">
        <span className="text-muted-foreground text-xs font-medium">
          Scroll to zoom
        </span>
      </div>

      {/* Crop overlay */}
      {cropMode && (
        <CropOverlayOnCanvas
          imageDimensions={originalImageDimensions}
          scale={1}
          zoom={zoom}
          crop={edits.crop}
          onCropChange={(crop) => onEditChange?.({ crop })}
        />
      )}
    </div>
  );
}
