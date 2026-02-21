"use client";

import { ImageUploadModal } from "@/components/ImageUploadModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Download, Eye, RotateCcw, Save, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditorHeaderProps {
  hasUnsavedChanges: boolean;
  onReset: () => void;
  onSaveChanges: () => void;
  processedImageUrl?: string;
  downloadableImageUrl?: string;
  onBeforeAfterToggle?: (showOriginal: boolean) => void;
  targetKB?: number;
  exportFormat?: "png" | "jpeg" | "webp" | "avif" | "tiff" | "gif" | "original";
  onExportFormatChange?: (
    format: "png" | "jpeg" | "webp" | "avif" | "tiff" | "gif" | "original"
  ) => void;
  onImageSelect?: (imageUrl: string, filename?: string) => void;
  originalFilename?: string | null;
}

export function EditorHeader({
  hasUnsavedChanges,
  onReset,
  onSaveChanges,
  processedImageUrl,
  downloadableImageUrl,
  onBeforeAfterToggle,
  targetKB,
  exportFormat = "png",
  onExportFormatChange,
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
    const urlForDownload = downloadableImageUrl || processedImageUrl;
    if (!urlForDownload) {
      toast.error("No processed image available for download");
      return;
    }

    if (hasUnsavedChanges) {
      onSaveChanges();
    }

    try {
      let urlToDownload = urlForDownload;
      let mimeType = "image/png";
      let ext = "png";

      if (exportFormat === "jpeg") {
        mimeType = "image/jpeg";
        ext = "jpg";
      } else if (exportFormat === "webp") {
        mimeType = "image/webp";
        ext = "webp";
      } else if (exportFormat === "avif") {
        mimeType = "image/avif";
        ext = "avif";
      } else if (exportFormat === "tiff") {
        mimeType = "image/tiff";
        ext = "tiff";
      } else if (exportFormat === "gif") {
        mimeType = "image/gif";
        ext = "gif";
      }

      if (targetKB && targetKB > 0) {
        urlToDownload = await reencodeToTarget(
          urlForDownload,
          targetKB,
          mimeType
        );
      } else {
        // Re-encode to selected format even without target size
        urlToDownload = await reencodeToFormat(urlForDownload, mimeType);
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
        className="border-border bg-background/80 sticky top-0 z-40 flex h-16 items-center border-b backdrop-blur-sm"
      >
        <div className="flex h-full w-full items-center justify-between px-6">
          {/* Left group: Title, New Image, Hold to Compare */}
          <div className="flex items-center gap-3">
            {/* Logo and Title */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="flex items-center gap-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="Pixel Perfect Logo"
                className="h-8 w-8"
              />
              <h1 className="from-foreground to-foreground/70 bg-linear-to-r bg-clip-text text-2xl font-bold text-transparent">
                Pixel Perfect
              </h1>
            </motion.div>

            {/* New Image */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewImageClick}
              className="h-8 gap-2 bg-transparent"
            >
              <Upload size={16} />
              New Image
            </Button>

            {/* Hold to Compare */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: isPristine ? 0.5 : 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleBeforeAfterMouseDown}
                disabled={isPristine}
                className="h-8 gap-2 bg-transparent select-none"
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
              className="flex items-center"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveChanges}
                disabled={!hasUnsavedChanges || !processedImageUrl}
                className="flex h-8 items-center gap-2 bg-transparent"
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
                className="h-8 gap-2 bg-transparent"
              >
                <RotateCcw size={16} />
                Reset All
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{
                opacity: downloadableImageUrl || processedImageUrl ? 1 : 0.5,
              }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  onExportFormatChange?.(
                    value as
                      | "png"
                      | "jpeg"
                      | "webp"
                      | "avif"
                      | "tiff"
                      | "gif"
                      | "original"
                  )
                }
              >
                <SelectTrigger className="border-border/50 h-8 w-24 bg-transparent text-xs">
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
              animate={{
                opacity: downloadableImageUrl || processedImageUrl ? 1 : 0.5,
              }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!downloadableImageUrl && !processedImageUrl}
                className="flex h-8 items-center gap-2 bg-transparent"
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
          <div className="flex justify-end gap-3">
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
