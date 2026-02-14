"use client";

import type React from "react";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { ImageEdits } from "@/types/image-edits";

interface CropToolOverlayProps {
  isOpen: boolean;
  image: string;
  onApplyCrop: (crop: ImageEdits["crop"]) => void;
  onCancel: () => void;
}

export function CropToolOverlay({
  isOpen,
  image,
  onApplyCrop,
  onCancel,
}: CropToolOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (handle: string) => {
    setIsDragging(true);
    setDragHandle(handle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragHandle || !containerRef.current || !imgRef.current)
      return;

    const rect = containerRef.current.getBoundingClientRect();
    const imgRect = imgRef.current.getBoundingClientRect();
    const relX = (e.clientX - imgRect.left) / imgRect.width;
    const relY = (e.clientY - imgRect.top) / imgRect.height;

    const minSize = 0.1;
    const newCrop = { ...crop };

    switch (dragHandle) {
      case "nw":
        newCrop.x = Math.max(0, Math.min(relX, crop.x + crop.width - minSize));
        newCrop.y = Math.max(0, Math.min(relY, crop.y + crop.height - minSize));
        newCrop.width = crop.x + crop.width - newCrop.x;
        newCrop.height = crop.y + crop.height - newCrop.y;
        break;
      case "ne":
        newCrop.y = Math.max(0, Math.min(relY, crop.y + crop.height - minSize));
        newCrop.width = Math.max(minSize, Math.min(relX - crop.x, 1 - crop.x));
        newCrop.height = crop.y + crop.height - newCrop.y;
        break;
      case "sw":
        newCrop.x = Math.max(0, Math.min(relX, crop.x + crop.width - minSize));
        newCrop.width = crop.x + crop.width - newCrop.x;
        newCrop.height = Math.max(minSize, Math.min(relY - crop.y, 1 - crop.y));
        break;
      case "se":
        newCrop.width = Math.max(minSize, Math.min(relX - crop.x, 1 - crop.x));
        newCrop.height = Math.max(minSize, Math.min(relY - crop.y, 1 - crop.y));
        break;
      case "n":
        newCrop.y = Math.max(0, Math.min(relY, crop.y + crop.height - minSize));
        newCrop.height = crop.y + crop.height - newCrop.y;
        break;
      case "s":
        newCrop.height = Math.max(minSize, Math.min(relY - crop.y, 1 - crop.y));
        break;
      case "w":
        newCrop.x = Math.max(0, Math.min(relX, crop.x + crop.width - minSize));
        newCrop.width = crop.x + crop.width - newCrop.x;
        break;
      case "e":
        newCrop.width = Math.max(minSize, Math.min(relX - crop.x, 1 - crop.x));
        break;
    }

    setCrop(newCrop);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  const handleApply = () => {
    onApplyCrop({
      x: crop.x,
      y: crop.y,
      width: crop.width,
      height: crop.height,
      enabled: true,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-background/40 absolute inset-0 z-50 flex items-center justify-center overflow-hidden rounded-lg backdrop-blur-sm"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="relative max-h-96 max-w-2xl">
              <img
                ref={imgRef}
                src={image || "/placeholder.svg"}
                alt="Crop preview"
                className="max-h-96 max-w-full object-contain"
              />

              {/* Crop overlay */}
              <div
                className="absolute inset-0"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                }}
              >
                {/* Darken outside area */}
                <div className="border-primary absolute inset-0 border-2 shadow-lg" />

                {/* Corner handles */}
                {["nw", "ne", "sw", "se"].map((handle) => (
                  <div
                    key={handle}
                    onMouseDown={() => handleMouseDown(handle)}
                    className={`bg-primary border-background absolute h-3 w-3 border cursor-${handle}-resize ${
                      handle === "nw"
                        ? "top-0 left-0 -translate-x-1/2 -translate-y-1/2"
                        : ""
                    } ${handle === "ne" ? "top-0 right-0 translate-x-1/2 -translate-y-1/2" : ""} ${
                      handle === "sw"
                        ? "bottom-0 left-0 -translate-x-1/2 translate-y-1/2"
                        : ""
                    } ${handle === "se" ? "right-0 bottom-0 translate-x-1/2 translate-y-1/2" : ""}`}
                  />
                ))}

                {/* Edge handles */}
                {["n", "s", "e", "w"].map((handle) => (
                  <div
                    key={handle}
                    onMouseDown={() => handleMouseDown(handle)}
                    className={`bg-primary/50 absolute ${
                      handle === "n"
                        ? "top-0 left-1/2 h-2 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize"
                        : ""
                    } ${
                      handle === "s"
                        ? "bottom-0 left-1/2 h-2 w-8 -translate-x-1/2 translate-y-1/2 cursor-ns-resize"
                        : ""
                    } ${
                      handle === "e"
                        ? "top-1/2 right-0 h-8 w-2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize"
                        : ""
                    } ${
                      handle === "w"
                        ? "top-1/2 left-0 h-8 w-2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"
                        : ""
                    }`}
                  />
                ))}
              </div>

              {/* Darken outside crop area */}
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="bg-background/60 absolute"
                  style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${crop.y * 100}%`,
                  }}
                />
                <div
                  className="bg-background/60 absolute"
                  style={{
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${(1 - crop.y - crop.height) * 100}%`,
                  }}
                />
                <div
                  className="bg-background/60 absolute"
                  style={{
                    top: `${crop.y * 100}%`,
                    left: 0,
                    width: `${crop.x * 100}%`,
                    height: `${crop.height * 100}%`,
                  }}
                />
                <div
                  className="bg-background/60 absolute"
                  style={{
                    top: `${crop.y * 100}%`,
                    right: 0,
                    width: `${(1 - crop.x - crop.width) * 100}%`,
                    height: `${crop.height * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Control buttons */}
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
              <Button onClick={handleApply} className="gap-2">
                <Check size={16} />
                Apply Crop
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                className="bg-background/80 gap-2 backdrop-blur-sm"
              >
                <X size={16} />
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
