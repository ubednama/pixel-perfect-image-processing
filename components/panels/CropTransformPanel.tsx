"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ImageEdits } from "@/types/image-edits";
import {
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  RotateCw,
} from "lucide-react";

interface CropTransformPanelProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void;
}

export function CropTransformPanel({
  edits,
  onEditChange,
}: CropTransformPanelProps) {
  const handleRotate = (dir: "left" | "right") => {
    const delta = dir === "left" ? -90 : 90;
    const newRot = ((edits.rotation ?? 0) + delta + 360) % 360;
    onEditChange({ rotation: newRot }, `Rotate ${dir}`);
  };

  return (
    <div className="space-y-6">
      {/* Rotate */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-medium">
          Rotate
        </Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleRotate("left")}
            title="Rotate Left 90°"
            className="flex-1"
          >
            <RotateCcw size={16} />
          </Button>
          <div className="text-muted-foreground w-12 text-center text-[11px] font-medium">
            {edits.rotation ?? 0}°
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleRotate("right")}
            title="Rotate Right 90°"
            className="flex-1"
          >
            <RotateCw size={16} />
          </Button>
        </div>
      </div>

      {/* Flip */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-medium">
          Flip
        </Label>
        <div className="flex items-center gap-2">
          <Button
            variant={edits.flipHorizontal ? "default" : "outline"}
            size="icon"
            onClick={() =>
              onEditChange(
                { flipHorizontal: !edits.flipHorizontal },
                "Flip Horizontal"
              )
            }
            title="Flip Horizontal"
            className="flex-1"
          >
            <FlipHorizontal size={16} />
          </Button>
          <Button
            variant={edits.flipVertical ? "default" : "outline"}
            size="icon"
            onClick={() =>
              onEditChange(
                { flipVertical: !edits.flipVertical },
                "Flip Vertical"
              )
            }
            title="Flip Vertical"
            className="flex-1"
          >
            <FlipVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Resize */}
      <div className="space-y-3">
        <Label className="text-muted-foreground text-xs font-medium">
          Resize
        </Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-muted-foreground text-[10px]">
              Width (px)
            </Label>
            <Input
              type="number"
              min={1}
              value={edits.width || ""}
              placeholder="Auto"
              className="h-8 text-sm"
              onChange={(e) =>
                onEditChange(
                  { width: parseInt(e.target.value) || 0 },
                  "Resize Width"
                )
              }
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-muted-foreground text-[10px]">
              Height (px)
            </Label>
            <Input
              type="number"
              min={1}
              value={edits.height || ""}
              placeholder="Auto"
              className="h-8 text-sm"
              onChange={(e) =>
                onEditChange(
                  { height: parseInt(e.target.value) || 0 },
                  "Resize Height"
                )
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-xs font-medium">
            Lock Aspect Ratio
          </Label>
          <Switch
            checked={edits.aspectRatioLocked}
            onCheckedChange={(v) =>
              onEditChange({ aspectRatioLocked: v }, "Aspect Ratio")
            }
          />
        </div>
      </div>
    </div>
  );
}
