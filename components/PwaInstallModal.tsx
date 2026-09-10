"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Register Service Worker for PWA compliance
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log("SW register error:", err));
    }

    // Check if already running in standalone PWA mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(standalone);

    if (standalone) {
      return; // Already installed, do not show
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Android / Chrome beforeinstallprompt event
    const promptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", promptHandler);

    // Show on bottom-right after 1.5s delay if not dismissed recently
    const dismissed = sessionStorage.getItem("pwa_toast_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowToast(true);
      }, 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", promptHandler);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", promptHandler);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowToast(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowToast(false);
    }
  }

  function handleDismiss() {
    setShowToast(false);
    sessionStorage.setItem("pwa_toast_dismissed", "true");
  }

  if (isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      {showToast && (
        <aside
          aria-label="PWA install banner"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            width: "calc(100% - 48px)",
            maxWidth: "380px",
            pointerEvents: "auto",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={{
              background: "rgba(18, 14, 44, 0.92)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(167, 139, 250, 0.35)",
              borderRadius: "20px",
              padding: "18px 20px",
              boxShadow:
                "0 20px 50px rgba(0, 0, 0, 0.65), 0 0 35px rgba(124, 58, 237, 0.25), 0 1px 0 rgba(255, 255, 255, 0.1) inset",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top decorative gradient line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, #7c3aed, #06b6d4, #ec4899)",
              }}
            />

            {/* Close 'X' button in corner */}
            <button
              onClick={handleDismiss}
              aria-label="Close"
              type="button"
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#cbd5e1",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#cbd5e1";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Header with App Icon & Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(124, 58, 237, 0.4)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#0d0a21",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: 0, lineHeight: 1.2 }}>
                  Install App
                </h4>
              </div>
            </div>

            {/* iOS Instructions */}
            {isIOS && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(167, 139, 250, 0.2)",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  marginBottom: "14px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                  lineHeight: 1.5,
                }}
              >
                <span>Tap </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "18px",
                    height: "18px",
                    background: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "4px",
                    verticalAlign: "middle",
                    margin: "0 2px",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>
                <span> Share in Safari → &quot;Add to Home Screen&quot;.</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={handleDismiss}
                className="btn-secondary"
                style={{ padding: "8px 14px", fontSize: "13px", fontWeight: 600 }}
                type="button"
              >
                Later
              </button>

              <button
                onClick={handleInstallClick}
                className="btn-primary"
                style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 700 }}
                type="button"
              >
                {isIOS ? "Got It" : "Install"}
              </button>
            </div>
          </motion.div>
        </aside>
      )}
    </AnimatePresence>
  );
}
