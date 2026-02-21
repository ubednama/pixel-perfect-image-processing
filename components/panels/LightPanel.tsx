"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { ImageEdits } from "@/types/image-edits";

interface LightPanelProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
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

export function LightPanel({ edits, onEditChange }: LightPanelProps) {
  return (
    <div className="space-y-5">
      <SliderRow
        label="Brightness"
        value={edits.brightness}
        min={-100}
        max={100}
        onChange={(v) => onEditChange({ brightness: v }, "Brightness")}
      />
      <SliderRow
        label="Contrast"
        value={edits.contrast}
        min={-100}
        max={100}
        onChange={(v) => onEditChange({ contrast: v }, "Contrast")}
      />
      <SliderRow
        label="Exposure"
        value={edits.exposure ?? 0}
        min={-3}
        max={3}
        step={0.1}
        onChange={(v) => onEditChange({ exposure: v }, "Exposure")}
        formatValue={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
      />
      <SliderRow
        label="Gamma"
        value={edits.gamma ?? 1.0}
        min={1.0}
        max={3.0}
        step={0.1}
        onChange={(v) => onEditChange({ gamma: v }, "Gamma")}
        formatValue={(v) => v.toFixed(1)}
      />
    </div>
  );
}
