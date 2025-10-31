"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CustomCursor } from "@/components/CustomCursor"
import { MobileLandscapeLock } from "@/components/MobileLandscapeLock"
import { LandingView } from "@/components/LandingView"
import { EditorView } from "@/components/EditorView"

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalFilename, setOriginalFilename] = useState<string | null>(null)

  const handleImageUpload = (imageUrl: string, filename?: string) => {
    setUploadedImage(imageUrl)
    setOriginalImage(imageUrl)
    setOriginalFilename(filename || null)
  }

  const handleReset = () => {
    setUploadedImage(null)
    setOriginalImage(null)
  }

  return (
    <>
      <CustomCursor />
      <MobileLandscapeLock />
      <div className="main-content min-h-screen">
        <AnimatePresence mode="wait">
          {!uploadedImage ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LandingView onImageUpload={handleImageUpload} />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <EditorView
                uploadedImage={uploadedImage!}
                originalImage={originalImage!}
                originalFilename={originalFilename}
                onReset={handleReset}
                onImageUpdate={setUploadedImage}
                onImageSelect={handleImageUpload}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
