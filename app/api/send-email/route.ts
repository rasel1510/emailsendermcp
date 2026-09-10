import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  // These are optional — env variables are used as fallback
  senderEmail?: string;
  senderPass?: string;
  smtpHost?: string;
  smtpPort?: number;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Convert plain text body to minimal HTML
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped.split(/\n\n+/).map((p) => {
    const lines = p.split(/\n/).join("<br/>");
    return `<p style="margin:0 0 16px 0;line-height:1.7;">${lines}</p>`;
  });

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;font-size:15px;color:#1a1a2e;background:#ffffff;max-width:640px;margin:0 auto;padding:32px 24px;">
  <div style="border-left:4px solid #7c3aed;padding-left:20px;margin-bottom:24px;">
    ${paragraphs.join("")}
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">Sent via <strong>EmailSender MCP</strong> &mdash; from <em>rasel4897981@gmail.com</em></p>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as SendEmailRequest;
    const { to, subject, body } = data;

    // Use values from request body, fall back to environment variables
    const senderEmail = data.senderEmail || process.env.SMTP_USER || "";
    const senderPass  = data.senderPass  || process.env.SMTP_PASS  || "";
    const smtpHost    = data.smtpHost    || process.env.SMTP_HOST   || "smtp.gmail.com";
    const smtpPort    = data.smtpPort    || Number(process.env.SMTP_PORT) || 587;

    // Validation
    if (!to || !validateEmail(to)) {
      return Response.json({ error: "Invalid recipient email address" }, { status: 400 });
    }
    if (!subject?.trim()) {
      return Response.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!body?.trim()) {
      return Response.json({ error: "Email body is required" }, { status: 400 });
    }
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

    // Verify connection before sending
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: `EmailSender MCP <${senderEmail}>`,
      to,
      subject,
      text: body,
      html: textToHtml(body),
    });

    console.log(`✅ Email sent to ${to} — Message ID: ${info.messageId}`);

    return Response.json({
      success: true,
      messageId: info.messageId,
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
