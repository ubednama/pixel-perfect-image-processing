"use client";

import type { ImageEdits } from "@/types/image-edits";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

interface FilterPreset {
  name: string;
  edits: Partial<ImageEdits>;
}

const filterPresets: FilterPreset[] = [
  {
    name: "None",
    edits: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      grayscale: false,
    },
  },
  {
    name: "Sepia",
    edits: {
      brightness: 10,
      contrast: 15,
      saturation: -20,
      grayscale: false,
    },
  },
  {
    name: "Vintage",
    edits: {
      brightness: 5,
      contrast: 20,
      saturation: -10,
      grayscale: false,
    },
  },
  {
    name: "Noir",
    edits: {
      brightness: -5,
      contrast: 30,
      saturation: 0,
      grayscale: true,
    },
  },
  {
    name: "Technicolor",
    edits: {
      brightness: 10,
      contrast: 25,
      saturation: 40,
      grayscale: false,
    },
  },
  {
    name: "Arctic",
    edits: {
      brightness: 15,
      contrast: 10,
      saturation: -15,
      grayscale: false,
    },
  },
  {
    name: "Warm",
    edits: {
      brightness: 8,
      contrast: 12,
      saturation: 15,
      grayscale: false,
    },
  },
  {
    name: "Cool",
    edits: {
      brightness: 5,
      contrast: 8,
      saturation: -5,
      grayscale: false,
    },
  },
];

interface FilterOverlayProps {
  isOpen: boolean;
  onApplyFilter: (edits: Partial<ImageEdits>, filterName: string) => void;
  originalImage: string;
  notifyOfChange?: () => void;
}

export function FilterOverlay({
  isOpen,
  onApplyFilter,
  originalImage,
  notifyOfChange,
}: FilterOverlayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      // 1. Stop the event from bubbling up to the CanvasViewport's native listener
      e.stopPropagation();

      // 2. Map both vertical (deltaY) and horizontal (deltaX) swipes to horizontal scrolling
      if (e.deltaX !== 0 || e.deltaY !== 0) {
        e.preventDefault(); // Prevent default browser scrolling
        container.scrollLeft += e.deltaX + e.deltaY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [isOpen]);

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const generateThumbnail = useCallback(
    async (filterName: string, filterEdits: Partial<ImageEdits>) => {
      const canvas = canvasRefs.current[filterName];
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const size = 100;
        canvas.width = size;
        canvas.height = size;

        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;

        const filters = [];
        if (
          filterEdits.brightness !== undefined &&
          filterEdits.brightness !== 0
        ) {
          filters.push(`brightness(${100 + filterEdits.brightness}%)`);
        }
        if (filterEdits.contrast !== undefined && filterEdits.contrast !== 0) {
          filters.push(`contrast(${100 + filterEdits.contrast}%)`);
        }
        if (
          filterEdits.saturation !== undefined &&
          filterEdits.saturation !== 0
        ) {
          filters.push(`saturate(${100 + filterEdits.saturation}%)`);
        }
        if (filterEdits.grayscale) {
          filters.push("grayscale(100%)");
        }

        ctx.filter = filters.join(" ") || "none";
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          size,
          size
        );

        // Apply special tints for certain filters
        if (filterName === "Sepia") {
          ctx.globalCompositeOperation = "multiply";
          ctx.fillStyle = "rgba(196, 154, 108, 0.4)";
          ctx.fillRect(0, 0, size, size);
          ctx.globalCompositeOperation = "source-over";
        }

        if (filterName === "Arctic") {
          ctx.globalCompositeOperation = "multiply";
          ctx.fillStyle = "rgba(173, 216, 230, 0.3)";
          ctx.fillRect(0, 0, size, size);
          ctx.globalCompositeOperation = "source-over";
        }

        if (filterName === "Warm") {
          ctx.globalCompositeOperation = "multiply";
          ctx.fillStyle = "rgba(255, 200, 150, 0.2)";
          ctx.fillRect(0, 0, size, size);
          ctx.globalCompositeOperation = "source-over";
        }

        if (filterName === "Cool") {
          ctx.globalCompositeOperation = "multiply";
          ctx.fillStyle = "rgba(150, 200, 255, 0.2)";
          ctx.fillRect(0, 0, size, size);
          ctx.globalCompositeOperation = "source-over";
        }
      };

      img.src = originalImage;
    },
    [originalImage]
  );

  useEffect(() => {
    if (isOpen && originalImage) {
      // Generate thumbnails for each filter
      filterPresets.forEach((preset) => {
        generateThumbnail(preset.name, preset.edits);
      });
    }
  }, [isOpen, originalImage, generateThumbnail]);

  const handleFilterSelect = (preset: FilterPreset) => {
    onApplyFilter(preset.edits, preset.name);
    if (notifyOfChange) {
      notifyOfChange();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pointer-events-none absolute right-0 bottom-8 left-0 flex justify-center bg-transparent px-6 pb-2 backdrop-blur-none"
        >
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Filter thumbnails container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto overflow-y-hidden py-2"
              style={{
                maxWidth: "calc(100vw - 48px)",
                scrollbarWidth: "none", // Firefox
                msOverflowStyle: "none", // IE/Edge
              }}
            >
              {/* Hide scrollbar for Webkit */}
              <style>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {filterPresets.map((preset, index) => (
                <motion.div
                  key={preset.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="shrink-0"
                >
                  <div className="group relative flex flex-col items-center gap-0.5 rounded-lg">
                    {/* Clickable thumbnail area only */}
                    <button
                      onClick={() => handleFilterSelect(preset)}
                      className="border-border bg-muted relative h-20 w-20 overflow-hidden rounded-lg border shadow-sm transition-all hover:scale-105 hover:shadow-md"
                      title={preset.name}
                    >
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[preset.name] = el;
                        }}
                        className="h-full w-full object-cover"
                        width={100}
                        height={100}
                      />
                    </button>
                    {/* Label — non-interactive */}
                    <div className="bg-background/60 border-border/40 rounded-full border px-2 py-0 shadow-sm backdrop-blur-md">
                      <span className="text-foreground text-xs font-medium">
                        {preset.name}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
