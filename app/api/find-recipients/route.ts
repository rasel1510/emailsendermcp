import { NextRequest } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface FindRecipientsRequest {
  query: string;
  count?: number;
}

interface RawContact {
  company?: string;
  name?: string;
  email: string;
  role?: string;
  domain?: string;
}

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  // Filter out dummy/template emails
  if (/^(first\.last|firstname\.lastname|name|user|test|info@example\.com)/i.test(trimmed)) {
    return false;
  }
  if (trimmed.endsWith("@example.com") || trimmed.endsWith("@domain.com") || trimmed.endsWith("@sample.com")) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FindRecipientsRequest;
    const { query, count = 10 } = body;

    if (!query?.trim()) {
      return Response.json({ error: "Search query is required" }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      return Response.json({ error: "OpenRouter API key not configured" }, { status: 500 });
    }

    const targetCount = Math.min(Math.max(Number(count) || 10, 1), 20);

    const systemPrompt = `You are a specialized business intelligence researcher. Your mission is to find real, publicly known contact email addresses (such as contact@, info@, sales@, press@, support@, or department/executive emails) from the internet based on the user's search query.
Return ONLY a valid JSON array of objects with this schema:
[
  {
    "company": "<Official Company or Organization Name>",
    "email": "<real deliverable email address>",
    "role": "<department or role e.g. general contact, press, customer support, sales>",
    "domain": "<company website domain e.g. microsoft.com>"
  }
]
Rules:
1. Find up to ${targetCount} distinct, real organizations.
2. Only include real, valid email addresses. Do NOT use placeholders like "first.last@company.com" or "name@example.com".
3. Return raw JSON array only. Do NOT wrap in markdown code fences (\`\`\`json).`;

    const userPrompt = `Search the internet and Google to find official contact email addresses for: "${query}".
Provide up to ${targetCount} verified company contact emails.`;

    const modelsToTry = [
      "google/gemini-2.5-flash",
      "google/gemini-3.5-flash-lite",
      "meta-llama/llama-3.3-70b-instruct:free",
    ];

    let rawContent = "";
    let lastError = null;

    // First attempt: try with live web search plugin
    for (const model of modelsToTry) {
      try {
        const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://emailsendermcp.app",
            "X-Title": "EmailSender MCP - Recipient Finder",
          },
          body: JSON.stringify({
            model,
            plugins: [{ id: "web" }],
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 1000,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          rawContent = data.choices?.[0]?.message?.content ?? "";
          if (rawContent) break;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn(`Model ${model} with web plugin failed (${res.status}):`, errData);
          lastError = errData?.error?.message || `Error ${res.status}`;
        }
      } catch (e: any) {
        lastError = e?.message;
      }
    }

    // Fallback: If web plugin failed, try models without plugin (leveraging model's deep corporate training data)
    if (!rawContent) {
      for (const model of modelsToTry) {
        try {
          const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://emailsendermcp.app",
              "X-Title": "EmailSender MCP - Recipient Finder",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.2,
              max_tokens: 1000,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            rawContent = data.choices?.[0]?.message?.content ?? "";
            if (rawContent) break;
          }
        } catch (e: any) {
          lastError = e?.message;
        }
      }
    }

    if (!rawContent) {
      return Response.json(
        { error: lastError || "Failed to search for recipient emails from the internet." },
        { status: 500 }
      );
    }

    // Clean markdown code blocks if returned
    const cleanedJson = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: RawContact[] = [];
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      // Regex recovery if JSON was slightly malformed
      const jsonMatch = cleanedJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return Response.json({ error: "Failed to parse contact list from AI search response." }, { status: 500 });
      }
    }

    if (!Array.isArray(parsed)) {
      return Response.json({ error: "Invalid response format from search model." }, { status: 500 });
    }

    // Validate, sanitize, and format discovered contacts
    const seenEmails = new Set<string>();
    const sanitizedContacts: { company: string; email: string; role?: string; formatted: string }[] = [];

    for (const item of parsed) {
      const email = item.email?.trim().toLowerCase();
      if (!email || !isValidEmail(email) || seenEmails.has(email)) continue;

      seenEmails.add(email);
      const company = (item.company || item.name || "").trim();
      const role = item.role?.trim();

      const formatted = company ? `${company} <${email}>` : email;

      sanitizedContacts.push({
        company: company || email.split("@")[0],
        email,
        role: role || "Contact",
        formatted,
      });

      if (sanitizedContacts.length >= targetCount) break;
    }

    if (sanitizedContacts.length === 0) {
      return Response.json(
        { error: `No valid public email addresses found for "${query}". Try refining your search query.` },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      query,
      count: sanitizedContacts.length,
      contacts: sanitizedContacts,
    });
  } catch (err: unknown) {
    console.error("find-recipients error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error searching for emails" },
      { status: 500 }
    );
  }
}
