"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import EmailComposer from "@/components/EmailComposer";

// Dynamically import LiquidBackground to avoid SSR issues with Framer Motion
const LiquidBackground = dynamic(() => import("@/components/LiquidBackground"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        zIndex: 1,
      }}
    >
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
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: "99px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#a78bfa",
              letterSpacing: "0.05em",
            }}
          >
            <div className="pulse-dot" style={{ background: "#a78bfa" }} />
            Powered by OpenRouter AI · Gemini 2.0 Flash
          </div>
        </motion.div>

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
            color: "var(--text-muted)",
            fontSize: "12px",
            lineHeight: 1.7,
          }}
        >
          <p>
            EmailSender MCP — AI email composition with OpenRouter &amp; Nodemailer
          </p>
          <p style={{ marginTop: "4px" }}>
            Your SMTP credentials are never stored — they are used only for this session
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
