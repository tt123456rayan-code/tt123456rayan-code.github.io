const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "AI backend is not configured." }, 503);
  }

  let body: { question?: string; language?: string; dialect?: string };
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const question = String(body.question || "").trim().slice(0, 1000);
  const language = body.language === "en" ? "English" : "Arabic";
  const dialect = String(body.dialect || "jordanian").slice(0, 40);

  if (!question) {
    return jsonResponse({ error: "Question is required." }, 400);
  }

  const systemPrompt = [
    "You are AI Himma National, the official informational assistant for Himma National Youth Initiative in Jordan.",
    "Answer only with public, helpful, non-administrative information about the initiative, Jordanian national culture, civic participation, committees, volunteering, and youth development.",
    "Do not invent names, numbers, partners, announcements, or administrative decisions.",
    "If you are unsure, say that the information is not currently available on the website.",
    `Answer in ${language}. If Arabic is requested, use the selected style when possible: ${dialect}.`,
  ].join(" ");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        max_output_tokens: 500,
      }),
    });

    if (!response.ok) {
      return jsonResponse({ error: "AI provider unavailable." }, 502);
    }

    const data = await response.json();
    const answer = data.output_text ||
      data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || [])
        .map((part: { text?: string }) => part.text || "")
        .join("")
        .trim();

    return jsonResponse({ answer: answer || "تعذر تجهيز إجابة حالياً." });
  } catch (_) {
    return jsonResponse({ error: "AI request failed." }, 500);
  }
});
