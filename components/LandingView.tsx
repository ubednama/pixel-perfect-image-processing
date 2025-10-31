"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { motion } from "framer-motion"
import { Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface LandingViewProps {
  onImageUpload: (imageUrl: string, filename?: string) => void
}

export function LandingView({ onImageUpload }: LandingViewProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type! Please upload JPEG, PNG, WebP, GIF, AVIF, or TIFF images.")
      return false
    }

    if (file.size > maxSize) {
      toast.error("File too large! Maximum size is 10MB.")
      return false
    }

    return true
  }

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!validateFile(file)) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageUpload(result, file.name)
        toast.success("Image loaded successfully!")
      }
      reader.readAsDataURL(file)
    },
    [onImageUpload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [handleFileUpload],
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center mb-12 max-w-2xl"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mb-8 flex justify-center"
        >
          <img 
            src="/logo.svg" 
            alt="Pixel Perfect Logo" 
            className="w-24 h-24 md:w-32 md:h-32"
          />
        </motion.div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Pixel Perfect
        </h1>
        <h2 className="text-xl md:text-2xl font-medium mb-3 text-muted-foreground">
          Your Instant Image Editing Destination.
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Free, fast, and entirely in your browser. No uploads, no accounts. Just pure editing power.
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
          className={`
            relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ease-out
            ${
              isDragOver
                ? "border-primary bg-primary/5 shadow-md"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/10"
            }
          `}
        >
          <input
            aria-label="Upload image file"
            title="Upload image file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
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
              <p className="text-muted-foreground text-sm">or drag and drop here</p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Supports JPEG, PNG, WebP, GIF, AVIF, TIFF</p>
              <p>Max 10MB</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
