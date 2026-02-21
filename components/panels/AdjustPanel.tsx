"use client";

import { ColorPanel } from "@/components/panels/ColorPanel";
import { DetailPanel } from "@/components/panels/DetailPanel";
import { LightPanel } from "@/components/panels/LightPanel";
import { ScenePanel } from "@/components/panels/ScenePanel";
import type { ImageEdits } from "@/types/image-edits";

interface AdjustPanelProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void;
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="bg-border h-px flex-1"></div>
      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
        {title}
      </span>
      <div className="bg-border h-px flex-1"></div>
    </div>
  );
}

export function AdjustPanel({ edits, onEditChange }: AdjustPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-4 pb-12">
        <div className="space-y-4">
          <SectionDivider title="Light" />
          <LightPanel edits={edits} onEditChange={onEditChange} />
        </div>

        <div className="space-y-4">
          <SectionDivider title="Color" />
          <ColorPanel edits={edits} onEditChange={onEditChange} />
        </div>

        <div className="space-y-4">
          <SectionDivider title="Detail" />
          <DetailPanel edits={edits} onEditChange={onEditChange} />
        </div>

        <div className="space-y-4">
          <SectionDivider title="Scene" />
          <ScenePanel edits={edits} onEditChange={onEditChange} />
        </div>
      </div>
    </div>
  );
}
