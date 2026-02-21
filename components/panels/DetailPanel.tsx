"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { ImageEdits } from "@/types/image-edits";

interface DetailPanelProps {
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

export function DetailPanel({ edits, onEditChange }: DetailPanelProps) {
  return (
    <div className="space-y-5">
      {/* Sharpen */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-xs font-medium">
            Sharpen
          </Label>
          <Switch
            checked={edits.sharpen?.enabled ?? false}
            onCheckedChange={(enabled) =>
              onEditChange(
                { sharpen: { ...edits.sharpen, enabled } },
                "Sharpen"
              )
            }
          />
        </div>
        {edits.sharpen?.enabled && (
          <SliderRow
            label="Sigma"
            value={edits.sharpen.sigma}
            min={0.5}
            max={10}
            step={0.5}
            onChange={(v) =>
              onEditChange(
                { sharpen: { ...edits.sharpen, sigma: v } },
                "Sharpen Sigma"
              )
            }
            formatValue={(v) => v.toFixed(1)}
          />
        )}
      </div>

      {/* Blur */}
      <SliderRow
        label="Blur"
        value={edits.blur ?? 0}
        min={0}
        max={20}
        step={0.5}
        onChange={(v) => onEditChange({ blur: v }, "Blur")}
        formatValue={(v) => v.toFixed(1)}
      />

      {/* Smooth (Median) */}
      <SliderRow
        label="Smooth (Median)"
        value={edits.median ?? 0}
        min={0}
        max={10}
        step={1}
        onChange={(v) => onEditChange({ median: v }, "Smooth")}
      />

      {/* Grain (Noise) — via edits.grain as a number 0-100 */}
      <SliderRow
        label="Grain"
        value={(edits as ImageEdits & { grain?: number }).grain ?? 0}
        min={0}
        max={50}
        step={1}
        onChange={(v) =>
          onEditChange({ grain: v } as Partial<ImageEdits>, "Grain")
        }
      />
    </div>
  );
}
