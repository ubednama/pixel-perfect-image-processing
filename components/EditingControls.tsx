"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { TransformControls } from "@/components/controls/transform-controls";
import { AdjustmentControls } from "@/components/controls/adjustment-controls";
import { EffectControls } from "@/components/controls/effect-controls";
import { ResizeControls } from "@/components/controls/resize-controls";
// TEMPORARILY COMMENTED OUT - Crop UI functionality disabled
// import { CropControls } from "@/components/controls/crop-controls"
import { Undo, Redo } from "lucide-react";
import type { ImageEdits } from "@/types/image-edits";

interface EditingControlsProps {
  edits: ImageEdits;
  onEditChange: (edits: Partial<ImageEdits>, action?: string) => void;
  originalImage: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomReset?: () => void;
  notifyOfChange?: () => void;
  onCropModeToggle?: (enabled: boolean) => void;
  cropMode?: boolean;
}

export function EditingControls({
  edits,
  onEditChange,
  originalImage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomReset,
  notifyOfChange,
  onCropModeToggle,
  cropMode = false,
}: EditingControlsProps) {
  const controlSections = [
    // TEMPORARILY COMMENTED OUT - Crop UI functionality disabled
    // { id: "crop", title: "Crop", component: CropControls, props: { onZoomReset, notifyOfChange, onCropModeToggle } },
    {
      id: "transform",
      title: "Transform",
      component: TransformControls,
      props: { notifyOfChange },
    },
    {
      id: "adjustments",
      title: "Adjustments",
      component: AdjustmentControls,
      props: { notifyOfChange },
    },
    {
      id: "effects",
      title: "Effects",
      component: EffectControls,
      props: { notifyOfChange },
    },
    {
      id: "resize",
      title: "Resize",
      component: ResizeControls,
      props: { notifyOfChange },
    },
  ];

  // TEMPORARILY COMMENTED OUT - Crop mode filtering disabled since crop UI is commented out
  // Filter sections based on crop mode
  // const visibleSections = cropMode
  //   ? controlSections.filter(section => section.id === "crop")
  //   : controlSections

  // Show all available sections (crop is already commented out above)
  const visibleSections = controlSections;

  return (
    <div className="flex h-full flex-col">
      <div className="bg-card/95 border-border sticky top-0 z-20 border-b p-6 pb-4 shadow-sm backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-foreground text-lg font-semibold">
              Edit Controls
            </h3>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="bg-background/50 hover:bg-background/80 h-8 gap-1 px-3 transition-all duration-200"
                title="Undo last action"
              >
                <Undo size={14} />
                <span className="text-xs">Undo</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="bg-background/50 hover:bg-background/80 h-8 gap-1 px-3 transition-all duration-200"
                title="Redo last action"
              >
                <Redo size={14} />
                <span className="text-xs">Redo</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2">
        {/* {appMode === "cropping" ? (
          <CropControls
            edits={edits}
            onEditChange={onEditChange}
            originalImage={originalImage}
            onZoomReset={onZoomReset}
            onCancel={() => onAppModeChange("editing")}
          />
        ) : ( */}
        <Accordion
          type="multiple"
          defaultValue={["transform", "adjustments"]}
          className="space-y-3"
        >
          {visibleSections.map((section, index) => {
            const Component = section.component;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.05 * index }}
              >
                <AccordionItem
                  value={section.id}
                  className="border-border bg-card/30 rounded-lg border"
                >
                  <AccordionTrigger className="hover:bg-muted/50 rounded-t-lg px-4 py-3 hover:no-underline">
                    <span className="font-medium">{section.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <Component
                      edits={edits}
                      onEditChange={onEditChange}
                      originalImage={originalImage}
                      {...(section.props || {})}
                    />
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            );
          })}
        </Accordion>
        {/* )} */}
      </div>
    </div>
  );
}
