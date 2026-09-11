import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  // These are optional — env variables are used as fallback
  senderEmail?: string;
  senderPass?: string;
  smtpHost?: string;
  smtpPort?: number;
}

function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  const rfcMatch = trimmed.match(/^[^<]+<([^>]+)>$/);
  const actualEmail = rfcMatch ? rfcMatch[1].trim() : trimmed;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actualEmail);
}

// Convert plain text body to minimal HTML
function textToHtml(text: string, senderEmail?: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped.split(/\n\n+/).map((p) => {
    const lines = p.split(/\n/).join("<br/>");
    return `<p style="margin:0 0 16px 0;line-height:1.7;">${lines}</p>`;
  });

  const fromNote = senderEmail ? ` &mdash; from <em>${senderEmail}</em>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;font-size:15px;color:#1a1a2e;background:#ffffff;max-width:640px;margin:0 auto;padding:32px 24px;">
  <div style="border-left:4px solid #7c3aed;padding-left:20px;margin-bottom:24px;">
    ${paragraphs.join("")}
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">Sent via <strong>EmailSender MCP</strong>${fromNote}</p>
</body>
</html>`;
}

interface RecipientResult {
  email: string;
  status: "sent" | "failed";
  messageId?: string;
  error?: string;
}

// Extract recipient's name from email address or formatted contact string
function extractRecipientName(emailStr: string): { fullName: string; firstName: string } {
  const trimmed = emailStr.trim();

  // Case 1: "John Doe <john@example.com>"
  const rfcMatch = trimmed.match(/^([^<]+)<[^>]+>$/);
  if (rfcMatch && rfcMatch[1].trim()) {
    const rawName = rfcMatch[1].trim().replace(/^["']|["']$/g, "");
    const parts = rawName.split(/\s+/).filter(Boolean);
    return {
      fullName: rawName,
      firstName: parts[0] || rawName,
    };
  }

  // Case 2: Extract from local-part of email: "john.doe@gmail.com"
  const emailMatch = trimmed.match(/^([^@]+)@/);
  const localPart = emailMatch ? emailMatch[1] : trimmed;

  // Replace separators (dots, underscores, hyphens, plus) with spaces
  const cleaned = localPart
    .replace(/\+.*$/, "") // remove plus tags
    .replace(/[._\-]+/g, " ")
    .replace(/\d+/g, "") // remove numbers e.g. john123 -> john
    .trim();

  if (!cleaned) {
    return { fullName: "Valued Customer", firstName: "there" };
  }

  // Capitalize words
  const words = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  const fullName = words.join(" ");
  const firstName = words[0] || fullName;

  return { fullName, firstName };
}

// Personalize subject or body for an individual recipient
function personalizeContent(text: string, recipient: string): string {
  if (!text) return text;
  const { fullName, firstName } = extractRecipientName(recipient);

  let personalized = text;

  // 1. Replace explicit template placeholders
  personalized = personalized.replace(/\{\{\s*name\s*\}\}/gi, fullName);
  personalized = personalized.replace(/\{\s*name\s*\}/gi, fullName);
  personalized = personalized.replace(/\[\s*(recipient'?s?\s*)?name\s*\]/gi, fullName);

  personalized = personalized.replace(/\{\{\s*firstName\s*\}\}/gi, firstName);
  personalized = personalized.replace(/\{\s*firstName\s*\}/gi, firstName);
  personalized = personalized.replace(/\[\s*first\s*name\s*\]/gi, firstName);

  personalized = personalized.replace(/\{\{\s*email\s*\}\}/gi, recipient);
  personalized = personalized.replace(/\{\s*email\s*\}/gi, recipient);
  personalized = personalized.replace(/\[\s*email\s*\]/gi, recipient);

  // 2. If the email begins with a generic greeting or a combined list of names/emails
  // e.g. "Dear Team," / "Dear user1, user2 and user3," / "Hi everyone," / "Dear All,"
  const greetingRegex = /^([ \t]*(?:Dear|Hi|Hello|Hey))\s+([^,\n\r]+)(,|\b)/i;
  const match = personalized.match(greetingRegex);

  if (match) {
    const greetingWord = match[1];
    const greetedTarget = match[2].trim();

    const isGenericOrMulti =
      /^(team|all|everyone|everybody|recipients|folks|there)$/i.test(greetedTarget) ||
      greetedTarget.includes(",") ||
      greetedTarget.toLowerCase().includes(" and ") ||
      greetedTarget.includes("@");

    if (isGenericOrMulti) {
      personalized = personalized.replace(greetingRegex, `${greetingWord} ${fullName}$3`);
    }
  }

  return personalized;
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as SendEmailRequest;
    const { to, subject, body } = data;

    // Normalize recipients into clean array
    const rawRecipients: string[] = Array.isArray(to)
      ? to
      : typeof to === "string"
      ? to.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    const recipients = Array.from(new Set(rawRecipients)); // Deduplicate

    // Validation
    if (recipients.length === 0) {
      return Response.json({ error: "At least one recipient email address is required" }, { status: 400 });
    }

    const invalidRecipients = recipients.filter((r) => !validateEmail(r));
    if (invalidRecipients.length > 0) {
      const preview = invalidRecipients.slice(0, 3).join(", ");
      const extra = invalidRecipients.length > 3 ? ` and ${invalidRecipients.length - 3} more` : "";
      return Response.json(
        { error: `Invalid recipient address${invalidRecipients.length > 1 ? "es" : ""}: ${preview}${extra}` },
        { status: 400 }
      );
    }

    if (!subject?.trim()) {
      return Response.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!body?.trim()) {
      return Response.json({ error: "Email body is required" }, { status: 400 });
    }

    // Use values from request body, fall back to environment variables
    const senderEmail = data.senderEmail || process.env.SMTP_USER || "";
    const senderPass  = data.senderPass  || process.env.SMTP_PASS  || "";
    const smtpHost    = data.smtpHost    || process.env.SMTP_HOST   || "smtp.gmail.com";
    const smtpPort    = data.smtpPort    || Number(process.env.SMTP_PORT) || 587;

    if (!senderEmail || !validateEmail(senderEmail)) {
      return Response.json(
        { error: "Sender email not configured. Fill in SMTP Settings or set SMTP_USER in .env.local" },
        { status: 400 }
      );
    }
    if (!senderPass) {
      return Response.json(
        { error: "Sender password not configured. Fill in SMTP Settings or set SMTP_PASS in .env.local" },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: senderEmail,
        pass: senderPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection once before sending batch
    await transporter.verify();

    // Single recipient path for fastest turnaround
    if (recipients.length === 1) {
      const target = recipients[0];
      const personalizedSubject = personalizeContent(subject, target);
      const personalizedBody = personalizeContent(body, target);
      const personalizedHtml = textToHtml(personalizedBody, senderEmail);

      const info = await transporter.sendMail({
        from: `EmailSender MCP <${senderEmail}>`,
        to: target,
        subject: personalizedSubject,
        text: personalizedBody,
        html: personalizedHtml,
      });

      console.log(`✅ Email sent to ${target} — Message ID: ${info.messageId}`);

      return Response.json({
        success: true,
        total: 1,
        sent: 1,
        failed: 0,
        messageId: info.messageId,
        results: [{ email: target, status: "sent", messageId: info.messageId }],
      });
    }

    // Multiple recipients path: Individualized dispatch with rate-limit protection & dynamic name personalization
    console.log(`🚀 Dispatching email to ${recipients.length} recipients with per-user personalization...`);
    const results: RecipientResult[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const target = recipients[i];
      try {
        const personalizedSubject = personalizeContent(subject, target);
        const personalizedBody = personalizeContent(body, target);
        const personalizedHtml = textToHtml(personalizedBody, senderEmail);

        const info = await transporter.sendMail({
          from: `EmailSender MCP <${senderEmail}>`,
          to: target,
          subject: personalizedSubject,
          text: personalizedBody,
          html: personalizedHtml,
        });
        results.push({ email: target, status: "sent", messageId: info.messageId });
        console.log(`✅ [${i + 1}/${recipients.length}] Sent to ${target} (${info.messageId})`);
      } catch (sendErr: unknown) {
        const errDesc = sendErr instanceof Error ? sendErr.message : "Delivery failed";
        console.error(`❌ [${i + 1}/${recipients.length}] Failed sending to ${target}:`, errDesc);
        results.push({ email: target, status: "failed", error: errDesc });
      }

      // Small throttling pause between consecutive emails (200ms)
      if (i < recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    if (sentCount === 0) {
      return Response.json(
        {
          error: "Failed to deliver email to any of the recipients.",
          total: recipients.length,
          sent: 0,
          failed: failedCount,
          results,
        },
        { status: 500 }
      );
    }

    const firstSuccessId = results.find((r) => r.status === "sent")?.messageId;

    return Response.json({
      success: true,
      total: recipients.length,
      sent: sentCount,
      failed: failedCount,
      messageId: firstSuccessId,
      results,
    });
  } catch (err: unknown) {
    console.error("send-email error:", err);

    let message = "Failed to send email";
    if (err instanceof Error) {
      if (err.message.includes("Invalid login") || err.message.includes("EAUTH")) {
        message =
          "Authentication failed. Make sure you're using a Gmail App Password (not your normal password) and 2-Step Verification is enabled.";
      } else if (err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND")) {
        message = "Cannot connect to SMTP server. Check your host and port settings.";
      } else if (err.message.includes("ETIMEDOUT")) {
        message = "Connection timed out. Check your internet connection and SMTP port.";
      } else {
        message = err.message;
      }
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
