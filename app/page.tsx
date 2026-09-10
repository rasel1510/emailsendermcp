"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import EmailComposer from "@/components/EmailComposer";

// Dynamically import LiquidBackground and PwaInstallModal to avoid SSR issues
const LiquidBackground = dynamic(() => import("@/components/LiquidBackground"), {
  ssr: false,
});

const PwaInstallModal = dynamic(() => import("@/components/PwaInstallModal"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <main
      className="main-container"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
      }}
    >
      {/* PWA Prompt Modal */}
      <PwaInstallModal />
      {/* Animated liquid background */}
      <LiquidBackground />

      {/* Grid overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "680px" }}>
        {/* Main Composer Card */}
        <EmailComposer />

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{
            textAlign: "center",
            marginTop: "28px",
            color: "#cbd5e1",
            fontSize: "13px",
            lineHeight: 1.7,
            fontWeight: 400,
          }}
        >
          <p>
            EmailSender MCP — AI email composition with OpenRouter &amp; Nodemailer
          </p>
          <p style={{ marginTop: "4px", color: "#94a3b8" }}>
            Your SMTP credentials are secure and handled exclusively by your server session
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
