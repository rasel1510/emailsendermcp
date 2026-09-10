import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EmailSender MCP — AI-Powered Email Composer",
  description:
    "Professional AI-powered email sender. Compose emails with AI assistance or manually, and send them instantly via SMTP.",
  keywords: ["email", "AI", "email sender", "OpenRouter", "MCP"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
