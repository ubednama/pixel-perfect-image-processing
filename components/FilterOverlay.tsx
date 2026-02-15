"use client";

import { Button } from "@/components/ui/button";
import type { ImageEdits } from "@/types/image-edits";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  onClose: () => void;
  onApplyFilter: (edits: Partial<ImageEdits>, filterName: string) => void;
  originalImage: string;
  notifyOfChange?: () => void;
}

export function FilterOverlay({
  isOpen,
  onClose,
  onApplyFilter,
  originalImage,
  notifyOfChange,
}: FilterOverlayProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  const itemWidth = 120; // Width of each filter item including gap
  const visibleItems = 4; // Number of items visible at once
  const maxScroll = Math.max(
    0,
    (filterPresets.length - visibleItems) * itemWidth
  );

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

  const handleScrollLeft = () => {
    const newPosition = Math.max(0, scrollPosition - itemWidth * 2);
    setScrollPosition(newPosition);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
    }
  };

  const handleScrollRight = () => {
    const newPosition = Math.min(maxScroll, scrollPosition + itemWidth * 2);
    setScrollPosition(newPosition);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
    }
  };

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
          className="pointer-events-none absolute right-0 bottom-0 left-0 bg-transparent p-6 backdrop-blur-none"
        >
          <div className="pointer-events-auto mb-4 flex items-center justify-between">
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="bg-background/80 border-border/50 hover:bg-muted/80 h-8 w-8 gap-2 rounded-full border p-0 backdrop-blur-sm"
              title="Close filter bar"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="pointer-events-auto relative">
            {/* Left scroll button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollLeft}
              disabled={scrollPosition <= 0}
              className="bg-background/80 border-border/50 absolute top-1/2 left-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full border p-0 backdrop-blur-sm"
            >
              <ChevronLeft size={16} />
            </Button>

            {/* Filter thumbnails container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto px-12 py-2"
              style={{ scrollBehavior: "smooth" }}
            >
              {filterPresets.map((preset, index) => (
                <motion.div
                  key={preset.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="shrink-0"
                >
                  <button
                    onClick={() => handleFilterSelect(preset)}
                    className="group relative flex flex-col items-center gap-3 rounded-lg p-3 transition-all hover:scale-105"
                  >
                    <div className="bg-muted border-border relative h-24 w-24 overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md">
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[preset.name] = el;
                        }}
                        className="h-full w-full object-cover"
                        width={100}
                        height={100}
                      />
                    </div>
                    <div className="bg-background/60 border-border/40 rounded-full border px-3 py-1 shadow-sm backdrop-blur-md">
                      <span className="text-foreground text-xs font-medium">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Right scroll button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollRight}
              disabled={scrollPosition >= maxScroll}
              className="bg-background/80 border-border/50 absolute top-1/2 right-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full border p-0 backdrop-blur-sm"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
