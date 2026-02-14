"use client";

import { CanvasViewport } from "@/components/CanvasViewport";
import { EditingControls } from "@/components/EditingControls";
import { EditorHeader } from "@/components/EditorHeader";
import { OriginalPreview } from "@/components/OriginalPreview";
import { Button } from "@/components/ui/button";
import type { HistoryEntry, ImageEdits, ImageState } from "@/types/image-edits";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface EditorViewProps {
  uploadedImage: string;
  originalImage: string;
  originalFilename?: string | null;
  onReset: () => void;
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

  // Filters and effects
  blur: 0,
  sharpen: {
    sigma: 1,
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

export function EditorView({
  uploadedImage,
  originalImage,
  originalFilename,
  onReset,
  onImageUpdate,
  onImageSelect,
}: EditorViewProps) {
  // State management
  const [imageState, setImageState] = useState<ImageState>({
    baseImage: uploadedImage,
    originalImage: originalImage,
    edits: defaultEdits,
    processedImageUrl: "",
  });

  // History management - completely rebuilt
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSavedImage, setLastSavedImage] = useState<string>(uploadedImage); // Track the last saved/fresh image

  // UI state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
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

  // Initialize history with the uploaded image
  useEffect(() => {
    // Only initialize if we don't have a base image or if the uploaded image has changed
    // and it's not the same as what we just saved (to avoid loop on save)
    if (uploadedImage && uploadedImage !== imageState.baseImage) {
      setImageState((prev) => ({
        ...prev,
        baseImage: uploadedImage,
        originalImage: originalImage || uploadedImage, // Use provided original or fallback to upload
        edits: defaultEdits,
        processedImageUrl: "",
      }));

      const initialEntry: HistoryEntry = {
        action: "Initial image",
        edits: defaultEdits,
        baseImage: uploadedImage,
        timestamp: Date.now(),
      };
      setHistory([initialEntry]);
      setHistoryIndex(0);
      setLastSavedImage(uploadedImage);
    }
  }, [uploadedImage, originalImage, imageState.baseImage]);

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

  // Reset all edits
  const handleResetAll = useCallback(() => {
    setImageState((prev) => ({
      ...prev,
      baseImage: lastSavedImage,
      edits: defaultEdits,
      processedImageUrl: "",
    }));
    setHasUnsavedChanges(false);
    addToHistory("Reset all edits", defaultEdits);
  }, [addToHistory, lastSavedImage]);

  const handleImageUpdate = useCallback((imageUrl: string) => {
    setImageState((prev) => ({
      ...prev,
      processedImageUrl: imageUrl,
    }));
  }, []);

  // Save changes - rebuilt to properly update base image
  const handleSaveChanges = useCallback(() => {
    if (!imageState.processedImageUrl) {
      toast.error("No processed image to save");
      return;
    }

    const newBaseImage = imageState.processedImageUrl;

    // Update the last saved image and reset edits
    setLastSavedImage(newBaseImage);

    setImageState((prev) => ({
      ...prev,
      baseImage: newBaseImage,
      originalImage: newBaseImage, // Update original image reference to the new base
      edits: defaultEdits,
      processedImageUrl: "",
    }));

    // Clear history and start fresh from this saved state
    const savedEntry: HistoryEntry = {
      action: "Saved changes as new base",
      edits: defaultEdits,
      baseImage: newBaseImage,
      timestamp: Date.now(),
    };
    setHistory([savedEntry]);
    setHistoryIndex(0);
    setHasUnsavedChanges(false);

    // Notify parent only on SAVE
    onImageUpdate(newBaseImage);

    toast.success("Changes saved successfully");
  }, [imageState.processedImageUrl, onImageUpdate]);

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

  const handleZoomReset = useCallback(() => {
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
      className="bg-background min-h-screen"
    >
      <EditorHeader
        hasUnsavedChanges={hasUnsavedChanges}
        onReset={handleResetAll}
        onNewImage={onReset}
        onSaveChanges={handleSaveChanges}
        processedImageUrl={imageState.processedImageUrl}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onBeforeAfterToggle={handleBeforeAfterToggle}
        targetKB={imageState.edits.downloadTargetKB}
        exportFormat={imageState.edits.exportFormat}
        onExportFormatChange={(format) =>
          handleEditChange(
            { exportFormat: format },
            `Changed export format to ${format}`
          )
        }
        notifyOfChange={notifyOfChange}
        onImageSelect={onImageSelect}
        originalFilename={originalFilename}
      />

      {/* Main Editor Layout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="relative flex h-[calc(100vh-4rem)]"
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
          className="border-border bg-card/50 relative overflow-hidden border-r backdrop-blur-sm"
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

        {/* Center Canvas - Live Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex-1 p-4"
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
          />
        </motion.div>

        {/* Right Sidebar - Editing Controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: 1,
            x: 0,
            width: rightSidebarOpen ? 320 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="border-border bg-card/50 relative overflow-hidden border-l backdrop-blur-sm"
          style={{ width: rightSidebarOpen ? 320 : 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="bg-background border-border hover:bg-muted absolute top-4 -left-3 z-10 h-8 w-8 rounded-full border p-0 shadow-md transition-all duration-200 hover:shadow-lg"
            title={rightSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {rightSidebarOpen ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </Button>

          {rightSidebarOpen && (
            <EditingControls
              edits={imageState.edits}
              onEditChange={handleEditChange}
              originalImage={imageState.originalImage}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onZoomReset={handleZoomReset}
              notifyOfChange={notifyOfChange}
              onCropModeToggle={setCropMode}
              cropMode={cropMode}
            />
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
