"use client";

import { CanvasViewport } from "@/components/CanvasViewport";
import { EditorHeader } from "@/components/EditorHeader";
import { OriginalPreview } from "@/components/OriginalPreview";
import { AdjustPanel } from "@/components/panels/AdjustPanel";
import { CropTransformPanel } from "@/components/panels/CropTransformPanel";
import { FilterPanel } from "@/components/panels/FilterPanel";
import { type ActivePanel, SidebarRail } from "@/components/SidebarRail";
import { Button } from "@/components/ui/button";
import type { HistoryEntry, ImageEdits, ImageState } from "@/types/image-edits";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Redo2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface EditorViewProps {
  uploadedImage: string;
  originalImage: string;
  originalFilename?: string | null;
  onImageUpdate: (imageUrl: string) => void;
  onImageSelect?: (imageUrl: string, filename?: string) => void;
}

const defaultEdits: ImageEdits = {
  // Transform operations
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  autoOrient: false,

  // Resize operations
  width: 0,
  height: 0,
  unit: "px",
  aspectRatioLocked: true,
  resizeFit: "cover",
  resizePosition: "centre",
  resizeKernel: "lanczos3",
  withoutEnlargement: false,
  withoutReduction: false,

  // Crop/Extract operations
  crop: {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    enabled: false,
  },

  // Color manipulation
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  tint: {
    r: 255,
    g: 255,
    b: 255,
    enabled: false,
  },
  grayscale: false,
  negate: false,
  exposure: 0,
  opacity: 1,

  // Filters and effects
  blur: 0,
  sharpen: {
    sigma: 0,
    m1: 1.0,
    m2: 2.0,
    x1: 2.0,
    y2: 10.0,
    y3: 20.0,
    enabled: false,
  },
  median: 0,
  gamma: 1.0,
  normalize: false,
  clahe: {
    width: 8,
    height: 8,
    maxSlope: 3,
    enabled: false,
  },

  // Linear transformation
  linear: {
    multiplier: 1.0,
    offset: 0,
    enabled: false,
  },

  // Threshold
  threshold: {
    value: 128,
    grayscale: true,
    enabled: false,
  },

  // Modulate (HSB adjustments)
  modulate: {
    brightness: 1.0,
    saturation: 1.0,
    hue: 0,
    lightness: 0,
    enabled: false,
  },

  // Composite operations
  composite: {
    input: "",
    blend: "over",
    gravity: "centre",
    left: 0,
    top: 0,
    enabled: false,
  },

  // Extend/Pad operations
  extend: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    background: {
      r: 0,
      g: 0,
      b: 0,
      alpha: 1,
    },
    enabled: false,
  },

  // Trim operations
  trim: {
    threshold: 10,
    enabled: false,
  },

  // Affine transformation
  affine: {
    matrix: [1, 0, 0, 1],
    background: {
      r: 0,
      g: 0,
      b: 0,
      alpha: 1,
    },
    interpolator: "bicubic",
    enabled: false,
  },

  // Convolve operations
  convolve: {
    width: 3,
    height: 3,
    kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    scale: 1,
    offset: 0,
    enabled: false,
  },

  // Output format and quality
  exportFormat: "webp",
  quality: 80,
  progressive: false,
  downloadTargetKB: 0,
  originalMimeType: undefined,

  // Color space operations
  toColorspace: "srgb",
  pipelineColorspace: "scrgb",
};

function getInitialExportFormat(
  filename?: string | null
): ImageEdits["exportFormat"] {
  if (!filename) return defaultEdits.exportFormat;
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpeg";
  if (ext === "png") return "png";
  if (ext === "webp") return "webp";
  if (ext === "avif") return "avif";
  if (ext === "tiff") return "tiff";
  if (ext === "gif") return "gif";
  return defaultEdits.exportFormat;
}

export function EditorView({
  uploadedImage,
  originalImage,
  originalFilename,
  onImageUpdate,
  onImageSelect,
}: EditorViewProps) {
  // State management
  const [imageState, setImageState] = useState<ImageState>({
    baseImage: uploadedImage,
    originalImage: originalImage,
    edits: {
      ...defaultEdits,
      exportFormat: getInitialExportFormat(originalFilename),
    },
    processedImageUrl: "",
  });

  // History management - completely rebuilt
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSavedImage, setLastSavedImage] = useState<string>(uploadedImage); // Track the last saved/fresh image

  // UI state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [zoom, setZoom] = useState(1);
  const [viewportBounds, setViewportBounds] = useState({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });
  const [showOriginal, setShowOriginal] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Persists the last processed image URL for download even after saves clear processedImageUrl
  const [downloadableImageUrl, setDownloadableImageUrl] = useState<string>("");

  // Initialize history with the uploaded image
  useEffect(() => {
    // Only initialize if we don't have a base image or if the uploaded image has changed
    // and it's not the same as what we just saved (to avoid loop on save)
    if (uploadedImage && uploadedImage !== imageState.baseImage) {
      const initialEdits = {
        ...defaultEdits,
        exportFormat: getInitialExportFormat(originalFilename),
      };

      setImageState((prev) => ({
        ...prev,
        baseImage: uploadedImage,
        originalImage: originalImage || uploadedImage,
        edits: initialEdits,
        processedImageUrl: "",
      }));

      const initialEntry: HistoryEntry = {
        action: "Initial image",
        edits: initialEdits,
        baseImage: uploadedImage,
        timestamp: Date.now(),
      };
      setHistory([initialEntry]);
      setHistoryIndex(0);
      setLastSavedImage(uploadedImage);
    }
  }, [uploadedImage, originalImage, originalFilename, imageState.baseImage]);

  // Add to history function - rebuilt
  const addToHistory = useCallback(
    (action: string, edits: ImageEdits, baseImage?: string) => {
      const newEntry: HistoryEntry = {
        action,
        edits: { ...edits },
        baseImage: baseImage || lastSavedImage, // Always use last saved image as base
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        // Remove any entries after current index (for when we're in middle of history)
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newEntry);

        // Limit history to 50 entries to prevent memory issues
        if (newHistory.length > 50) {
          return newHistory.slice(-50);
        }
        return newHistory;
      });

      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex, lastSavedImage]
  );

  // Handle edit changes - rebuilt to use last saved image as base
  const handleEditChange = useCallback(
    (newEdits: Partial<ImageEdits>, action = "Edit applied") => {
      const updatedEdits = { ...imageState.edits, ...newEdits };

      setImageState((prev) => ({
        ...prev,
        baseImage: lastSavedImage, // Always use last saved image as base for filters
        edits: updatedEdits,
        processedImageUrl: "", // Clear processed image to trigger reprocessing
      }));

      setHasUnsavedChanges(true);
      addToHistory(action, updatedEdits);
    },
    [imageState.edits, addToHistory, lastSavedImage]
  );

  const notifyOfChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Reset all edits — preserve current exportFormat
  const handleResetAll = useCallback(() => {
    const currentExportFormat = imageState.edits.exportFormat;
    const resetEdits = { ...defaultEdits, exportFormat: currentExportFormat };
    setImageState((prev) => ({
      ...prev,
      baseImage: lastSavedImage,
      edits: resetEdits,
      processedImageUrl: "",
    }));
    setHasUnsavedChanges(false);
    addToHistory("Reset all edits", resetEdits);
  }, [addToHistory, lastSavedImage, imageState.edits.exportFormat]);

  const handleImageUpdate = useCallback((imageUrl: string) => {
    setImageState((prev) => ({
      ...prev,
      processedImageUrl: imageUrl,
    }));
    // Always keep the latest processed image available for download
    if (imageUrl) setDownloadableImageUrl(imageUrl);
  }, []);

  // Save changes - rebuilt to properly update base image
  const handleSaveChanges = useCallback(() => {
    if (!imageState.processedImageUrl) {
      toast.error("No processed image to save");
      return;
    }

    const newBaseImage = imageState.processedImageUrl;

    // Update the last saved image and reset edits, preserve exportFormat
    setLastSavedImage(newBaseImage);
    const currentExportFormat = imageState.edits.exportFormat;
    const savedEdits = { ...defaultEdits, exportFormat: currentExportFormat };

    setImageState((prev) => ({
      ...prev,
      baseImage: newBaseImage,
      originalImage: newBaseImage,
      edits: savedEdits,
      processedImageUrl: "",
    }));

    // Clear history and start fresh from this saved state
    const savedEntry: HistoryEntry = {
      action: "Saved changes as new base",
      edits: savedEdits,
      baseImage: newBaseImage,
      timestamp: Date.now(),
    };
    setHistory([savedEntry]);
    setHistoryIndex(0);
    setHasUnsavedChanges(false);
    // Keep downloadableImageUrl so Download stays active after save
    setDownloadableImageUrl(newBaseImage);

    // Notify parent only on SAVE
    onImageUpdate(newBaseImage);

    toast.success("Changes saved successfully");
  }, [
    imageState.processedImageUrl,
    imageState.edits.exportFormat,
    onImageUpdate,
  ]);

  // Undo function - rebuilt
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];

      setImageState((prev) => ({
        ...prev,
        baseImage: entry.baseImage,
        edits: entry.edits,
        processedImageUrl: "",
      }));

      setHistoryIndex(newIndex);
      toast.success(`Undid: ${entry.action}`);
    }
  }, [history, historyIndex]);

  // Redo function - rebuilt
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];

      setImageState((prev) => ({
        ...prev,
        baseImage: entry.baseImage,
        edits: entry.edits,
        processedImageUrl: "",
      }));

      setHistoryIndex(newIndex);
      toast.success(`Redid: ${entry.action}`);
    }
  }, [history, historyIndex]);

  const handleZoomChange = useCallback(
    (
      newZoom: number,
      newViewportBounds: { x: number; y: number; width: number; height: number }
    ) => {
      setZoom(newZoom);
      setViewportBounds(newViewportBounds);
    },
    []
  );

  const _handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  const handleBeforeAfterToggle = useCallback((show: boolean) => {
    setShowOriginal(show);
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) handleUndo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        if (canRedo) handleRedo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUndo, canRedo, handleUndo, handleRedo]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-background fixed inset-0 z-50 flex flex-col overflow-hidden overscroll-none"
    >
      <EditorHeader
        hasUnsavedChanges={hasUnsavedChanges}
        onReset={handleResetAll}
        onSaveChanges={handleSaveChanges}
        processedImageUrl={imageState.processedImageUrl}
        downloadableImageUrl={downloadableImageUrl}
        onBeforeAfterToggle={handleBeforeAfterToggle}
        targetKB={imageState.edits.downloadTargetKB}
        exportFormat={imageState.edits.exportFormat}
        onExportFormatChange={(format) =>
          handleEditChange(
            { exportFormat: format },
            `Changed export format to ${format}`
          )
        }
        onImageSelect={onImageSelect}
        originalFilename={originalFilename}
      />

      {/* Main Editor Layout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="relative flex flex-1 flex-col overflow-hidden md:flex-row"
      >
        {/* Left Sidebar - Original Preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: 1,
            x: 0,
            width: leftSidebarOpen ? 240 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="border-border bg-card/50 relative hidden overflow-hidden border-r backdrop-blur-sm md:block"
          style={{ width: leftSidebarOpen ? 240 : 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="bg-background border-border hover:bg-muted absolute top-4 right-2 z-10 h-8 w-8 rounded-full border p-0 shadow-md transition-all duration-200 hover:shadow-lg"
            title={leftSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {leftSidebarOpen ? (
              <ChevronLeft size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </Button>

          {leftSidebarOpen && (
            <OriginalPreview
              originalImage={imageState.originalImage}
              zoom={zoom}
              viewportBounds={viewportBounds}
            />
          )}
        </motion.div>

        {/* Persistent expand button for collapsed left sidebar */}
        {!leftSidebarOpen ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftSidebarOpen(true)}
            className="bg-background border-border hover:bg-muted absolute top-4 left-2 z-20 h-8 w-8 rounded-full border p-0 shadow-md transition-all duration-200 hover:shadow-lg"
            title="Expand sidebar"
          >
            <ChevronRight size={14} />
          </Button>
        ) : null}

        {/* Center Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="relative min-h-0 flex-1 p-2 md:p-4"
        >
          <CanvasViewport
            image={imageState.baseImage}
            edits={imageState.edits}
            onImageUpdate={handleImageUpdate}
            onZoomChange={handleZoomChange}
            onEditChange={handleEditChange}
            showOriginal={showOriginal}
            cropMode={cropMode}
            onCropModeToggle={setCropMode}
            onShowOriginalToggle={setShowOriginal}
            processedImage={imageState.processedImageUrl}
          />

          {/* Mobile Floating Original Preview (Picture-in-Picture) */}
          <div className="border-border bg-card/80 absolute right-4 bottom-4 z-30 aspect-auto h-28 w-auto overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md md:hidden">
            <OriginalPreview
              originalImage={imageState.originalImage}
              zoom={zoom}
              viewportBounds={viewportBounds}
              compact
            />
          </div>
        </motion.div>

        {/* Right Panel — slides in when a panel is active */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="border-border bg-card/95 md:bg-card/50 z-40 flex h-[30vh] w-full shrink-0 flex-col overflow-hidden border-t shadow-xl backdrop-blur-xl md:h-full md:w-[280px] md:border-t-0 md:border-l md:shadow-none md:backdrop-blur-sm"
            >
              {/* Panel header */}
              <div className="border-border flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activePanel}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="text-foreground inline-block text-sm font-semibold"
                  >
                    {activePanel === "adjust"
                      ? "Adjust"
                      : activePanel === "filters"
                        ? "Filters"
                        : "Crop & Transform"}
                  </motion.span>
                </AnimatePresence>
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="h-7 w-7 p-0"
                    title="Undo"
                  >
                    <Undo2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="h-7 w-7 p-0"
                    title="Redo"
                  >
                    <Redo2 size={14} />
                  </Button>
                </div>
                {/* Mobile collapse button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActivePanel(null)}
                  className="ml-1 h-7 w-7 p-0 md:hidden"
                  title="Close Panel"
                >
                  <ChevronLeft className="h-4 w-4 -rotate-90" />
                </Button>
              </div>

              {/* Panel body */}
              <div className="relative min-h-0 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePanel}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col"
                  >
                    {activePanel === "adjust" && (
                      <AdjustPanel
                        edits={imageState.edits}
                        onEditChange={handleEditChange}
                      />
                    )}
                    {activePanel === "filters" && (
                      <FilterPanel
                        originalImage={imageState.originalImage}
                        onApplyFilter={(edits, name) =>
                          handleEditChange(edits, `Filter: ${name}`)
                        }
                        notifyOfChange={notifyOfChange}
                      />
                    )}
                    {activePanel === "crop" && (
                      <div className="flex-1 overflow-y-auto p-4">
                        <CropTransformPanel
                          edits={imageState.edits}
                          onEditChange={handleEditChange}
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Rail */}
        <SidebarRail activePanel={activePanel} onPanelChange={setActivePanel} />
      </motion.div>
    </motion.div>
  );
}
