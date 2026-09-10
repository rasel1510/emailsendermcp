"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AiWriter from "./AiWriter";
import ManualWriter from "./ManualWriter";

type Mode = "ai" | "manual";
type SendStatus = "idle" | "sending" | "success" | "error";

const containerVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
      staggerChildren: 0.1,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EmailComposer() {
  const [mode, setMode] = useState<Mode>("ai");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendMessage, setSendMessage] = useState("");

  function handleRecipientChange(val: string) {
    setRecipientEmail(val);
    if (val && !validateEmail(val)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  }

  async function handleSend() {
    if (!validateEmail(recipientEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!subject.trim()) {
      setSendMessage("Please add a subject line.");
      setSendStatus("error");
      return;
    }
    if (!body.trim()) {
      setSendMessage("Please add email body content.");
      setSendStatus("error");
      return;
    }
    setSendStatus("sending");
    setSendMessage("");

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          body,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSendStatus("success");
      setSendMessage(`Email sent successfully! Message ID: ${data.messageId}`);
      // Reset after 5 seconds
      setTimeout(() => {
        setSendStatus("idle");
        setSendMessage("");
      }, 6000);
    } catch (err: unknown) {
      setSendStatus("error");
      setSendMessage(err instanceof Error ? err.message : "Failed to send email");
    }
  }

  return (
    <motion.div
      className="glass-card"
      style={{
        width: "100%",
        maxWidth: "680px",
        margin: "0 auto",
        padding: "40px",
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={childVariants} style={{ marginBottom: "32px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))",
            border: "1px solid rgba(124,58,237,0.4)",
            marginBottom: "16px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#g1)" strokeWidth="1.8">
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <h1 className="gradient-text" style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1.2 }}>
          EmailSender MCP
        </h1>
        <p style={{ color: "#e2e8f0", fontSize: "14px", marginTop: "8px", fontWeight: 400 }}>
          AI-powered email composer — craft and send professional emails instantly
        </p>
      </motion.div>

      {/* Recipient */}
      <motion.div variants={childVariants} style={{ marginBottom: "24px" }}>
        <label className="label" htmlFor="recipient-email">
          To (Recipient Email)
        </label>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#a78bfa",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </span>
          <input
            id="recipient-email"
            className="glow-input"
            type="email"
            placeholder="recipient@example.com"
            value={recipientEmail}
            onChange={(e) => handleRecipientChange(e.target.value)}
            style={{ paddingLeft: "40px" }}
          />
        </div>
        <AnimatePresence>
          {emailError && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{ color: "#f87171", fontSize: "12px", marginTop: "6px" }}
            >
              {emailError}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={childVariants}>
        <div className="divider" style={{ marginBottom: "24px" }} />
      </motion.div>

      {/* Mode Toggle */}
      <motion.div variants={childVariants} style={{ marginBottom: "24px" }}>
        <label className="label">Compose Mode</label>
        <div className="mode-toggle" style={{ position: "relative" }}>
          {/* Animated pill */}
          <motion.div
            layoutId="mode-pill"
            style={{
              position: "absolute",
              top: "4px",
              bottom: "4px",
              left: mode === "ai" ? "4px" : "calc(50% + 1px)",
              width: "calc(50% - 5px)",
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
          <button
            id="mode-ai-btn"
            className={`mode-btn ${mode === "ai" ? "active" : ""}`}
            onClick={() => setMode("ai")}
            type="button"
          >
            ✨ AI Write
          </button>
          <button
            id="mode-manual-btn"
            className={`mode-btn ${mode === "manual" ? "active" : ""}`}
            onClick={() => setMode("manual")}
            type="button"
          >
            ✏️ Manual Write
          </button>
        </div>
      </motion.div>

      {/* Compose Panel */}
      <motion.div variants={childVariants} style={{ marginBottom: "24px" }}>
        <AnimatePresence mode="wait">
          {mode === "ai" ? (
            <AiWriter
              key="ai"
              recipientEmail={recipientEmail}
              onGenerated={(s, b) => {
                setSubject(s);
                setBody(b);
              }}
            />
          ) : (
            <ManualWriter
              key="manual"
              onChanged={(s, b) => {
                setSubject(s);
                setBody(b);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>



      {/* Send Button */}
      <motion.div variants={childVariants}>
        <motion.button
          id="send-email-btn"
          className="btn-primary"
          style={{ width: "100%", padding: "16px 32px", fontSize: "16px" }}
          onClick={handleSend}
          disabled={sendStatus === "sending" || sendStatus === "success"}
          whileHover={{ scale: sendStatus === "sending" ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
        >
          {sendStatus === "sending" ? (
            <>
              <div className="spinner" />
              Sending Email…
            </>
          ) : sendStatus === "success" ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20,6 9,17 4,12" />
              </svg>
              Email Sent!
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9 22,2" />
              </svg>
              Send Email
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Send Status Message */}
      <AnimatePresence>
        {sendMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              marginTop: "16px",
              padding: "14px 18px",
              borderRadius: "12px",
              fontSize: "13px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              ...(sendStatus === "success"
                ? {
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "#34d399",
                  }
                : {
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171",
                  }),
            }}
          >
            {sendStatus === "success" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: "1px" }}>
                <polyline points="20,6 9,17 4,12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span style={{ lineHeight: 1.5 }}>{sendMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
