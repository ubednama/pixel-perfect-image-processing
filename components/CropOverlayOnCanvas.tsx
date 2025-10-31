// CROP FUNCTIONALITY TEMPORARILY COMMENTED OUT
// This entire component is disabled until crop issues are resolved

"use client"

import type { ImageEdits } from "@/types/image-edits"

interface CropOverlayOnCanvasProps {
  imageDimensions?: { width: number; height: number }
  scale?: number
  zoom?: number
  crop?: ImageEdits['crop']
  onCropChange?: (crop: ImageEdits['crop']) => void
}

// Placeholder component that does nothing - crop functionality disabled
export function CropOverlayOnCanvas(_props: CropOverlayOnCanvasProps) {
  return null
}

/*
ORIGINAL CROP IMPLEMENTATION COMMENTED OUT:

The original crop overlay implementation has been temporarily disabled
due to issues with crop coordinate calculations and image processing.
This will be re-enabled once the crop functionality is properly fixed.

All crop-related functionality in the image editor will be non-functional
until this component is restored.
*/