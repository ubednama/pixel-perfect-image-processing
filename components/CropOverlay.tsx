"use client";

import type React from "react";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ImageEdits } from "@/types/image-edits";

interface CropOverlayProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>) => void;
  containerWidth: number;
  containerHeight: number;
}

export function CropOverlay({
  edits,
  onEditChange,
  containerWidth,
  containerHeight,
}: CropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"move" | "resize" | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState(edits.crop);
  const overlayRef = useRef<HTMLDivElement>(null);

  const cropX = edits.crop.x * containerWidth;
  const cropY = edits.crop.y * containerHeight;
  const cropWidth = edits.crop.width * containerWidth;
  const cropHeight = edits.crop.height * containerHeight;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "move" | "resize") => {
      e.preventDefault();
      setIsDragging(true);
      setDragType(type);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialCrop(edits.crop);
    },
    [edits.crop]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragType) return;

      const deltaX = (e.clientX - dragStart.x) / containerWidth;
      const deltaY = (e.clientY - dragStart.y) / containerHeight;

      if (dragType === "move") {
        const newX = Math.max(
          0,
          Math.min(1 - initialCrop.width, initialCrop.x + deltaX)
        );
        const newY = Math.max(
          0,
          Math.min(1 - initialCrop.height, initialCrop.y + deltaY)
        );

        onEditChange({
          crop: {
            ...edits.crop,
            x: newX,
            y: newY,
          },
        });
      } else if (dragType === "resize") {
        const newWidth = Math.max(
          0.1,
          Math.min(1 - initialCrop.x, initialCrop.width + deltaX)
        );
        const newHeight = Math.max(
          0.1,
          Math.min(1 - initialCrop.y, initialCrop.height + deltaY)
        );

        onEditChange({
          crop: {
            ...edits.crop,
            width: newWidth,
            height: newHeight,
          },
        });
      }
    },
    [
      isDragging,
      dragType,
      dragStart,
      initialCrop,
      containerWidth,
      containerHeight,
      edits.crop,
      onEditChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!edits.crop.enabled) return null;

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 10 }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Crop area */}
      <div
        className="pointer-events-auto absolute cursor-move border-2 border-white shadow-lg"
        style={{
          left: cropX,
          top: cropY,
          width: cropWidth,
          height: cropHeight,
          backgroundColor: "transparent",
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {/* Corner handles */}
        <div
          className="absolute -right-2 -bottom-2 h-4 w-4 cursor-se-resize border border-gray-400 bg-white"
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown(e, "resize");
          }}
        />

        {/* Grid lines */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
