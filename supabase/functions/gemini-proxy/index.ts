// supabase/functions/gemini-proxy/index.ts
// Secure Gemini AI Proxy Edge Function for Milestone AI
// Powered by Supabase secrets GEMINI_API_KEY and Gemini 3 Flash / 3.1 Pro

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  action:
    | "generate_roadmap"
    | "chat"
    | "micro_quiz"
    | "estimate_duration"
    | "rebalance"
    | "suggest_titles";
  payload: any;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, payload }: RequestBody = await req.json();

    // Use Gemini 3 Flash Preview as primary workhorse, 3.1 Pro for deep architecture
    const modelTier =
      payload?.model === "pro" || payload?.gemini_model === "pro"
        ? "gemini-3.1-pro-preview"
        : "gemini-3-flash-preview";

    // If no API key configured, return fallback response
    if (!GEMINI_API_KEY) {
      return handleMissingApiKeyFallback(action, payload);
    }

    switch (action) {
      case "suggest_titles":
        return await handleSuggestTitles(payload, modelTier);

      case "generate_roadmap":
        return await handleGenerateRoadmap(payload, modelTier);

      case "chat":
        return await handleChat(payload, modelTier);

      case "micro_quiz":
        return await handleMicroQuiz(payload, modelTier);

      case "estimate_duration":
        return await handleEstimateDuration(payload, modelTier);

      case "rebalance":
        return await handleRebalance(payload, modelTier);

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Edge Function Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ==============================================================================
// 1. ACTION: SUGGEST FORMAL COURSE TITLES
// ==============================================================================
async function handleSuggestTitles(payload: any, model: string) {
  const { goal } = payload;

  const prompt = `You are an expert curriculum designer.
The student wants to learn: "${goal}".
Generate 4 short, clear, professional course titles for this learning goal.
Guidelines:
- Simplify the titles. Avoid overly technical, complicated, or unnecessarily formal wording.
- Titles should be short, clear, professional, and easy for anyone to understand (3 to 6 words).
- Examples of good style: "Practical Web Development", "Financial Literacy Fundamentals", "Introduction to Machine Learning", "Everyday Data Analysis".

Return ONLY valid JSON matching:
{
  "titles": [
    "Title 1",
    "Title 2",
    "Title 3",
    "Title 4"
  ]
}
Output raw JSON only.`;

  const responseText = await callGeminiAPI(model, prompt, true);
  const cleanJson = extractJson(responseText);

  return new Response(cleanJson, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ==============================================================================
// 2. ACTION: GENERATE COMPLETE ROADMAP
// ==============================================================================
async function handleGenerateRoadmap(payload: any, model: string) {
  const { goal, difficulty, duration_months, pacing, target_milestones } = payload;
  const targetCount = target_milestones || Math.max(
    6,
    Math.min(16, Math.round((duration_months || 3) * (pacing === 'weekly' ? 3 : pacing === 'daily' ? 4 : 2)))
  );

  const systemPrompt = `You are an elite Senior Learning Architect and Staff Software Engineer.
Generate an in-depth, production-grade, highly actionable learning blueprint in VALID JSON ONLY.

Goal: "${goal}"
Difficulty level: ${difficulty}
Total Duration: ${duration_months} months
Pacing: ${pacing}
TARGET MILESTONE COUNT: Generate EXACTLY ${targetCount} comprehensive milestones.

STRICT CURRICULUM REQUIREMENTS:
1. Provide EXACTLY ${targetCount} sequential milestones progressing logically from foundational tooling/mental models to real-world deployment, testing, and production optimization.
2. Every milestone title MUST be deeply specific to "${goal}" (NEVER use generic titles like "Phase 1: Foundations").
3. For EVERY milestone, provide:
   - "title": Highly descriptive, concrete topic title
   - "description": 2 to 3 substantive sentences detailing core architectural concepts, execution patterns, and common failure modes
   - "is_major": boolean (set true on major milestones, e.g. every 3rd or 4th milestone and the final capstone)
   - "xp_reward": integer between 150 and 400
   - "deliverables": Array of 4 to 5 rigorous, tangible checklist tasks (e.g. "Configure Room DAOs with Flow", "Verify Stripe webhook signature parsing")
   - "resources": Array of 3 to 4 authoritative learning resources matching types "course", "video", "book", "docs", or "project".
     * STRICT RESOURCE CRITERIA: NEVER provide generic search URLs like "youtube.com/results?search_query=...".
     * Provide actual free courses (e.g. Harvard CS50, Full Stack Open, YC Startup School, Kaggle Learn, freeCodeCamp), dedicated YouTube tutorial playlists/channels (e.g. Net Ninja, Traversy Media, Philipp Lackner), free online books/PDFs (e.g. Eloquent JavaScript, Automate the Boring Stuff, Pro Git, The Mom Test), and official documentation.

JSON output schema must be exact:
{
  "title": "Formal, compelling curriculum title",
  "goal_summary": "1-2 sentence executive overview",
  "key_outcomes": ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4"],
  "milestones": [
    {
      "title": "Specific Milestone 1 Title",
      "description": "Comprehensive explanation of what to learn, build, and avoid.",
      "is_major": false,
      "xp_reward": 150,
      "deliverables": [
        "Hands-on deliverable 1",
        "Hands-on deliverable 2",
        "Hands-on deliverable 3",
        "Hands-on deliverable 4"
      ],
      "resources": [
        {"title": "Resource Name", "url": "https://...", "type": "course"},
        {"title": "YouTube Playlist", "url": "https://www.youtube.com/playlist?list=...", "type": "video"},
        {"title": "Official Documentation", "url": "https://...", "type": "docs"}
      ]
    }
  ]
}
Output RAW JSON only with no markdown backticks.`;

  const responseText = await callGeminiAPI(model, systemPrompt, true);
  const cleanJson = extractJson(responseText);

  return new Response(cleanJson, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ==============================================================================
// 3. ACTION: GUARDRAILED MENTOR CHAT
// ==============================================================================
async function handleChat(payload: any, model: string) {
  const { messages, roadmap_title, goal_summary, active_milestone, persona } = payload;

  const personaInstructions: Record<string, string> = {
    tutor: "Act as a Socratic Tutor: ask probing questions, guide step-by-step, never just hand over answers without building mental models.",
    coach: "Act as a Strict Accountability Coach: focus on execution, zero excuses, practical discipline, timeboxing, and rigorous coding habits.",
    peer: "Act as an Encouraging Peer: empathetic, relatable, share anecdotal analogies, keep morale high, celebrate small wins.",
  };

  const systemInstruction = `You are the dedicated AI Mentor for the user's learning blueprint: "${roadmap_title}".
Curriculum Context: ${goal_summary}.
Current Active Milestone: ${active_milestone || "General Curriculum"}.

Persona Style: ${personaInstructions[persona] || personaInstructions.tutor}

STRICT GUARDRAILS & DOMAIN LOCK:
1. You are strictly locked to the domain of "${roadmap_title}".
2. If the user asks about unrelated topics (such as general politics, cryptocurrency trading, unrelated cooking, pop culture, sports scores), politely REFUSE and redirect them back to their roadmap deliverables.
3. Keep answers concise, actionable, and formatted with clean Markdown, bullet points, and code snippets where appropriate.`;

  const contents = (messages || []).map((msg: any) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const cleanModel = model.replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API HTTP ${res.status}: ${errorText}`);
  }

  const result = await res.json();
  const reply = result?.candidates?.[0]?.content?.parts?.[0]?.text || "I am ready to assist with your curriculum.";

  return new Response(JSON.stringify({ content: reply }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ==============================================================================
// 4. ACTION: DYNAMIC MICRO-QUIZ FOR MAJOR MILESTONES
// ==============================================================================
async function handleMicroQuiz(payload: any, model: string) {
  const { milestone_title, milestone_description } = payload;

  const prompt = `Generate a 3-question multiple choice verification quiz for this learning milestone:
Milestone: "${milestone_title}"
Context: "${milestone_description}"

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "Clear conceptual question testing genuine comprehension (string)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief explanation of why this option is correct (string)"
    }
  ]
}
Output raw JSON only.`;

  const responseText = await callGeminiAPI(model, prompt, true);
  const cleanJson = extractJson(responseText);

  return new Response(cleanJson, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ==============================================================================
// 5. ACTION: AI DURATION & FREQUENCY ESTIMATOR
// ==============================================================================
async function handleEstimateDuration(payload: any, model: string) {
  const { goal, difficulty } = payload;

  const prompt = `You are an educational time estimation specialist.
Estimate a realistic duration in months (between 1 and 24) and recommended pacing frequency for this goal:
Goal: "${goal}"
Difficulty: ${difficulty}

Return ONLY valid JSON matching:
{
  "recommended_months": 3,
  "recommended_pacing": "weekly",
  "recommended_milestones": 8,
  "reasoning": "1-2 sentence explanation why this duration and frequency is optimal (string)"
}
Output raw JSON only.`;

  const responseText = await callGeminiAPI(model, prompt, true);
  const cleanJson = extractJson(responseText);

  return new Response(cleanJson, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ==============================================================================
// 6. ACTION: ADAPTIVE REBALANCE SCHEDULE
// ==============================================================================
async function handleRebalance(payload: any, model: string) {
  const { roadmap_title, remaining_milestones } = payload;

  const prompt = `The user is falling behind or adjusting pace on their roadmap: "${roadmap_title}".
Remaining incomplete milestones: ${JSON.stringify(remaining_milestones)}
Redistribute the dates and deliverables evenly to relieve overload without losing learning rigor.

Return JSON:
{
  "message": "Encouraging explanation of the rebalanced schedule",
  "adjusted_milestones": [
    ...remaining milestones with updated pacing
  ]
}`;

  const responseText = await callGeminiAPI(model, prompt, true);
  const cleanJson = extractJson(responseText);

  return new Response(cleanJson, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ==============================================================================
// HELPER: CALL GEMINI API
// ==============================================================================
async function callGeminiAPI(model: string, prompt: string, expectJson: boolean = false) {
  const cleanModel = model.replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${GEMINI_API_KEY}`;

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: expectJson ? 0.3 : 0.7,
      maxOutputTokens: 8192,
    },
  };

  if (expectJson) {
    body.generationConfig.responseMimeType = "application/json";
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API Error (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

// Extract JSON safely from string
function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```json")) {
    return trimmed.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  }
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return trimmed;
}

// Fallback generator when GEMINI_API_KEY is not yet provided in Edge Function secrets
function handleMissingApiKeyFallback(action: string, payload: any) {
  if (action === "suggest_titles") {
    const rawGoal = (payload.goal || "Professional Skills").trim();
    const cleanSubject = rawGoal
      .replace(/^(learn|master|build|study|how to|i want to learn|i want to build)\s+/i, '')
      .replace(/[.!?,]+$/, '')
      .trim();
    const subject = cleanSubject ? cleanSubject.charAt(0).toUpperCase() + cleanSubject.slice(1) : 'Practical Skills';
    return new Response(
      JSON.stringify({
        titles: [
          `Complete Guide to ${subject}`,
          `${subject} Fundamentals`,
          `Modern ${subject} in Practice`,
          `Mastering ${subject}`,
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (action === "estimate_duration") {
    return new Response(
      JSON.stringify({
        recommended_months: 3,
        recommended_pacing: "weekly",
        recommended_milestones: 8,
        reasoning: "AI suggests 3 months with weekly pacing to build foundational mastery with steady progress.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Missing GEMINI_API_KEY in Supabase secrets" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
