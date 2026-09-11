"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DiscoveredContact {
  company: string;
  email: string;
  role?: string;
  formatted: string;
}

interface AiRecipientFinderProps {
  onAddRecipients: (emails: string[]) => void;
  onClose: () => void;
}

const PRESETS = [
  "Top 10 software companies",
  "Leading AI & machine learning companies",
  "Top cloud & SaaS platforms",
  "High-growth tech startups",
];

export default function AiRecipientFinder({ onAddRecipients, onClose }: AiRecipientFinderProps) {
  const [query, setQuery] = useState("Top 10 software companies");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<DiscoveredContact[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  async function handleSearch(searchQuery: string = query) {
    if (!searchQuery.trim()) {
      setError("Please enter a search topic or industry.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setSelected(new Set());

    try {
      const res = await fetch("/api/find-recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim(), count: 10 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to find emails");
      }

      const contacts: DiscoveredContact[] = data.contacts || [];
      setResults(contacts);
      // Select all by default
      setSelected(new Set(contacts.map((_, i) => i)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong while searching");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((_, i) => i)));
    }
  }

  function handleConfirmAdd() {
    const chosen = results
      .filter((_, i) => selected.has(i))
      .map((c) => c.formatted || c.email);

    if (chosen.length === 0) {
      setError("Please select at least one contact email to add.");
      return;
    }

    onAddRecipients(chosen);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.25 }}
      className="ai-finder-modal"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>🌐</span>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
            AI Internet Recipient Finder
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            fontSize: "18px",
            cursor: "pointer",
            padding: "2px 6px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "12px", lineHeight: 1.5 }}>
        Search the internet via OpenRouter to discover verified corporate contact emails for your target list.
      </p>

      {/* Preset pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="ai-finder-preset-btn"
            onClick={() => {
              setQuery(preset);
              handleSearch(preset);
            }}
          >
            🔍 {preset}
          </button>
        ))}
      </div>

      {/* Search Input Bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <input
          type="text"
          className="glow-input"
          style={{ padding: "10px 14px", fontSize: "14px", flex: 1 }}
          placeholder="e.g. top 10 software companies, healthcare startups in California..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          className="btn-primary"
          style={{ padding: "10px 20px", fontSize: "13px", whiteSpace: "nowrap" }}
          onClick={() => handleSearch()}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: "14px", height: "14px" }} />
              Searching…
            </>
          ) : (
            "Search Web"
          )}
        </button>
      </div>

      {/* Loading state message */}
      {loading && (
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            background: "rgba(124, 58, 237, 0.1)",
            borderRadius: "10px",
            border: "1px dashed rgba(167, 139, 250, 0.35)",
            marginBottom: "12px",
          }}
        >
          <p style={{ fontSize: "13px", color: "#c4b5fd", margin: 0 }}>
            🌐 Searching Google and internet sources for verified contact emails matching <strong>"{query}"</strong>…
          </p>
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: "12px",
              marginBottom: "12px",
            }}
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results List */}
      {results.length > 0 && !loading && (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            <span>
              Found <strong>{results.length}</strong> verified emails ({selected.size} selected):
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              style={{
                background: "none",
                border: "none",
                color: "#a78bfa",
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline",
              }}
            >
              {selected.size === results.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div
            style={{
              maxHeight: "220px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              paddingRight: "4px",
            }}
          >
            {results.map((item, idx) => (
              <label
                key={`${item.email}-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: selected.has(idx) ? "rgba(124, 58, 237, 0.18)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${selected.has(idx) ? "rgba(167, 139, 250, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontSize: "13px",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(idx)}
                  onChange={() => toggleSelect(idx)}
                  style={{ accentColor: "#7c3aed", width: "15px", height: "15px" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <strong style={{ color: "#ffffff", fontWeight: 600 }}>{item.company}</strong>
                    {item.role && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: "rgba(6, 182, 212, 0.15)",
                          color: "#38bdf8",
                          border: "1px solid rgba(6, 182, 212, 0.25)",
                        }}
                      >
                        {item.role}
                      </span>
                    )}
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: "12px", fontFamily: "monospace", marginTop: "2px" }}>
                    {item.email}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Action to add to composer */}
          <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAdd}
              className="btn-primary"
              style={{ padding: "8px 20px", fontSize: "13px" }}
              disabled={selected.size === 0}
            >
              Add {selected.size} Recipients to List ➔
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
