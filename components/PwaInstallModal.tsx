"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already installed, no need to show
    }

    // Check if dismissed recently (sessionStorage)
    const dismissed = sessionStorage.getItem("pwa_modal_dismissed");
    if (dismissed) {
      return;
    }

    // Detect iOS device (Safari doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show iOS instruction modal after a short delay
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Android / Chromium beforeinstallprompt handler
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 1.5s for page to settle then show modal
      setTimeout(() => {
        setShowModal(true);
      }, 1500);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowModal(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // For iOS, user manually adds via share button
      setShowModal(false);
    } else {
      setShowModal(false);
    }
  }

  function handleDismiss() {
    setShowModal(false);
    sessionStorage.setItem("pwa_modal_dismissed", "true");
  }

  return (
    <AnimatePresence>
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(5, 5, 16, 0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "rgba(20, 16, 48, 0.95)",
              border: "1px solid rgba(167, 139, 250, 0.35)",
              borderRadius: "24px",
              padding: "28px 24px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.2)",
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* App Icon */}
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 16px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.4)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#0d0a21",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "8px",
              }}
            >
              Install EmailSender App
            </h3>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "14px",
                color: "#cbd5e1",
                lineHeight: 1.6,
                marginBottom: "20px",
              }}
            >
              Install this app on your phone or desktop for instant access, offline readiness, and a seamless native experience!
            </p>

            {/* iOS Instructions or One-Click Android Button */}
            {isIOS ? (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(167, 139, 250, 0.25)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "#e2e8f0",
                  lineHeight: 1.6,
                  textAlign: "left",
                }}
              >
                <p style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span>1. Tap the</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      background: "rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </span>
                  <strong>Share button</strong> in Safari.
                </p>
                <p>2. Scroll down &amp; tap <strong>&quot;Add to Home Screen&quot;</strong>.</p>
              </div>
            ) : null}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={handleDismiss}
                className="btn-secondary"
                style={{ flex: 1, padding: "12px", fontSize: "14px" }}
                type="button"
              >
                Not Now
              </button>

              <button
                onClick={handleInstallClick}
                className="btn-primary"
                style={{ flex: 1, padding: "12px", fontSize: "14px" }}
                type="button"
              >
                {isIOS ? "Got It!" : "Install App"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
