# 📧 EmailSender MCP

An industry-grade, AI-powered email sender built with **Next.js 16**, **Framer Motion**, and **OpenRouter AI**. Features a stunning liquid glass UI with animated morphing blobs.

![EmailSender MCP](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-purple?logo=framer)
![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-orange)

> **Powered by OpenRouter AI · Gemini 2.0 Flash**
> 
> Intelligent, contextual email generation with fine-tuned tone selection and one-click drafting.

---

## 🔌 Official Model Context Protocol (MCP) Server

This project includes a fully compliant **Model Context Protocol (MCP) server** (`mcp-server.mjs`) built with `@modelcontextprotocol/sdk` over standard `stdio`. 

It enables LLMs in **Claude Desktop, Cursor, Antigravity, Roo Code, VS Code**, etc., to draft and send real emails directly from chat without any UI buttons!

### MCP Tools Provided:
1. **`send_email`**:
   - `to`: Recipient email address
   - `subject`: Email subject
   - `body`: Plain-text or HTML message content
2. **`draft_email`**:
   - `purpose`: What the email is about
   - `tone`: `professional` | `friendly` | `formal` | `casual`
   - `recipient`: Optional recipient name/email for context

### How to Connect in Claude Desktop / Cursor:

Add to your `claude_desktop_config.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "emailsender": {
      "command": "node",
      "args": ["c:/Users/DELL/Desktop/emailsendermcp/mcp-server.mjs"],
      "env": {
        "OPENROUTER_API_KEY": "your_openrouter_api_key",
        "SMTP_USER": "your_email@gmail.com",
        "SMTP_PASS": "your_app_password"
      }
    }
  }
}
```

Now in Claude / Cursor, simply chat:
> *"Send a professional meeting confirmation to client@example.com for tomorrow at 3 PM."*
The AI will call the MCP tool directly in the conversation!

---

## ✨ Web App UI

In addition to the headless MCP server, this repo provides a modern Web & Mobile PWA interface with liquid glassmorphism.

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/rasel1510/emailsendermcp.git
cd emailsendermcp
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password   # 16-char App Password, no spaces
SMTP_FROM=your_email@gmail.com
```

> **Gmail App Password**: Enable 2FA → [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → Create → Copy the 16-character code.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + Vanilla CSS |
| Animations | Framer Motion |
| AI | OpenRouter → Gemini 2.0 Flash |
| Email | Nodemailer (SMTP) |
| Font | Inter (Google Fonts) |

---

## 📁 Project Structure

```
emailsendermcp/
├── app/
│   ├── page.tsx                  # Main page
│   ├── layout.tsx                # Root layout + SEO
│   ├── globals.css               # Design system + liquid effects
│   └── api/
│       ├── ai-write/route.ts     # POST: AI email generation
│       └── send-email/route.ts   # POST: SMTP email sending
├── components/
│   ├── LiquidBackground.tsx      # Animated blob background
│   ├── EmailComposer.tsx         # Main form container
│   ├── AiWriter.tsx              # AI compose panel
│   ├── ManualWriter.tsx          # Manual compose panel
│   └── SenderSettings.tsx        # SMTP config panel
└── .env.example                  # Environment variable template
```

---

## 📄 License

MIT
