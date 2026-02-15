"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { ImageEdits } from "@/types/image-edits";
import { RotateCcw } from "lucide-react";
import type React from "react";

interface LightControlsProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>) => void;
}

export function LightControls({ edits, onEditChange }: LightControlsProps) {
  const adjustments = [
    {
      key: "brightness" as keyof ImageEdits,
      label: "Brightness",
      value: edits.brightness,
      min: -100,
      max: 100,
      unit: "",
    },
    {
      key: "contrast" as keyof ImageEdits,
      label: "Contrast",
      value: edits.contrast,
      min: -100,
      max: 100,
      unit: "",
    },
  ];

  const handleAdjustmentChange = (key: keyof ImageEdits, value: number[]) => {
    onEditChange({ [key]: value[0] });
  };

  const handleInputChange = (
    key: keyof ImageEdits,
    e: React.ChangeEvent<HTMLInputElement>,
    min: number,
    max: number
  ) => {
    const value = Number.parseInt(e.target.value) || 0;
    const clampedValue = Math.max(min, Math.min(max, value));
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
              min={adjustment.min}
              max={adjustment.max}
              step={1}
              className="w-full"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={adjustment.value}
                onChange={(e) =>
                  handleInputChange(
                    adjustment.key,
                    e,
                    adjustment.min,
                    adjustment.max
                  )
                }
                min={adjustment.min}
                max={adjustment.max}
                className="h-8 w-20 text-sm"
              />
              <span className="text-muted-foreground text-sm">
                {adjustment.unit}
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
