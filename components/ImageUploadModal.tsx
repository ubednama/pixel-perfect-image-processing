"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Upload, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onImageSelect: (imageUrl: string, filename?: string) => void
}

export function ImageUploadModal({ isOpen, onClose, onImageSelect }: ImageUploadModalProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Validate file type - more specific validation
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"]
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type! Please upload JPEG, PNG, WebP, GIF, AVIF, or TIFF images.")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB")
      return
    }

    setIsUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageSelect(result, file.name)
        onClose()
        setIsUploading(false)
        toast.success("Image uploaded successfully!")
      }
      reader.onerror = () => {
        toast.error("Failed to read image file")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload image")
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Upload New Image</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Upload Area */}
          <div className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageIcon size={24} className="text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Drag and drop your image here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                  <Button
                    onClick={handleBrowseClick}
                    className="gap-2"
                    disabled={isUploading}
                  >
                    <Upload size={16} />
                    Browse Files
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-muted-foreground text-center">
              Supported formats: JPG, PNG, GIF, WebP, AVIF, TIFF (max 10MB)
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Upload image file"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}