"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ImageUploadModal } from "@/components/ImageUploadModal";
import { RotateCcw, Download, Upload, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface EditorHeaderProps {
  hasUnsavedChanges: boolean;
  onReset: () => void;
  onNewImage: () => void;
  onSaveChanges: () => void;
  processedImageUrl?: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onBeforeAfterToggle?: (showOriginal: boolean) => void;
  targetKB?: number;
  exportFormat?: "png" | "jpeg" | "webp" | "avif" | "tiff" | "gif" | "original";
  onExportFormatChange?: (format: "png" | "jpeg" | "webp" | "avif" | "tiff" | "gif" | "original") => void;
  notifyOfChange?: () => void;
  onImageSelect?: (imageUrl: string, filename?: string) => void;
  originalFilename?: string | null;
}

export function EditorHeader({
  hasUnsavedChanges,
  onReset,
  onNewImage,
  onSaveChanges,
  processedImageUrl,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBeforeAfterToggle,
  targetKB,
  exportFormat = "png",
  onExportFormatChange,
  notifyOfChange,
  onImageSelect,
  originalFilename,
}: EditorHeaderProps) {
  const isPristine = !hasUnsavedChanges && !processedImageUrl;

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleNewImageClick = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      setShowUploadModal(true);
    }
  };

  const handleConfirmNewImage = () => {
    setShowConfirmDialog(false);
    setShowUploadModal(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl);
    }
    setShowUploadModal(false);
  };

  const handleDownload = async () => {
    if (!processedImageUrl) {
      toast.error("No processed image available for download");
      return;
    }

    if (hasUnsavedChanges) {
      onSaveChanges();
    }

    try {
      let urlToDownload = processedImageUrl;
      let mimeType = "image/png";
      let ext = "png";

      if (exportFormat === "jpeg") {
        mimeType = "image/jpeg";
        ext = "jpg";
      } else if (exportFormat === "webp") {
        mimeType = "image/webp";
        ext = "webp";
      }

      if (targetKB && targetKB > 0) {
        urlToDownload = await reencodeToTarget(
          processedImageUrl,
          targetKB,
          mimeType
        );
      } else {
        // Re-encode to selected format even without target size
        urlToDownload = await reencodeToFormat(processedImageUrl, mimeType);
      }

      // Generate filename based on original filename
      let filename = "image-pp-edited";
      if (originalFilename) {
        // Extract name without extension
        const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
        filename = `${nameWithoutExt}-pp-edited`;
      }

      const link = document.createElement("a");
      link.href = urlToDownload;
      link.download = `${filename}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  const handleReset = () => {
    onReset();
    toast.success("All edits have been reset");
  };

  const handleBeforeAfterMouseDown = () => {
    if (onBeforeAfterToggle) {
      onBeforeAfterToggle(true);
    }
  };

  const handleBeforeAfterMouseUp = () => {
    if (onBeforeAfterToggle) {
      onBeforeAfterToggle(false);
    }
  };

  const reencodeToFormat = async (
    srcDataUrl: string,
    mimeType: string
  ): Promise<string> => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const load = () =>
      new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });
    img.src = srcDataUrl;
    await load();

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return srcDataUrl;
    ctx.drawImage(img, 0, 0);

    try {
      return canvas.toDataURL(mimeType, 0.95);
    } catch {
      return srcDataUrl;
    }
  };

  const reencodeToTarget = async (
    srcDataUrl: string,
    targetKb: number,
    mimeType: string
  ): Promise<string> => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const load = () =>
      new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });
    img.src = srcDataUrl;
    await load();

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return srcDataUrl;
    ctx.drawImage(img, 0, 0);

    const tryEncode = (mime: string, q: number) => {
      try {
        return canvas.toDataURL(mime, q);
      } catch {
        return "";
      }
    };

    // binary size from base64 dataURL
    const dataUrlSizeKB = (dataUrl: string) =>
      Math.round(
        ((dataUrl.length - (dataUrl.indexOf(",") + 1)) * 3) / 4 / 1024
      );

    let bestUrl = srcDataUrl;
    let bestDiff = Number.POSITIVE_INFINITY;

    // sweep quality from 0.95 down to 0.5
    for (let q = 95; q >= 50; q -= 5) {
      const quality = q / 100;
      const url = tryEncode(mimeType, quality);
      if (!url) continue;
      const size = dataUrlSizeKB(url);
      const diff = size - targetKb;
      // aim to be <= targetKb; keep closest under target; else track closest overall
      if (size <= targetKb && Math.abs(diff) < Math.abs(bestDiff)) {
        bestDiff = diff;
        bestUrl = url;
        // break early if we're very close
        if (Math.abs(diff) <= 10) return bestUrl;
      } else if (
        bestDiff === Number.POSITIVE_INFINITY &&
        Math.abs(diff) < Math.abs(bestDiff)
      ) {
        // fallback: if nothing <= target yet, keep smallest absolute diff
        bestDiff = diff;
        bestUrl = url;
      }
    }

    return bestUrl;
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 flex items-center"
      >
        <div className="flex items-center justify-between h-full w-full px-6">
          {/* Left group: Title, New Image, Hold to Compare */}
          <div className="flex items-center gap-3">
            {/* Logo and Title */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="flex items-center gap-3"
            >
              <img 
                src="/logo.svg" 
                alt="Pixel Perfect Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Pixel Perfect
              </h1>
            </motion.div>

            {/* New Image */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewImageClick}
              className="gap-2 bg-transparent h-8"
            >
              <Upload size={16} />
              New Image
            </Button>

            {/* Hold to Compare */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: isPristine ? 0.5 : 1 }}
              transition={{ duration: 0.2 }}
              className="h-full flex items-center justify-center"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleBeforeAfterMouseDown}
                disabled={isPristine}
                className="gap-2 bg-transparent select-none h-8"
                onMouseUp={handleBeforeAfterMouseUp}
                onMouseLeave={handleBeforeAfterMouseUp}
              >
                <Eye size={16} />
                Hold to Compare
              </Button>
            </motion.div>
          </div>

          {/* Right group: Save/Reset/Format/Download/Theme */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="flex items-center space-x-3"
          >
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: !isPristine && processedImageUrl ? 1 : 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveChanges}
                disabled={!hasUnsavedChanges || !processedImageUrl}
                className="gap-2 bg-transparent h-8"
              >
                <Save size={16} />
                Save Changes
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: !isPristine ? 1 : 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isPristine}
                className="gap-2 bg-transparent h-8"
              >
                <RotateCcw size={16} />
                Reset All
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: processedImageUrl ? 1 : 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  onExportFormatChange?.(
                    value as "png" | "jpeg" | "webp" | "avif" | "tiff" | "gif" | "original"
                  )
                }
              >
                <SelectTrigger className="w-24 h-8 bg-transparent border-border/50 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: processedImageUrl ? 1 : 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!processedImageUrl}
                className="gap-2 bg-transparent h-8"
              >
                <Download size={16} />
                Download
              </Button>
            </motion.div>

            <ThemeToggle />
          </motion.div>
        </div>
      </motion.header>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to proceed? All
              current edits will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNewImage}>
              Proceed
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <ImageUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImageSelect={handleImageSelect}
      />
    </>
  );
}
