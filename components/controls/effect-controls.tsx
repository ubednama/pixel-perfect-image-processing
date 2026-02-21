"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { ImageEdits } from "@/types/image-edits";
import { RotateCcw } from "lucide-react";

interface EffectControlsProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>) => void;
}

export function EffectControls({ edits, onEditChange }: EffectControlsProps) {
  const handleGrayscaleToggle = (checked: boolean) => {
    onEditChange({ grayscale: checked });
  };

  const handleNegateToggle = (checked: boolean) => {
    onEditChange({ negate: checked });
  };

  const handleBlurChange = (value: number[]) => {
    const percent = value[0];
    const px = Number(((percent / 100) * 10).toFixed(1));
    onEditChange({ blur: px });
  };

  const handleBlurInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number.parseInt(e.target.value) || 0;
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const px = Number(((clampedPercent / 100) * 10).toFixed(1));
    onEditChange({ blur: px });
  };

  const getBlurPercent = () => {
    return Math.min(100, Math.round((edits.blur / 10) * 100));
  };

  const handleSharpenChange = (value: number[]) => {
    const percent = value[0];
    const sigma = Number(((percent / 100) * 10).toFixed(1));
    onEditChange({
      sharpen: {
        ...edits.sharpen,
        sigma: sigma,
        enabled: sigma > 0,
      },
    });
  };

  const handleSharpenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number.parseInt(e.target.value) || 0;
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const sigma = Number(((clampedPercent / 100) * 10).toFixed(1));
    onEditChange({
      sharpen: {
        ...edits.sharpen,
        sigma: sigma,
        enabled: sigma > 0,
      },
    });
  };

  const getSharpenPercent = () => {
    return Math.min(100, Math.round((edits.sharpen.sigma / 10) * 100));
  };

  const handleNoiseChange = (value: number[]) => {
    const percent = value[0];
    let median = 0;
    if (percent === 0) median = 0;
    else if (percent <= 25) median = 3;
    else if (percent <= 50) median = 5;
    else if (percent <= 75) median = 7;
    else median = 9;

    onEditChange({ median });
  };

  const handleNoiseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number.parseInt(e.target.value) || 0;
    const clampedPercent = Math.max(0, Math.min(100, percent));
    handleNoiseChange([clampedPercent]);
  };

  const getNoisePercent = () => {
    if (edits.median <= 1) return 0;
    if (edits.median <= 3) return 25;
    if (edits.median <= 5) return 50;
    if (edits.median <= 7) return 75;
    return 100;
  };

  const handleGammaChange = (value: number[]) => {
    onEditChange({ gamma: value[0] });
  };

  const handleGammaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value) || 1;
    const clampedValue = Math.max(1.0, Math.min(3, value));
    onEditChange({ gamma: clampedValue });
  };

  const resetBlur = () => {
    onEditChange({ blur: 0 });
  };

  const resetSharpen = () => {
    onEditChange({
      sharpen: {
        ...edits.sharpen,
        sigma: 0,
        enabled: false,
      },
    });
  };

  const resetNoise = () => {
    onEditChange({ median: 0 });
  };

  const resetGrayscale = () => {
    onEditChange({ grayscale: false });
  };

  const resetNegate = () => {
    onEditChange({ negate: false });
  };

  const resetGamma = () => {
    onEditChange({ gamma: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Grayscale */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Grayscale</Label>
        <div className="flex items-center gap-2">
          <Switch
            checked={edits.grayscale}
            onCheckedChange={handleGrayscaleToggle}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetGrayscale}
            disabled={!edits.grayscale}
            className="h-8 w-8 p-0 hover:bg-transparent"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      {/* Negate */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Negate</Label>
        <div className="flex items-center gap-2">
          <Switch checked={edits.negate} onCheckedChange={handleNegateToggle} />
          <Button
            variant="ghost"
            size="sm"
            onClick={resetNegate}
            disabled={!edits.negate}
            className="h-8 w-8 p-0 hover:bg-transparent"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      {/* Blur */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Blur</Label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="number"
                value={getBlurPercent()}
                onChange={handleBlurInputChange}
                min={0}
                max={100}
                className="h-8 w-12 px-1 py-0.5 text-right text-xs"
              />
            </div>
            <span className="text-muted-foreground w-3 text-xs">%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetBlur}
              disabled={edits.blur === 0}
              className="h-8 w-8 p-0 hover:bg-transparent"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <Slider
            value={[getBlurPercent()]}
            onValueChange={handleBlurChange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Sharpen */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Sharpen</Label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="number"
                value={getSharpenPercent()}
                onChange={handleSharpenInputChange}
                min={0}
                max={100}
                className="h-8 w-12 px-1 py-0.5 text-right text-xs"
              />
            </div>
            <span className="text-muted-foreground w-3 text-xs">%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSharpen}
              disabled={edits.sharpen.sigma === 0}
              className="h-8 w-8 p-0 hover:bg-transparent"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <Slider
            value={[getSharpenPercent()]}
            onValueChange={handleSharpenChange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Noise Reduction</Label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="number"
                value={getNoisePercent()}
                onChange={handleNoiseInputChange}
                min={0}
                max={100}
                className="h-8 w-12 px-1 py-0.5 text-right text-xs"
              />
            </div>
            <span className="text-muted-foreground w-3 text-xs">%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetNoise}
              disabled={edits.median <= 1}
              className="h-8 w-8 p-0 hover:bg-transparent"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <Slider
            value={[getNoisePercent()]}
            onValueChange={handleNoiseChange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Gamma */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Gamma</Label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="number"
                value={edits.gamma}
                onChange={handleGammaInputChange}
                min={1.0}
                max={3}
                step={0.1}
                className="h-8 w-12 px-1 py-0.5 text-right text-xs"
              />
            </div>
            <span className="text-muted-foreground w-3 text-xs">γ</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetGamma}
              disabled={edits.gamma === 1}
              className="h-8 w-8 p-0 hover:bg-transparent"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <Slider
            value={[edits.gamma]}
            onValueChange={handleGammaChange}
            min={1.0}
            max={3}
            step={0.1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
