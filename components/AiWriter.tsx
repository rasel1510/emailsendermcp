"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AiWriterProps {
  recipientEmail: string;
  isMultiple?: boolean;
  onGenerated: (subject: string, body: string) => void;
}

export default function AiWriter({ recipientEmail, isMultiple, onGenerated }: AiWriterProps) {
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<{ subject: string; body: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [generated?.body]);

  async function handleGenerate() {
    if (!purpose.trim()) {
      setError("Please describe the purpose of your email.");
      return;
    }
    setError("");
    setLoading(true);
    setGenerated(null);

    try {
      const res = await fetch("/api/ai-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          recipient: recipientEmail,
          isMultiple: Boolean(isMultiple),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI generation failed");
      }

      setGenerated({ subject: data.subject, body: data.body });
      onGenerated(data.subject, data.body);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleBodyEdit(val: string) {
    if (!generated) return;
    const updated = { ...generated, body: val };
    setGenerated(updated);
    onGenerated(updated.subject, updated.body);
  }

  function handleSubjectEdit(val: string) {
    if (!generated) return;
    const updated = { ...generated, subject: val };
    setGenerated(updated);
    onGenerated(updated.subject, updated.body);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* Purpose */}
      <div>
        <label className="label" htmlFor="ai-purpose">
          Email Purpose
        </label>
        <textarea
          id="ai-purpose"
          className="glow-input"
          placeholder="e.g. Schedule a product demo with a potential client for next week..."
          rows={3}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          style={{ resize: "none" }}
        />
        <div className="char-count">{purpose.length} chars</div>
      </div>

      {/* Generate Button */}
      <motion.button
        id="ai-generate-btn"
        className="btn-primary"
        style={{ width: "100%" }}
        onClick={handleGenerate}
        disabled={loading || !purpose.trim()}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
      >
        {loading ? (
          <>
            <div className="spinner" />
            Generating with AI…
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Generate with AI
          </>
        )}
      </motion.button>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "13px",
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Result */}
      <AnimatePresence>
        {generated && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "rgba(6,182,212,0.08)",
                border: "1px solid rgba(6,182,212,0.2)",
                borderRadius: "10px",
              }}
            >
              <div className="pulse-dot" />
              <span style={{ fontSize: "12px", color: "#22d3ee", fontWeight: 600 }}>
                AI Generated — Review &amp; Edit Below
              </span>
            </div>

            {/* Subject */}
            <div>
              <label className="label" htmlFor="ai-subject">
                Subject
              </label>
              <input
                id="ai-subject"
                className="glow-input"
                type="text"
                value={generated.subject}
                onChange={(e) => handleSubjectEdit(e.target.value)}
              />
            </div>

            {/* Body */}
            <div>
              <label className="label" htmlFor="ai-body">
                Email Body
              </label>
              <textarea
                id="ai-body"
                ref={textareaRef}
                className="glow-input"
                value={generated.body}
                onChange={(e) => handleBodyEdit(e.target.value)}
                style={{ minHeight: "180px", resize: "vertical" }}
              />
              <div className="char-count">{generated.body.length} chars</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
