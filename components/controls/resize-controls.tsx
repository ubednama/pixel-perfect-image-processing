"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ImageEdits } from "@/types/image-edits";
import { Link, RotateCcw, Unlink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ResizeControlsProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void;
  originalImage: string;
}

export function ResizeControls({
  edits,
  onEditChange,
  originalImage,
}: ResizeControlsProps) {
  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [aspectRatio, setAspectRatio] = useState(1);
  const [estimatedFileSize, setEstimatedFileSize] = useState(0);
  const [originalFileSize, setOriginalFileSize] = useState(0);
  const [targetFileSize, setTargetFileSize] = useState("");

  const applyResize = () => {
    // Apply resize logic here
    if (onEditChange) {
      onEditChange(
        {
          width: edits.width,
          height: edits.height,
          unit: edits.unit,
          aspectRatioLocked: edits.aspectRatioLocked,
          resizeFit: edits.resizeFit,
          resizePosition: "centre",
          resizeKernel: "lanczos3",
          withoutEnlargement: false,
          withoutReduction: false,
        },
        "Resize applied"
      );
      toast.success("Resize applied successfully");
    }
  };

  const initializedRef = useRef(false);
  const lastImageRef = useRef(originalImage);

  useEffect(() => {
    // Reset initialization if image changes
    if (lastImageRef.current !== originalImage) {
      initializedRef.current = false;
      lastImageRef.current = originalImage;
    }

    if (initializedRef.current) return;

    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setAspectRatio(img.width / img.height);

      // Only set initial edits if they are not set
      if (edits.width === 0 && edits.height === 0) {
        onEditChange(
          { width: img.width, height: img.height },
          "Loaded image dimensions"
        );
      }

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png", 0.95);
        const sizeInBytes = Math.round((dataUrl.length * 3) / 4);
        const kbSize = Math.round(sizeInBytes / 1024);
        setEstimatedFileSize(kbSize);
        setOriginalFileSize(kbSize);
      }

      initializedRef.current = true;
    };
    img.src = originalImage;
  }, [originalImage, onEditChange, edits.width, edits.height]);

  useEffect(() => {
    if (originalDimensions.width && originalDimensions.height) {
      const currentWidth =
        edits.unit === "px"
          ? edits.width
          : Math.round((edits.width / 100) * originalDimensions.width);
      const currentHeight =
        edits.unit === "px"
          ? edits.height
          : Math.round((edits.height / 100) * originalDimensions.height);

      const pixelRatio =
        (currentWidth * currentHeight) /
        (originalDimensions.width * originalDimensions.height);

      const baseSize = originalFileSize || 780;
      const newSize = Math.round(baseSize * pixelRatio);
      setEstimatedFileSize(newSize);
    }
  }, [
    edits.width,
    edits.height,
    edits.unit,
    originalDimensions,
    originalFileSize,
  ]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      onEditChange(
        { width: edits.width || originalDimensions.width },
        "Width cleared, reverted to current"
      );
      return;
    }

    let width = Number.parseInt(value) || 0;
    width = Math.max(64, Math.min(4000, width));
    let height = edits.height;

    if (edits.aspectRatioLocked && width > 0) {
      if (edits.unit === "px") {
        height = Math.round(width / aspectRatio);
      } else {
        height = width;
      }
    }

    onEditChange({ width, height }, `Resized width to ${width}`);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      onEditChange(
        { height: edits.height || originalDimensions.height },
        "Height cleared, reverted to current"
      );
      return;
    }

    let height = Number.parseInt(value) || 0;
    height = Math.max(64, Math.min(4000, height));
    let width = edits.width;

    if (edits.aspectRatioLocked && height > 0) {
      if (edits.unit === "px") {
        width = Math.round(height * aspectRatio);
      } else {
        width = height;
      }
    }

    onEditChange({ width, height }, `Resized height to ${height}`);
  };

  const handleUnitChange = (unit: "px" | "%") => {
    if (!unit) return;

    let newWidth = edits.width;
    let newHeight = edits.height;

    if (unit === "%" && edits.unit === "px") {
      newWidth = Math.round((edits.width / originalDimensions.width) * 100);
      newHeight = Math.round((edits.height / originalDimensions.height) * 100);
    } else if (unit === "px" && edits.unit === "%") {
      newWidth = Math.round((edits.width / 100) * originalDimensions.width);
      newHeight = Math.round((edits.height / 100) * originalDimensions.height);
    }

    onEditChange(
      { unit, width: newWidth, height: newHeight },
      `Changed unit to ${unit}`
    );
  };

  const toggleAspectRatioLock = () => {
    onEditChange(
      { aspectRatioLocked: !edits.aspectRatioLocked },
      `${!edits.aspectRatioLocked ? "Locked" : "Unlocked"} aspect ratio`
    );
  };

  const resetToOriginal = () => {
    onEditChange(
      {
        width: originalDimensions.width,
        height: originalDimensions.height,
        unit: "px",
      },
      "Reset to original dimensions"
    );
    toast.success("Reset to original dimensions");
  };

  const handleTargetSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTargetFileSize(v);
    const kb = Number.parseInt(v || "0", 10);
    if (!Number.isNaN(kb) && kb > 0) {
      onEditChange(
        { downloadTargetKB: kb },
        `Set target file size to ${kb} KB`
      );
    } else {
      onEditChange({ downloadTargetKB: 0 }, "Cleared target file size");
    }
  };

  return (
    <div className="space-y-6">
      {/* Dimensions Controls */}
      <div className="space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Width
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={edits.width}
                onChange={handleWidthChange}
                min={64}
                max={4000}
                className="h-9 font-mono"
                placeholder="Width"
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                {edits.unit}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-end pb-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAspectRatioLock}
              className={`h-9 w-9 border transition-all duration-200 ${
                edits.aspectRatioLocked
                  ? "border-green-500 bg-green-500/10 text-green-600 shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:bg-green-500/20 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  : "text-muted-foreground hover:bg-muted border-transparent"
              }`}
              title={
                edits.aspectRatioLocked
                  ? "Aspect Ratio Locked"
                  : "Aspect Ratio Unlocked"
              }
            >
              {edits.aspectRatioLocked ? (
                <Link size={16} />
              ) : (
                <Unlink size={16} />
              )}
            </Button>
          </div>

          <div className="flex-1 space-y-1.5">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Height
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={edits.height}
                onChange={handleHeightChange}
                min={64}
                max={4000}
                className="h-9 font-mono"
                placeholder="Height"
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                {edits.unit}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Unit Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs font-medium">
              Unit:
            </Label>
            <ToggleGroup
              type="single"
              value={edits.unit}
              onValueChange={handleUnitChange}
              className="justify-start rounded-md border p-0.5"
            >
              <ToggleGroupItem
                value="px"
                size="sm"
                className="data-[state=on]:bg-muted data-[state=on]:text-foreground h-6 px-2 text-xs"
              >
                PX
              </ToggleGroupItem>
              <ToggleGroupItem
                value="%"
                size="sm"
                className="data-[state=on]:bg-muted data-[state=on]:text-foreground h-6 px-2 text-xs"
              >
                %
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToOriginal}
            disabled={
              edits.width === originalDimensions.width &&
              edits.height === originalDimensions.height &&
              edits.unit === "px"
            }
            className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
            title="Reset to Original Dimensions"
          >
            <RotateCcw size={14} className="mr-1.5" />
            Reset
          </Button>
        </div>

        {/* Original dimensions info */}
        <div className="bg-muted/40 text-muted-foreground border-border/50 rounded-md border px-3 py-2 text-center text-xs">
          Original Size:{" "}
          <span className="text-foreground font-mono font-medium">
            {originalDimensions.width} × {originalDimensions.height}
          </span>{" "}
          px
        </div>
      </div>

      <div className="bg-muted/30 border-border space-y-3 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Estimated File Size</Label>
          <span className="font-mono text-sm">~{estimatedFileSize} KB</span>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">
            Target Size (KB)
          </Label>
          <Input
            type="number"
            value={targetFileSize}
            onChange={handleTargetSizeChange}
            placeholder="e.g. 500"
            className="h-8 text-sm"
          />
          <p className="text-muted-foreground text-xs">
            When downloading, quality will be adjusted to meet target size
          </p>
        </div>
      </div>

      {/* Apply Button */}
      <Button
        onClick={applyResize}
        className="w-full"
        disabled={edits.width === 0 || edits.height === 0}
      >
        Apply Resize
      </Button>
    </div>
  );
}
