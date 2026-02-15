"use client";

import { CustomCursor } from "@/components/CustomCursor";
import { EditorView } from "@/components/EditorView";
import { LandingView } from "@/components/LandingView";
import { MobileLandscapeLock } from "@/components/MobileLandscapeLock";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFilename, setOriginalFilename] = useState<string | null>(null);

  const handleImageUpload = (imageUrl: string, filename?: string) => {
    setUploadedImage(imageUrl);
    setOriginalImage(imageUrl);
    setOriginalFilename(filename || null);
  };

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
                onImageUpdate={setUploadedImage}
                onImageSelect={handleImageUpload}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
