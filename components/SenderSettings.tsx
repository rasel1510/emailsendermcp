"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SenderConfig {
  senderEmail: string;
  senderPass: string;
  smtpHost: string;
  smtpPort: number;
}

interface SenderSettingsProps {
  onSettingsChange: (settings: SenderConfig) => void;
}

export default function SenderSettings({ onSettingsChange }: SenderSettingsProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<SenderConfig>({
    senderEmail: "",
    senderPass: "",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
  });

  // If fields are blank, the server uses .env.local automatically
  const usingEnvDefaults = !config.senderEmail && !config.senderPass;

  function update(partial: Partial<SenderConfig>) {
    const next = { ...config, ...partial };
    setConfig(next);
    onSettingsChange(next);
  }

  return (
    <div>
      <motion.button
        id="sender-settings-toggle"
        className="btn-secondary"
        style={{ width: "100%", justifyContent: "space-between" }}
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="button"
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
          Sender SMTP Settings
          {usingEnvDefaults ? (
            <span className="badge badge-success" style={{ marginLeft: "4px" }}>
              ✓ Auto-configured
            </span>
          ) : (
            <span className="badge badge-success" style={{ marginLeft: "4px" }}>
              ✓ Custom
            </span>
          )}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="settings-panel" style={{ marginTop: "12px" }}>

              {/* Auto-configured notice */}
              {usingEnvDefaults && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "12px 14px",
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: "10px",
                    marginBottom: "16px",
                    fontSize: "12px",
                    color: "#34d399",
                    lineHeight: 1.6,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: "1px" }}>
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  <span>
                    <strong>Auto-configured from .env.local</strong> — using{" "}
                    <code style={{ background: "rgba(16,185,129,0.15)", padding: "1px 5px", borderRadius: "4px" }}>
                      rasel4897981@gmail.com
                    </code>
                    . Leave fields blank to keep using it, or override below.
                  </span>
                </div>
              )}

              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.6 }}>
                📧 For Gmail, use an{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--accent-cyan)", textDecoration: "underline" }}
                >
                  App Password
                </a>{" "}
                (not your Gmail password). Override only if you want to use a different sender.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label" htmlFor="sender-email">
                    Override Email Address
                  </label>
                  <input
                    id="sender-email"
                    className="glow-input"
                    type="email"
                    placeholder="Leave blank to use rasel4897981@gmail.com"
                    value={config.senderEmail}
                    onChange={(e) => update({ senderEmail: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label" htmlFor="sender-pass">
                    Override App Password
                  </label>
                  <input
                    id="sender-pass"
                    className="glow-input"
                    type="password"
                    placeholder="Leave blank to use configured App Password"
                    value={config.senderPass}
                    onChange={(e) => update({ senderPass: e.target.value })}
                    autoComplete="current-password"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="smtp-host">
                    SMTP Host
                  </label>
                  <input
                    id="smtp-host"
                    className="glow-input"
                    type="text"
                    value={config.smtpHost}
                    onChange={(e) => update({ smtpHost: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label" htmlFor="smtp-port">
                    SMTP Port
                  </label>
                  <input
                    id="smtp-port"
                    className="glow-input"
                    type="number"
                    value={config.smtpPort}
                    onChange={(e) => update({ smtpPort: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
