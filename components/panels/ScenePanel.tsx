"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { ImageEdits } from "@/types/image-edits";
import { RotateCcw } from "lucide-react";

interface ScenePanelProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void;
}

export function ScenePanel({ edits, onEditChange }: ScenePanelProps) {
  return (
    <div className="space-y-4">
      {/* Opacity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs font-medium">
              Opacity
            </Label>
            {edits.opacity !== 1 && edits.opacity !== undefined && (
              <button
                type="button"
                onClick={() => onEditChange({ opacity: 1 }, "Opacity")}
                className="text-muted-foreground hover:text-foreground transition-colors md:hidden"
                title="Reset Opacity"
              >
                <RotateCcw size={10} />
              </button>
            )}
          </div>
          <span className="text-foreground text-xs font-semibold tabular-nums">
            {Math.round((edits.opacity ?? 1) * 100)}%
          </span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[edits.opacity ?? 1]}
          onValueChange={([v]) => onEditChange({ opacity: v }, "Opacity")}
        />
      </div>

      {/* Grayscale / B&W */}
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-xs font-medium">
          Grayscale / B&W
        </Label>
        <Switch
          checked={edits.grayscale ?? false}
          onCheckedChange={(v) => onEditChange({ grayscale: v }, "Grayscale")}
        />
      </div>

      {/* Normalize */}
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-xs font-medium">
          Normalize
        </Label>
        <Switch
          checked={edits.normalize ?? false}
          onCheckedChange={(v) => onEditChange({ normalize: v }, "Normalize")}
        />
      </div>

      {/* Negate / Invert */}
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-xs font-medium">
          Invert Colors
        </Label>
        <Switch
          checked={edits.negate ?? false}
          onCheckedChange={(v) => onEditChange({ negate: v }, "Invert")}
        />
      </div>
    </div>
  );
}
