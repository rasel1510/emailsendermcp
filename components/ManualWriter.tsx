"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ManualWriterProps {
  onChanged: (subject: string, body: string) => void;
}

export default function ManualWriter({ onChanged }: ManualWriterProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function update(s: string, b: string) {
    setSubject(s);
    setBody(b);
    onChanged(s, b);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* Subject */}
      <div>
        <label className="label" htmlFor="manual-subject">
          Subject
        </label>
        <input
          id="manual-subject"
          className="glow-input"
          type="text"
          placeholder="Email subject line…"
          value={subject}
          onChange={(e) => update(e.target.value, body)}
          maxLength={200}
        />
        <div className="char-count">{subject.length}/200</div>
      </div>

      {/* Body */}
      <div>
        <label className="label" htmlFor="manual-body">
          Email Body
        </label>
        <textarea
          id="manual-body"
          className="glow-input"
          placeholder="Type your email message here…"
          rows={10}
          value={body}
          onChange={(e) => update(subject, e.target.value)}
          style={{ resize: "vertical", minHeight: "200px" }}
        />
        <div className="char-count">{body.length} chars</div>
      </div>

      {/* Quick Templates */}
      <div>
        <label className="label">Quick Templates</label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            {
              name: "Follow-up",
              subject: "Following up on our conversation",
              body: "Hi,\n\nI wanted to follow up on our previous conversation. Please let me know if you have any questions or need additional information.\n\nBest regards,\n[Your Name]",
            },
            {
              name: "Introduction",
              subject: "Introduction — [Your Name]",
              body: "Hi,\n\nMy name is [Your Name] and I'm reaching out to introduce myself. I'd love to connect and explore potential opportunities to collaborate.\n\nLooking forward to hearing from you!\n\n[Your Name]",
            },
            {
              name: "Meeting Request",
              subject: "Meeting Request — [Topic]",
              body: "Hi,\n\nI hope this message finds you well. I'd like to schedule a meeting to discuss [topic]. Would you be available this week?\n\nPlease let me know a time that works best for you.\n\nThank you,\n[Your Name]",
            },
          ].map((template) => (
            <motion.button
              key={template.name}
              id={`template-${template.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="btn-secondary"
              style={{ fontSize: "13px", fontWeight: 600, padding: "8px 16px" }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => update(template.subject, template.body)}
              type="button"
            >
              {template.name}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
