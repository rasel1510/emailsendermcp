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
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Register Service Worker for full PWA criteria
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log("SW register error:", err));
    }

    // Check if already running as installed app
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

    // Listen for native Android/Chrome beforeinstallprompt
    const promptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", promptHandler);

    // Always show modal after 1.5s delay if not already dismissed in this session
    const dismissed = sessionStorage.getItem("pwa_modal_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowModal(true);
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
        setShowModal(false);
      }
      setDeferredPrompt(null);
    } else {
      // If browser doesn't support direct programmatic prompt (e.g. Firefox, Safari desktop),
      // we notify user or close
      setShowModal(false);
    }
  }

  function handleDismiss() {
    setShowModal(false);
    sessionStorage.setItem("pwa_modal_dismissed", "true");
  }

  if (isStandalone) {
    return null;
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
            background: "rgba(5, 5, 16, 0.8)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 25 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.25 }}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "rgba(20, 16, 48, 0.96)",
              border: "1px solid rgba(167, 139, 250, 0.35)",
              borderRadius: "24px",
              padding: "32px 24px",
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.7), 0 0 50px rgba(124, 58, 237, 0.25)",
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* App Icon */}
            <div
              style={{
                width: "68px",
                height: "68px",
                margin: "0 auto 18px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 28px rgba(124, 58, 237, 0.45)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#0d0a21",
                  borderRadius: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: "22px",
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
              Install this app on your phone or PC for instant access, native performance, and a full-screen experience!
            </p>

            {/* iOS Instructions */}
            {isIOS && (
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
            )}

            {/* Desktop browser hint if no beforeinstallprompt */}
            {!isIOS && !deferredPrompt && (
              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>
                💡 If on Chrome/Edge desktop, you can also click the install icon (➕) in your browser address bar.
              </p>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={handleDismiss}
                className="btn-secondary"
                style={{ flex: 1, padding: "13px", fontSize: "14px", fontWeight: 600 }}
                type="button"
              >
                Not Now
              </button>

              <button
                onClick={handleInstallClick}
                className="btn-primary"
                style={{ flex: 1, padding: "13px", fontSize: "14px", fontWeight: 700 }}
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
