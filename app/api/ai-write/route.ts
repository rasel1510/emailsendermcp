import { NextRequest } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface AiWriteRequest {
  purpose: string;
  tone: string;
  recipient: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AiWriteRequest;
    const { purpose, tone, recipient } = body;

    if (!purpose?.trim()) {
      return Response.json({ error: "Purpose is required" }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      return Response.json({ error: "OpenRouter API key not configured" }, { status: 500 });
    }

    const systemPrompt = `You are an expert email copywriter. Generate professional, high-quality emails based on the user's requirements.
Always respond with a valid JSON object in this exact format:
{
  "subject": "<concise, compelling subject line>",
  "body": "<full email body with proper greeting, content, and signature placeholder>"
}
Do NOT wrap in markdown code blocks. Return raw JSON only.`;

    const userPrompt = `Write a ${tone} email with the following purpose:
${purpose}

${recipient ? `Recipient email: ${recipient}` : ""}

Requirements:
- Tone: ${tone}
- Keep it concise but complete
- Include a proper greeting, body paragraphs, and closing
- End with "[Your Name]" as signature placeholder
- Subject should be engaging and relevant`;

    const modelsToTry = [
      "google/gemini-2.5-flash",
      "google/gemini-3.5-flash-lite",
      "meta-llama/llama-3.3-70b-instruct:free",
    ];

    let lastError = null;
    let rawContent = "";

    for (const model of modelsToTry) {
      try {
        const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://emailsendermcp.app",
            "X-Title": "EmailSender MCP",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          rawContent = data.choices?.[0]?.message?.content ?? "";
          if (rawContent) break;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn(`Model ${model} failed (${res.status}):`, errData);
          lastError = errData?.error?.message || `Error ${res.status}`;
        }
      } catch (e: any) {
        lastError = e?.message;
      }
    }

    if (!rawContent) {
      return Response.json(
        { error: lastError || "Failed to generate email with available AI models" },
        { status: 500 }
      );
    }

    // Strip possible markdown fences
    const jsonStr = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: { subject: string; body: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback: try to extract subject/body via regex
      const subjectMatch = rawContent.match(/"subject"\s*:\s*"([^"]+)"/);
      const bodyMatch = rawContent.match(/"body"\s*:\s*"([\s\S]+?)(?:"\s*}|",)/);
      if (subjectMatch && bodyMatch) {
        parsed = {
          subject: subjectMatch[1],
          body: bodyMatch[1].replace(/\\n/g, "\n"),
        };
      } else {
        return Response.json(
          { error: "AI returned an unexpected format. Please try again." },
          { status: 500 }
        );
      }
    }

    return Response.json({ subject: parsed.subject, body: parsed.body });
  } catch (err: unknown) {
    console.error("ai-write error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
