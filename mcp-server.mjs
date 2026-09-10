

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import nodemailer from "nodemailer";

import fs from "fs";
import path from "path";

// Auto-read from .env.local if present
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.trim().match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  }
} catch (_) { }

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const server = new Server(
  {
    name: "emailsendermcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// 1. Declare available MCP Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send_email",
        description:
          "Send an email to a recipient via SMTP (Gmail) with subject and body content.",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "The recipient's email address (e.g. client@example.com)",
            },
            subject: {
              type: "string",
              description: "The email subject line",
            },
            body: {
              type: "string",
              description: "The plain-text or HTML content of the email",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "draft_email",
        description:
          "Generate an AI-composed email subject and body based on a purpose, tone, and recipient.",
        inputSchema: {
          type: "object",
          properties: {
            purpose: {
              type: "string",
              description: "The purpose or context of the email (e.g. follow up on invoice, project proposal)",
            },
            tone: {
              type: "string",
              enum: ["professional", "friendly", "formal", "casual"],
              description: "The desired tone for the email",
            },
            recipient: {
              type: "string",
              description: "Optional recipient email or name for context",
            },
          },
          required: ["purpose"],
        },
      },
    ],
  };
});

// 2. Handle MCP Tool Execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "send_email") {
    const { to, subject, body } = args || {};

    if (!to || !subject || !body) {
      return {
        isError: true,
        content: [{ type: "text", text: "Missing required fields: to, subject, body" }],
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
        tls: { rejectUnauthorized: false },
      });

      const info = await transporter.sendMail({
        from: `EmailSender MCP <${SMTP_USER}>`,
        to,
        subject,
        text: body,
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ Email successfully sent to ${to}!\nMessage ID: ${info.messageId}\nSubject: ${subject}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to send email: ${err.message}` }],
      };
    }
  }

  if (name === "draft_email") {
    const { purpose, tone = "professional", recipient = "" } = args || {};

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://emailsendermcp.app",
          "X-Title": "EmailSender MCP",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an expert email copywriter. Return ONLY valid JSON in format: {\"subject\": \"...\", \"body\": \"...\"}",
            },
            {
              role: "user",
              content: `Write a ${tone} email for the purpose: ${purpose}${recipient ? ` to: ${recipient}` : ""}`,
            },
          ],
          max_tokens: 800,
        }),
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const cleaned = raw.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        content: [
          {
            type: "text",
            text: `Subject: ${parsed.subject}\n\nBody:\n${parsed.body}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `AI draft failed: ${err.message}` }],
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

// 3. Declare MCP Prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "compose_and_send",
        description: "Interactive prompt to draft and send an email in chat",
        arguments: [
          {
            name: "recipient",
            description: "Who should receive the email?",
            required: true,
          },
          {
            name: "goal",
            description: "What should the email say or achieve?",
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name === "compose_and_send") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please draft a professional email to ${args?.recipient} about: ${args?.goal}. Ask me for approval before calling the send_email tool.`,
          },
        },
      ],
    };
  }
  throw new Error(`Prompt not found: ${name}`);
});

// 4. Start stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EmailSender MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error in MCP server:", err);
  process.exit(1);
});
