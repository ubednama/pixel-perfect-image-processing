"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Link, Unlink, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { ImageEdits } from "@/types/image-edits";

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

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      setAspectRatio(img.width / img.height);
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
        setEstimatedFileSize(Math.round(sizeInBytes / 1024));
      }
    };
    img.src = originalImage;
  }, [originalImage, onEditChange]);

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
      const baseSize = estimatedFileSize || 780;
      const newSize = Math.round(baseSize * pixelRatio);
      setEstimatedFileSize(newSize);
    }
  }, [
    edits.width,
    edits.height,
    edits.unit,
    originalDimensions,
    estimatedFileSize,
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
    width = Math.max(64, Math.min(8000, width));
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
    height = Math.max(64, Math.min(8000, height));
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
      {/* Dimensions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-sm font-medium">Width</Label>
            <Input
              type="number"
              value={edits.width}
              onChange={handleWidthChange}
              min={64}
              max={8000}
              className="mt-1"
              placeholder="Width"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAspectRatioLock}
            className={`mt-6 h-10 w-10 p-0 ${edits.aspectRatioLocked ? "bg-primary text-primary-foreground" : ""}`}
          >
            {edits.aspectRatioLocked ? (
              <Link size={16} />
            ) : (
              <Unlink size={16} />
            )}
          </Button>
          <div className="flex-1">
            <Label className="text-sm font-medium">Height</Label>
            <Input
              type="number"
              value={edits.height}
              onChange={handleHeightChange}
              min={64}
              max={8000}
              className="mt-1"
              placeholder="Height"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToOriginal}
            disabled={
              edits.width === originalDimensions.width &&
              edits.height === originalDimensions.height &&
              edits.unit === "px"
            }
            className="mt-6 h-10 w-10 bg-transparent p-0"
          >
            <RotateCcw size={16} />
          </Button>
        </div>

        {/* Unit Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Unit</Label>
          <ToggleGroup
            type="single"
            value={edits.unit}
            onValueChange={handleUnitChange}
            className="justify-start"
          >
            <ToggleGroupItem value="px" aria-label="Pixels">
              px
            </ToggleGroupItem>
            <ToggleGroupItem value="%" aria-label="Percentage">
              %
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Original dimensions info */}
        <div className="text-muted-foreground text-xs">
          Original: {originalDimensions.width} × {originalDimensions.height} px
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
