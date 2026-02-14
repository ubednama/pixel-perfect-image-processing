"use client";

import type { ImageEdits } from "@/types/image-edits";

interface CropOverlayOnCanvasProps {
  imageDimensions?: { width: number; height: number };
  scale?: number;
  zoom?: number;
  crop?: ImageEdits["crop"];
  onCropChange?: (crop: ImageEdits["crop"]) => void;
}

export function CropOverlayOnCanvas(_props: CropOverlayOnCanvasProps) {
  return null;
}
