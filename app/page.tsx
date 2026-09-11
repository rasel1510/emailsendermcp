"use client";

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
      </div>
    </main>
  );
}
