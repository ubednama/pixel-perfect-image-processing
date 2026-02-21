"use client";

import { ColorPanel } from "@/components/panels/ColorPanel";
import { DetailPanel } from "@/components/panels/DetailPanel";
import { LightPanel } from "@/components/panels/LightPanel";
import { ScenePanel } from "@/components/panels/ScenePanel";
import { cn } from "@/lib/utils";
import type { ImageEdits } from "@/types/image-edits";
import { useState } from "react";

type Section = "color" | "light" | "detail" | "scene";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "color", label: "Color" },
  { id: "light", label: "Light" },
  { id: "detail", label: "Detail" },
  { id: "scene", label: "Scene" },
];

interface AdjustPanelProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void;
}

export function AdjustPanel({ edits, onEditChange }: AdjustPanelProps) {
  const [activeSection, setActiveSection] = useState<Section>("light");

  return (
    <div className="flex h-full flex-col">
      {/* Section Tabs */}
      <div className="border-border flex shrink-0 gap-1 border-b px-2 py-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-150",
              activeSection === s.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === "color" && (
          <ColorPanel edits={edits} onEditChange={onEditChange} />
        )}
        {activeSection === "light" && (
          <LightPanel edits={edits} onEditChange={onEditChange} />
        )}
        {activeSection === "detail" && (
          <DetailPanel edits={edits} onEditChange={onEditChange} />
        )}
        {activeSection === "scene" && (
          <ScenePanel edits={edits} onEditChange={onEditChange} />
        )}
      </div>
    </div>
  );
}
