"use client";

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

export function MobileLandscapeLock() {
  return (
    <div className="mobile-landscape-lock bg-background fixed inset-0 z-50 flex-col items-center justify-center p-8 text-center">
      <motion.div
        animate={{ rotate: 90 }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="mb-8"
      >
        <RotateCcw size={64} className="text-muted-foreground" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="mb-4 text-2xl font-semibold">
          Please rotate your device
        </h2>
        <p className="text-muted-foreground">
          For the best experience with Pixel Perfect
        </p>
      </motion.div>
    </div>
  );
}
