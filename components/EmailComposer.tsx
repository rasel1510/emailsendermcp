"use client";

import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AiWriter from "./AiWriter";
import ManualWriter from "./ManualWriter";

type Mode = "ai" | "manual";
type RecipientMode = "single" | "multiple";
type SendStatus = "idle" | "sending" | "success" | "error";

interface RecipientResult {
  email: string;
  status: "sent" | "failed";
  messageId?: string;
  error?: string;
}

interface SendSummary {
  total: number;
  sent: number;
  failed: number;
  results?: RecipientResult[];
}

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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function EmailComposer() {
  const [mode, setMode] = useState<Mode>("ai");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("single");

  // Single recipient state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Multiple recipients state
  const [recipients, setRecipients] = useState<string[]>([]);
  const [chipInput, setChipInput] = useState("");
  const [multiEmailError, setMultiEmailError] = useState("");
  const [duplicateNotice, setDuplicateNotice] = useState("");
  const [isChipBoxFocused, setIsChipBoxFocused] = useState(false);
  const chipInputRef = useRef<HTMLInputElement>(null);

  // Email content & status
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendMessage, setSendMessage] = useState("");
  const [sendSummary, setSendSummary] = useState<SendSummary | null>(null);
  const [showResultsDetail, setShowResultsDetail] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Single recipient change handler
  function handleRecipientChange(val: string) {
    setRecipientEmail(val);
    if (val && !validateEmail(val)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  }

  // Multi-recipient parsing helper
  function addEmailsFromText(rawText: string) {
    const tokens = rawText
      .split(/[,;\n\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) return;

    const validNewEmails: string[] = [];
    let duplicates = 0;
    const invalidList: string[] = [];

    tokens.forEach((token) => {
      if (!validateEmail(token)) {
        invalidList.push(token);
      } else if (recipients.includes(token) || validNewEmails.includes(token)) {
        duplicates++;
      } else {
        validNewEmails.push(token);
      }
    });

    if (validNewEmails.length > 0) {
      setRecipients((prev) => [...prev, ...validNewEmails]);
      setMultiEmailError("");
    }

    if (duplicates > 0) {
      setDuplicateNotice(`${duplicates} duplicate email${duplicates > 1 ? "s were" : " was"} ignored.`);
      setTimeout(() => setDuplicateNotice(""), 4000);
    }

    if (invalidList.length > 0) {
      setMultiEmailError(
        `Invalid address${invalidList.length > 1 ? "es" : ""}: ${invalidList.slice(0, 2).join(", ")}${
          invalidList.length > 2 ? ` and ${invalidList.length - 2} more` : ""
        }`
      );
    }

    setChipInput("");
  }

  function handleChipInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      if (chipInput.trim()) {
        addEmailsFromText(chipInput);
      }
    } else if (e.key === "Backspace" && !chipInput && recipients.length > 0) {
      // Remove last chip when pressing backspace on empty input
      setRecipients((prev) => prev.slice(0, -1));
    }
  }

  function handleChipInputPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasteData = e.clipboardData.getData("text");
    if (pasteData && (pasteData.includes(",") || pasteData.includes(";") || pasteData.includes("\n") || pasteData.includes(" "))) {
      e.preventDefault();
      addEmailsFromText(pasteData);
    }
  }

  function removeRecipient(index: number) {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  }

  function clearAllRecipients() {
    setRecipients([]);
    setChipInput("");
    setMultiEmailError("");
  }

  async function handleSend() {
    let targetRecipients: string[] = [];

    if (recipientMode === "single") {
      if (!validateEmail(recipientEmail)) {
        setEmailError("Please enter a valid email address.");
        return;
      }
      targetRecipients = [recipientEmail.trim()];
    } else {
      // If user typed an email in the chip input and didn't press enter, include it if valid
      let currentList = [...recipients];
      if (chipInput.trim()) {
        if (validateEmail(chipInput)) {
          if (!currentList.includes(chipInput.trim())) {
            currentList.push(chipInput.trim());
            setRecipients(currentList);
            setChipInput("");
          }
        } else {
          setMultiEmailError("Please resolve or finish typing the current email address.");
          return;
        }
      }

      if (currentList.length === 0) {
        setMultiEmailError("Please add at least one recipient email account.");
        return;
      }
      targetRecipients = currentList;
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
    setSendSummary(null);
    setShowResultsDetail(false);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientMode === "single" ? targetRecipients[0] : targetRecipients,
          subject,
          body,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSendStatus("success");
      setSendSummary({
        total: data.total || targetRecipients.length,
        sent: data.sent ?? 1,
        failed: data.failed ?? 0,
        results: data.results,
      });

      if (recipientMode === "single") {
        setSendMessage(`Email delivered successfully! Message ID: ${data.messageId}`);
      } else {
        const failPart = data.failed > 0 ? ` (${data.failed} failed)` : "";
        setSendMessage(`Dispatched to ${data.sent} of ${data.total} accounts successfully${failPart}!`);
      }

      // Clear all fields and composer states upon successful send
      setRecipientEmail("");
      setEmailError("");
      setRecipients([]);
      setChipInput("");
      setMultiEmailError("");
      setDuplicateNotice("");
      setSubject("");
      setBody("");
      setResetKey((prev) => prev + 1);

      // Auto clear non-error notices after 8 seconds
      setTimeout(() => {
        setSendStatus("idle");
        setSendMessage("");
      }, 8000);
    } catch (err: unknown) {
      setSendStatus("error");
      setSendMessage(err instanceof Error ? err.message : "Failed to send email");
    }
  }

  // Value passed to AI writer as context
  const aiRecipientContext =
    recipientMode === "single"
      ? recipientEmail
      : recipients.length > 0
      ? `${recipients.length} recipients (${recipients.slice(0, 2).join(", ")}${recipients.length > 2 ? "..." : ""})`
      : "multiple recipients";

  return (
    <motion.div
      className="glass-card"
      style={{
        width: "100%",
        maxWidth: "680px",
        margin: "0 auto",
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
      </motion.div>

      {/* Recipient Section */}
      <motion.div variants={childVariants} style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label className="label" style={{ margin: 0 }}>
            Recipient Accounts
          </label>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            {recipientMode === "single" ? "Direct Delivery" : "Individualized Batch Dispatch"}
          </span>
        </div>

        {/* Recipient Mode Selector */}
        <div className="recipient-mode-selector">
          <button
            id="recipient-mode-single"
            type="button"
            className={`recipient-mode-btn ${recipientMode === "single" ? "active" : ""}`}
            onClick={() => setRecipientMode("single")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Single Account
          </button>
          <button
            id="recipient-mode-multiple"
            type="button"
            className={`recipient-mode-btn ${recipientMode === "multiple" ? "active" : ""}`}
            onClick={() => setRecipientMode("multiple")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Multiple Accounts
          </button>
        </div>

        {/* Single Recipient Input */}
        {recipientMode === "single" ? (
          <div>
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
          </div>
        ) : (
          /* Multiple Recipients Chip Input */
          <div>
            <div
              className={`recipient-chips-container ${isChipBoxFocused ? "focused" : ""}`}
              onClick={() => chipInputRef.current?.focus()}
            >
              {/* Chip Tags */}
              {recipients.map((email, idx) => (
                <span key={`${email}-${idx}`} className="recipient-chip">
                  <span>{email}</span>
                  <button
                    type="button"
                    className="recipient-chip-remove"
                    title={`Remove ${email}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecipient(idx);
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}

              {/* Typing / Paste input */}
              <input
                ref={chipInputRef}
                id="recipient-multi-input"
                className="recipient-chip-input"
                type="text"
                placeholder={recipients.length === 0 ? "Type or paste emails (press Enter or comma)..." : "Add more emails..."}
                value={chipInput}
                onChange={(e) => {
                  setChipInput(e.target.value);
                  setMultiEmailError("");
                }}
                onKeyDown={handleChipInputKeyDown}
                onPaste={handleChipInputPaste}
                onFocus={() => setIsChipBoxFocused(true)}
                onBlur={() => {
                  setIsChipBoxFocused(false);
                  if (chipInput.trim()) {
                    addEmailsFromText(chipInput);
                  }
                }}
              />
            </div>

            {/* Bottom status bar */}
            <div className="recipient-stats-bar">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span>👥 {recipients.length} account{recipients.length !== 1 ? "s" : ""}</span>
                <span style={{ color: "#64748b" }}>•</span>
                <span style={{ color: "#94a3b8" }}>Safe individualized delivery</span>
              </span>

              {recipients.length > 0 && (
                <button type="button" className="clear-recipients-btn" onClick={clearAllRecipients}>
                  Clear all
                </button>
              )}
            </div>

            {/* Error or Duplicate notice */}
            <AnimatePresence>
              {multiEmailError && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{ color: "#f87171", fontSize: "12px", marginTop: "6px" }}
                >
                  {multiEmailError}
                </motion.p>
              )}
              {duplicateNotice && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{ color: "#38bdf8", fontSize: "12px", marginTop: "6px" }}
                >
                  ℹ️ {duplicateNotice}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Personalization hint */}
            <div
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(124, 58, 237, 0.12)",
                border: "1px solid rgba(124, 58, 237, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#c4b5fd",
                lineHeight: 1.4,
              }}
            >
              <span>
                ✨ <strong>Auto-Personalization:</strong> Each recipient will be addressed by their own individual name. You can also use{" "}
                <code style={{ background: "rgba(255,255,255,0.12)", padding: "1px 5px", borderRadius: "4px", color: "#38bdf8" }}>
                  {"{{name}}"}
                </code>{" "}
                in the body or subject.
              </span>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div variants={childVariants}>
        <div className="divider" style={{ marginBottom: "24px" }} />
      </motion.div>

      {/* Mode Toggle */}
      <motion.div variants={childVariants} style={{ marginBottom: "24px" }}>
        <label className="label">Compose Mode</label>
        <div className="mode-toggle" style={{ position: "relative" }}>
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
              key={`ai-${resetKey}`}
              recipientEmail={aiRecipientContext}
              isMultiple={recipientMode === "multiple"}
              onGenerated={(s, b) => {
                setSubject(s);
                setBody(b);
              }}
            />
          ) : (
            <ManualWriter
              key={`manual-${resetKey}`}
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
              {recipientMode === "multiple"
                ? `Dispatching to ${recipients.length} Accounts…`
                : "Sending Email…"}
            </>
          ) : sendStatus === "success" ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20,6 9,17 4,12" />
              </svg>
              {recipientMode === "multiple" ? "Batch Sent Successfully!" : "Email Sent!"}
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9 22,2" />
              </svg>
              {recipientMode === "multiple"
                ? `Send to ${recipients.length || 0} Account${recipients.length !== 1 ? "s" : ""}`
                : "Send Email"}
            </>
          )}
        </motion.button>

        {/* Animated progress bar during batch send */}
        {sendStatus === "sending" && (
          <div className="send-progress-bar">
            <div className="send-progress-fill" style={{ width: "100%" }} />
          </div>
        )}
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
              flexDirection: "column",
              gap: "8px",
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
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
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
              <div style={{ flex: 1, lineHeight: 1.5 }}>
                <span>{sendMessage}</span>
              </div>

              {/* Show breakdown button if multiple results exist */}
              {sendSummary && sendSummary.results && sendSummary.results.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowResultsDetail(!showResultsDetail)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    textDecoration: "underline",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {showResultsDetail ? "Hide Details" : "View Details"}
                </button>
              )}
            </div>

            {/* Recipient Details Drawer */}
            {showResultsDetail && sendSummary?.results && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{
                  marginTop: "6px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  maxHeight: "160px",
                  overflowY: "auto",
                }}
              >
                {sendSummary.results.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: r.status === "sent" ? "#e2e8f0" : "#fca5a5",
                    }}
                  >
                    <span>{r.status === "sent" ? "✓" : "✗"} {r.email}</span>
                    <span style={{ opacity: 0.7 }}>{r.status === "sent" ? "Delivered" : (r.error || "Failed")}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
