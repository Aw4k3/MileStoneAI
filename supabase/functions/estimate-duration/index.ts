// supabase/functions/estimate-duration/index.ts
// Milestone AI: Internal AI Engine - Endpoint 1: Duration Estimator
// Internal Model: gemini-2.5-flash (with robust fallback)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { goal } = await req.json();

    if (!goal) {
      return new Response(JSON.stringify({ error: "Missing 'goal' in request payload." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          recommended_months: 6,
          reasoning: "Achieving production-level proficiency typically requires 4-6 months of consistent deliberate practice.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview",
    ];
    let lastError = null;
    let resultJson = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const body = {
          contents: [{ parts: [{ text: `User Goal: "${goal}"` }] }],
          system_instruction: {
            parts: [
              {
                text: "Analyze the user's goal. Estimate a realistic timeline in months required to achieve it for a typical learner. Provide a concise 1-2 sentence technical reasoning. Respond strictly in valid raw JSON matching the required schema. Never wrap in Markdown.\n\nSchema:\n{\n  \"recommended_months\": 6,\n  \"reasoning\": \"string\"\n}",
              },
            ],
          },
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Model ${model} returned ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const clean = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        resultJson = JSON.parse(clean);
        break; // Successfully got JSON
      } catch (err: any) {
        lastError = err;
        console.warn(`[estimate-duration] ${model} attempt failed:`, err.message);
      }
    }

    if (!resultJson) {
      throw lastError || new Error("Failed to estimate duration via Gemini.");
    }

    return new Response(JSON.stringify(resultJson), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[estimate-duration] error:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
