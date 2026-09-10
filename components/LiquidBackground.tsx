"use client";

import { motion } from "framer-motion";

export default function LiquidBackground() {
  return (
    <div className="liquid-bg" aria-hidden="true">
      <motion.div
        className="blob blob-1"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="blob blob-2"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="blob blob-3"
        animate={{
          x: [0, 30, -40, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
      <motion.div
        className="blob blob-4"
        animate={{
          x: [0, -20, 40, 0],
          y: [0, 30, -20, 0],
          scale: [1, 1.05, 0.92, 1],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
}
