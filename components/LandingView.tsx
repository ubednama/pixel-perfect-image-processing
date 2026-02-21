"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ImageIcon, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface LandingViewProps {
  onImageUpload: (imageUrl: string, filename?: string) => void;
}

export function LandingView({ onImageUpload }: LandingViewProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/tiff",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error(
        "Invalid file type! Please upload JPEG, PNG, WebP, GIF, AVIF, or TIFF images."
      );
      return false;
    }

    if (file.size > maxSize) {
      toast.error("File too large! Maximum size is 10MB.");
      return false;
    }

    return true;
  };

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!validateFile(file)) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpload(result, file.name);
        toast.success("Image loaded successfully!");
      };
      reader.readAsDataURL(file);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  return (
    <div className="from-background via-background to-muted/10 flex min-h-screen flex-col items-center justify-center bg-linear-to-br p-4 md:p-8">
      {/* Header Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8 max-w-2xl text-center md:mb-12"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mb-6 flex justify-center md:mb-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Pixel Perfect Logo"
            className="h-20 w-20 md:h-32 md:w-32"
          />
        </motion.div>

        <h1
          className="from-foreground to-foreground/80 mb-3 bg-linear-to-r bg-clip-text text-4xl font-bold text-transparent md:mb-4 md:text-6xl"
          title="Pixel Perfect - Free Online Image Editor"
        >
          Pixel Perfect
        </h1>
        <h2 className="text-muted-foreground mb-3 text-lg font-medium md:text-2xl">
          Your Instant{" "}
          <span className="text-primary font-semibold">Image Editing</span>{" "}
          Destination.
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
          Free, fast, and entirely in your browser. No uploads, no accounts.
          Just pure editing power.
        </p>
      </motion.div>

      {/* Upload Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-lg"
      >
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ease-out md:p-10 ${
            isDragOver
              ? "border-primary bg-primary/5 shadow-md"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/10"
          } `}
        >
          <input
            aria-label="Upload image file"
            title="Upload image file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff"
            onChange={handleFileSelect}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />

          <div className="flex flex-col items-center space-y-4">
            <div className="bg-primary/10 border-primary/20 rounded-full border p-4">
              {isDragOver ? (
                <ImageIcon size={32} className="text-primary" />
              ) : (
                <Upload size={32} className="text-primary" />
              )}
            </div>

            <div className="space-y-2">
              <Button size="lg" className="px-6 py-2 font-medium">
                Upload Image
              </Button>
              <p className="text-muted-foreground text-sm">
                or drag and drop here
              </p>
            </div>

            <div className="text-muted-foreground space-y-1 text-xs">
              <p>Supports JPEG, PNG, WebP, GIF, AVIF, TIFF</p>
              <p>Max 10MB</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
