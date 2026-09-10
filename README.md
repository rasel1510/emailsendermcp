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

## ✨ Features

- 🤖 **AI Write Mode** — Describe your email purpose + pick a tone, AI generates a complete subject & body (Powered by OpenRouter AI · Gemini 2.0 Flash)
- ✏️ **Manual Write Mode** — Write emails by hand with quick template shortcuts
- 🎨 **Liquid Glass UI** — Animated morphing blobs, glassmorphism card, grid overlay
- ⚡ **Framer Motion** — Spring-animated mode toggle, staggered entrance, smooth transitions
- 📬 **Real Email Sending** — Nodemailer + any SMTP provider (Gmail, Outlook, etc.)
- ✅ **Input Validation** — Email regex, required fields, descriptive error messages
- 🔒 **Secure** — SMTP credentials stored only in `.env.local` (never in source code)

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
