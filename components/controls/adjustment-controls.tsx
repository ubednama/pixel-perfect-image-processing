"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RotateCcw } from "lucide-react";
import type { ImageEdits } from "@/types/image-edits";

interface AdjustmentControlsProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>) => void;
}

export function AdjustmentControls({
  edits,
  onEditChange,
}: AdjustmentControlsProps) {
  const adjustments = [
    {
      key: "brightness" as keyof ImageEdits,
      label: "Brightness",
      value: edits.brightness,
    },
    {
      key: "contrast" as keyof ImageEdits,
      label: "Contrast",
      value: edits.contrast,
    },
    {
      key: "saturation" as keyof ImageEdits,
      label: "Saturation",
      value: edits.saturation,
    },
    {
      key: "hue" as keyof ImageEdits,
      label: "Hue",
      value: edits.hue,
      min: -180,
      max: 180,
      unit: "°",
    },
  ];

  const handleAdjustmentChange = (key: keyof ImageEdits, value: number[]) => {
    onEditChange({ [key]: value[0] });
  };

  const handleInputChange = (
    key: keyof ImageEdits,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number.parseInt(e.target.value) || 0;
    // Different ranges for different adjustments
    let clampedValue: number;
    if (key === "hue") {
      clampedValue = Math.max(-180, Math.min(180, value));
    } else {
      clampedValue = Math.max(-100, Math.min(100, value));
    }
    onEditChange({ [key]: clampedValue });
  };

  const resetAdjustment = (key: keyof ImageEdits) => {
    onEditChange({ [key]: 0 });
  };

  return (
    <div className="space-y-6">
      {adjustments.map((adjustment) => (
        <div key={adjustment.key} className="space-y-3">
          <Label className="text-sm font-medium">{adjustment.label}</Label>
          <div className="space-y-3">
            <Slider
              value={[adjustment.value as number]}
              onValueChange={(value) =>
                handleAdjustmentChange(adjustment.key, value)
              }
              min={adjustment.min || -100}
              max={adjustment.max || 100}
              step={1}
              className="w-full"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={adjustment.value}
                onChange={(e) => handleInputChange(adjustment.key, e)}
                min={adjustment.min || -100}
                max={adjustment.max || 100}
                className="h-8 w-20 text-sm"
              />
              <span className="text-muted-foreground text-sm">
                {adjustment.unit || "%"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetAdjustment(adjustment.key)}
                disabled={adjustment.value === 0}
                className="h-8 w-8 p-0"
              >
                <RotateCcw size={14} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
