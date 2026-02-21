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
    edits: { brightness: 0, contrast: 0, saturation: 0, grayscale: false },
  },
  {
    name: "Sepia",
    edits: { brightness: 10, contrast: 15, saturation: -20, grayscale: false },
  },
  {
    name: "Vintage",
    edits: { brightness: 5, contrast: 20, saturation: -10, grayscale: false },
  },
  {
    name: "Noir",
    edits: { brightness: -5, contrast: 30, saturation: 0, grayscale: true },
  },
  {
    name: "Technicolor",
    edits: { brightness: 10, contrast: 25, saturation: 40, grayscale: false },
  },
  {
    name: "Arctic",
    edits: { brightness: 15, contrast: 10, saturation: -15, grayscale: false },
  },
  {
    name: "Warm",
    edits: { brightness: 8, contrast: 12, saturation: 15, grayscale: false },
  },
  {
    name: "Cool",
    edits: { brightness: 5, contrast: 8, saturation: -5, grayscale: false },
  },
  {
    name: "Vivid",
    edits: { brightness: 5, contrast: 20, saturation: 60, grayscale: false },
  },
  {
    name: "Faded",
    edits: { brightness: 15, contrast: -20, saturation: -30, grayscale: false },
  },
  {
    name: "Drama",
    edits: { brightness: -10, contrast: 50, saturation: 20, grayscale: false },
  },
  {
    name: "Matte",
    edits: { brightness: 10, contrast: -15, saturation: -10, grayscale: false },
  },
];

interface FilterPanelProps {
  originalImage: string;
  onApplyFilter: (edits: Partial<ImageEdits>, filterName: string) => void;
  notifyOfChange?: () => void;
}

export function FilterPanel({
  originalImage,
  onApplyFilter,
  notifyOfChange,
}: FilterPanelProps) {
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

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
        ctx.clearRect(0, 0, size, size);

        // Square crop from center
        const shortest = Math.min(img.naturalWidth, img.naturalHeight);
        const sourceX = (img.naturalWidth - shortest) / 2;
        const sourceY = (img.naturalHeight - shortest) / 2;

        let cssFilter = "none";
        const filters: string[] = [];
        if (filterEdits.brightness)
          filters.push(`brightness(${1 + filterEdits.brightness / 100})`);
        if (filterEdits.contrast)
          filters.push(`contrast(${1 + filterEdits.contrast / 100})`);
        if (filterEdits.saturation)
          filters.push(`saturate(${1 + filterEdits.saturation / 100})`);
        if (filterEdits.grayscale) filters.push("grayscale(1)");
        if (filters.length) cssFilter = filters.join(" ");

        ctx.filter = cssFilter;
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          shortest,
          shortest,
          0,
          0,
          size,
          size
        );

        // Sepia tint
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
    if (originalImage) {
      filterPresets.forEach((p) => generateThumbnail(p.name, p.edits));
    }
  }, [originalImage, generateThumbnail]);

  const handleSelect = (preset: FilterPreset) => {
    onApplyFilter(preset.edits, preset.name);
    notifyOfChange?.();
  };

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence>
          {filterPresets.map((preset, index) => (
            <motion.button
              key={preset.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
              onClick={() => handleSelect(preset)}
              className="border-border bg-muted hover:border-primary flex flex-col items-center gap-1.5 overflow-hidden rounded-xl border p-1.5 transition-all hover:scale-105 hover:shadow-md"
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[preset.name] = el;
                }}
                className="aspect-square w-full rounded-lg object-cover"
                width={100}
                height={100}
              />
              <span className="text-foreground w-full text-center text-[11px] leading-none font-medium">
                {preset.name}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
