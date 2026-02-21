"use client";

import { cn } from "@/lib/utils";
import { Crop, SlidersHorizontal, Sparkles } from "lucide-react";

export type ActivePanel = "adjust" | "filters" | "crop" | null;

interface RailButtonProps {
  icon: React.ReactNode;
  label: string;
  id: Exclude<ActivePanel, null>;
  activePanel: ActivePanel;
  onClick: (id: Exclude<ActivePanel, null>) => void;
}

function RailButton({
  icon,
  label,
  id,
  activePanel,
  onClick,
}: RailButtonProps) {
  const isActive = activePanel === id;
  return (
    <button
      onClick={() => onClick(id)}
      title={label}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span className="text-[10px] leading-none font-medium">{label}</span>
    </button>
  );
}

interface SidebarRailProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export function SidebarRail({ activePanel, onPanelChange }: SidebarRailProps) {
  const toggle = (id: Exclude<ActivePanel, null>) => {
    onPanelChange(activePanel === id ? null : id);
  };

  return (
    <div className="border-border bg-card/80 z-50 flex h-[60px] w-full shrink-0 flex-row items-center justify-center gap-2 overflow-x-auto border-t px-4 py-2 backdrop-blur-sm md:h-full md:w-14 md:flex-col md:gap-1 md:overflow-visible md:border-t-0 md:border-l md:px-0 md:py-4">
      <RailButton
        id="adjust"
        label="Adjust"
        icon={<SlidersHorizontal size={20} />}
        activePanel={activePanel}
        onClick={toggle}
      />
      <RailButton
        id="filters"
        label="Filters"
        icon={<Sparkles size={20} />}
        activePanel={activePanel}
        onClick={toggle}
      />
      <RailButton
        id="crop"
        label="Crop"
        icon={<Crop size={20} />}
        activePanel={activePanel}
        onClick={toggle}
      />

      {/* Undo/Redo moved to header — no need to duplicate here */}
    </div>
  );
}
