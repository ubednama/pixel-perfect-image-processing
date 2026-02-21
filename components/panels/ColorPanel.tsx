"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { ImageEdits } from "@/types/image-edits";

interface ColorPanelProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void;
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
}: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-xs font-medium">
          {label}
        </Label>
        <span className="text-foreground text-xs font-semibold tabular-nums">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

export function ColorPanel({ edits, onEditChange }: ColorPanelProps) {
  return (
    <div className="space-y-5">
      <SliderRow
        label="Saturation"
        value={edits.saturation}
        min={-100}
        max={100}
        onChange={(v) => onEditChange({ saturation: v }, "Saturation")}
      />
      <SliderRow
        label="Hue"
        value={edits.hue}
        min={-180}
        max={180}
        onChange={(v) => onEditChange({ hue: v }, "Hue")}
      />
      <SliderRow
        label="Brightness"
        value={edits.brightness}
        min={-100}
        max={100}
        onChange={(v) => onEditChange({ brightness: v }, "Brightness")}
      />

      {/* Tint */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-xs font-medium">
            Tint
          </Label>
          <Switch
            checked={edits.tint?.enabled ?? false}
            onCheckedChange={(enabled) =>
              onEditChange({ tint: { ...edits.tint, enabled } }, "Tint")
            }
          />
        </div>
        {edits.tint?.enabled && (
          <div className="bg-muted/30 space-y-2 rounded-lg p-3">
            <SliderRow
              label="Red"
              value={edits.tint.r}
              min={0}
              max={255}
              onChange={(v) =>
                onEditChange({ tint: { ...edits.tint, r: v } }, "Tint Red")
              }
            />
            <SliderRow
              label="Green"
              value={edits.tint.g}
              min={0}
              max={255}
              onChange={(v) =>
                onEditChange({ tint: { ...edits.tint, g: v } }, "Tint Green")
              }
            />
            <SliderRow
              label="Blue"
              value={edits.tint.b}
              min={0}
              max={255}
              onChange={(v) =>
                onEditChange({ tint: { ...edits.tint, b: v } }, "Tint Blue")
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
