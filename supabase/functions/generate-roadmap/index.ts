// supabase/functions/generate-roadmap/index.ts
// Milestone AI: Internal AI Engine - Endpoint 2: Structured Roadmap Generator
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
    const payload = await req.json();
    const goal = payload.goal || payload.title || "";
    const targetMonths = payload.targetMonths || payload.duration_months || 3;
    const skillLevel = payload.skillLevel || payload.difficulty || "Intermediate";

    if (!goal) {
      return new Response(JSON.stringify({ error: "Missing 'goal' in request payload." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const systemInstruction = `You are an expert curriculum architect. Break down the user's goal into a structured timeline across the specified number of months. 

Rules:
1. Create sequential, logical milestones covering the full month duration (${targetMonths} months).
2. Provide 3-5 concrete, actionable tasks per milestone.
3. Include 2-3 curated search terms/resources per milestone with real search queries or course links.
4. Define clear overall success criteria under 'target_outcomes'.
5. Respond strictly in valid JSON matching the exact schema. No Markdown wrapper.

Exact Output Schema:
{
  "title": "Roadmap Title",
  "description": "A comprehensive ${targetMonths}-month path...",
  "target_outcomes": [
    "Outcome 1",
    "Outcome 2"
  ],
  "milestones": [
    {
      "id": "m1",
      "title": "Milestone Title",
      "month_range": "Month 1",
      "description": "Milestone description...",
      "tasks": [
        {
          "id": "t1",
          "title": "Task title",
          "description": "Task description"
        }
      ],
      "resources": [
        {
          "title": "Resource title",
          "type": "video",
          "search_query": "Specific search query or playlist"
        }
      ]
    }
  ]
}`;

    const userPrompt = `Goal: "${goal}"\nTarget Months: ${targetMonths}\nSkill Level: "${skillLevel}"`;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const body = {
          contents: [{ parts: [{ text: userPrompt }] }],
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
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

        // Normalize milestones to ensure both tasks and deliverables array exist for compatibility
        if (resultJson?.milestones && Array.isArray(resultJson.milestones)) {
          resultJson.milestones = resultJson.milestones.map((m: any, idx: number) => {
            const tasks = m.tasks || [];
            const deliverables = m.deliverables || tasks.map((t: any) => typeof t === "string" ? t : t.title);
            const normalizedTasks = tasks.length > 0 ? tasks : deliverables.map((d: any, dIdx: number) => ({
              id: `t${idx + 1}_${dIdx + 1}`,
              title: typeof d === "string" ? d : d.title,
              description: typeof d === "string" ? d : d.description || d.title,
            }));

            return {
              ...m,
              id: m.id || `m${idx + 1}`,
              month_range: m.month_range || `Month ${Math.floor(idx / Math.max(1, Math.floor(resultJson.milestones.length / targetMonths))) + 1}`,
              tasks: normalizedTasks,
              deliverables: deliverables,
              resources: (m.resources || []).map((r: any) => ({
                ...r,
                url: r.url || (r.search_query ? `https://www.youtube.com/results?search_query=${encodeURIComponent(r.search_query)}` : "https://developer.mozilla.org/"),
              })),
            };
          });
        }

        break; // Successfully got JSON
      } catch (err: any) {
        lastError = err;
        console.warn(`[generate-roadmap] ${model} attempt failed:`, err.message);
      }
    }

    if (!resultJson) {
      throw lastError || new Error("Failed to generate roadmap via Gemini.");
    }

    return new Response(JSON.stringify(resultJson), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[generate-roadmap] error:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
