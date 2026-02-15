"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ImageEdits } from "@/types/image-edits";
import { FlipHorizontal, FlipVertical, RotateCcw } from "lucide-react";

interface TransformControlsProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void;
}

export function TransformControls({
  edits,
  onEditChange,
}: TransformControlsProps) {
  const handleFlipHorizontal = () => {
    onEditChange(
      { flipHorizontal: !edits.flipHorizontal },
      "Flipped horizontally"
    );
  };

  const handleFlipVertical = () => {
    onEditChange({ flipVertical: !edits.flipVertical }, "Flipped vertically");
  };

  const resetFlips = () => {
    onEditChange({ flipHorizontal: false, flipVertical: false }, "Reset flips");
  };

  const handleAutoOrientToggle = (checked: boolean) => {
    onEditChange(
      { autoOrient: checked },
      checked ? "Enabled auto-orientation" : "Disabled auto-orientation"
    );
  };

  const resetAutoOrient = () => {
    onEditChange({ autoOrient: false }, "Reset auto-orientation");
  };

  return (
    <div className="space-y-6">
      {/* Auto-Orientation */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Auto-Orient</Label>
        <div className="flex items-center gap-2">
          <Switch
            checked={edits.autoOrient}
            onCheckedChange={handleAutoOrientToggle}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAutoOrient}
            disabled={!edits.autoOrient}
            className="h-8 w-8 p-0 hover:bg-transparent"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      {/* Rotation - TEMPORARILY DISABLED DUE TO QUALITY DEGRADATION ISSUES */}
      {/*
      <div className="space-y-3">
        <Label className="text-sm font-medium">Rotate</Label>
        <div className="space-y-3">
          <Slider
            value={[edits.rotation]}
            onValueChange={handleRotationChange}
            min={-180}
            max={180}
            step={1}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={edits.rotation}
              onChange={handleRotationInputChange}
              min={-180}
              max={180}
              className="w-20 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">°</span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetRotation}
              disabled={edits.rotation === 0}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rotateBy90(-90)}
              className="flex-1 gap-2 bg-transparent"
            >
              <RotateCcw size={16} />
              -90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rotateBy90(90)}
              className="flex-1 gap-2 bg-transparent"
            >
              <RotateCw size={16} />
              +90°
            </Button>
          </div>
        </div>
      </div>
      */}

      {/* Flip Controls */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Flip</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFlipHorizontal}
            className={`h-9 w-9 border transition-all duration-200 ${
              edits.flipHorizontal
                ? "border-green-500 bg-green-500/10 text-green-600 shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:bg-green-500/20 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                : "text-muted-foreground hover:bg-muted border-transparent"
            }`}
            title="Flip Horizontal"
          >
            <FlipHorizontal size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFlipVertical}
            className={`h-9 w-9 border transition-all duration-200 ${
              edits.flipVertical
                ? "border-green-500 bg-green-500/10 text-green-600 shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:bg-green-500/20 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                : "text-muted-foreground hover:bg-muted border-transparent"
            }`}
            title="Flip Vertical"
          >
            <FlipVertical size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFlips}
            disabled={!edits.flipHorizontal && !edits.flipVertical}
            className="h-8 w-8 p-0 hover:bg-transparent"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
