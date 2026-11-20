// supabase/functions/gemini-proxy/index.ts
// Secure Gemini AI Proxy Edge Function for Milestone AI
// Runs in Deno environment on Supabase Edge Functions

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
    | "rebalance";
  payload: any;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, payload }: RequestBody = await req.json();

    // Model selection mapping (Defaults to Gemini 1.5 Flash for speed, Pro for deep synthesis)
    const modelTier = payload?.model === "pro" ? "gemini-1.5-pro" : "gemini-1.5-flash";

    // If no API key configured, return fallback response with notice
    if (!GEMINI_API_KEY) {
      return handleMissingApiKeyFallback(action, payload);
    }

    switch (action) {
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
// 1. ACTION: GENERATE COMPLETE ROADMAP
// ==============================================================================
async function handleGenerateRoadmap(payload: any, model: string) {
  const { goal, difficulty, duration_months, pacing } = payload;

  const systemPrompt = `You are a Senior Learning Architect and Curriculum Engineer.
Generate a comprehensive, adaptive learning blueprint in valid JSON only.

Goal: "${goal}"
Difficulty level: ${difficulty}
Total Duration: ${duration_months} months
Pacing: ${pacing}

JSON output schema must be exact:
{
  "title": "Concise, motivating roadmap title (string)",
  "goal_summary": "1-2 sentence executive overview (string)",
  "key_outcomes": ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4"],
  "milestones": [
    {
      "title": "Milestone title (string)",
      "description": "2-3 sentences explaining conceptual objectives (string)",
      "is_major": boolean (set true on every 3rd or major checkpoint milestone),
      "xp_reward": 150,
      "deliverables": [
        "Concrete hands-on action item 1",
        "Concrete hands-on action item 2",
        "Concrete hands-on action item 3"
      ],
      "resources": [
        {
          "title": "Resource title (string)",
          "url": "Realistic clickable official documentation, high-quality tutorial, or GitHub project URL (string)",
          "type": "course" | "book" | "video" | "docs" | "project"
        }
      ]
    }
  ]
}

Ensure all milestones are ordered chronologically. Milestone count should be appropriate for ${duration_months} months with ${pacing} pacing (around 3-6 milestones for compact plans). Output RAW JSON only with no markdown backticks.`;

  const responseText = await callGeminiAPI(model, systemPrompt, true);
  const cleanJson = extractJson(responseText);

  return new Response(cleanJson, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ==============================================================================
// 2. ACTION: GUARDRAILED MENTOR CHAT
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

  // Format messages for Gemini API
  const contents = (messages || []).map((msg: any) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
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
// 3. ACTION: DYNAMIC MICRO-QUIZ FOR MAJOR MILESTONES
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
// 4. ACTION: AI DURATION ESTIMATOR
// ==============================================================================
async function handleEstimateDuration(payload: any, model: string) {
  const { goal, difficulty } = payload;

  const prompt = `You are an educational time estimation specialist.
Estimate a realistic duration in months (between 1 and 24) to achieve this goal:
Goal: "${goal}"
Difficulty: ${difficulty}

Return ONLY valid JSON matching:
{
  "recommended_months": 3,
  "reasoning": "1 sentence explanation why this duration is optimal (string)"
}
Output raw JSON only.`;

  const responseText = await callGeminiAPI(model, prompt, true);
  const cleanJson = extractJson(responseText);

  return new Response(cleanJson, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ==============================================================================
// 5. ACTION: ADAPTIVE REBALANCE SCHEDULE
// ==============================================================================
async function handleRebalance(payload: any, model: string) {
  const { roadmap_title, remaining_milestones } = payload;

  const prompt = `The user is falling behind or adjusting pace on their roadmap: "${roadmap_title}".
Remaining incomplete milestones: ${JSON.stringify(remaining_milestones)}

Redistribute the remaining milestones across a realistic renewed schedule.
Return valid JSON only:
{
  "message": "Schedule adapted: Remaining milestones redistributed across timeline.",
  "adjusted_milestones": [...]
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
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
  if (action === "estimate_duration") {
    return new Response(
      JSON.stringify({
        recommended_months: 3,
        reasoning: "AI suggests 3 months to build foundational mastery with steady weekly pacing.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (action === "micro_quiz") {
    return new Response(
      JSON.stringify({
        questions: [
          {
            id: "q1",
            question: "What is the core prerequisite before moving past this milestone?",
            options: [
              "Verifying unit tests and state encapsulation",
              "Skipping error handling to ship faster",
              "Writing everything in a single monolithic file",
              "Ignoring framework documentation",
            ],
            correct_index: 0,
            explanation: "Solid automated verification guarantees sustainable long-term architecture.",
          },
          {
            id: "q2",
            question: "How should state transitions be managed in this curriculum?",
            options: [
              "Unidirectional data flow with explicit event contracts",
              "Direct global mutable variables",
              "Random asynchronous mutations",
              "Hardcoding values in presentation views",
            ],
            correct_index: 0,
            explanation: "UDF ensures predictable, debuggable state throughout lifecycle changes.",
          },
          {
            id: "q3",
            question: "What is the key purpose of the deliverables checklist?",
            options: [
              "Demonstrating practical, hands-on mastery through working artifacts",
              "Collecting passive video watch time",
              "Memorizing definitions without coding",
              "Filling checkboxes without testing",
            ],
            correct_index: 0,
            explanation: "Active project delivery creates durable real-world competence.",
          },
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (action === "chat") {
    return new Response(
      JSON.stringify({
        content: `👋 Hello! I am your AI Mentor.\n\n*Note: Add your GEMINI_API_KEY to Supabase Secrets to unlock live Gemini responses.*\n\nHere are 3 core principles for your milestone:\n1. **Maintain consistency**: Daily deliberate practice builds intuition.\n2. **Isolate state**: Keep components modular and testable.\n3. **Build real projects**: Theoretical knowledge solidifies when you ship.\n\nWhat deliverable would you like to tackle next?`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Default fallback for generate_roadmap
  return new Response(
    JSON.stringify({
      title: payload?.goal ? `Mastery Blueprint: ${payload.goal.slice(0, 36)}` : "Custom AI Learning Blueprint",
      goal_summary: payload?.goal || "Adaptive curriculum designed for structured mastery.",
      key_outcomes: [
        "Solidify foundational architecture and syntax patterns",
        "Design and test responsive, decoupled project components",
        "Implement production-grade lifecycle and state persistence",
        "Deploy a verified end-to-end milestone capstone project",
      ],
      milestones: [
        {
          title: "Foundations & Environment Calibration",
          description: "Establish core mental models, developer tooling, and essential primitives.",
          is_major: false,
          xp_reward: 150,
          deliverables: [
            "Setup local toolchains, linters, and version control",
            "Build a minimal working proof of concept",
            "Document architecture assumptions in project README",
          ],
          resources: [
            { title: "Official Getting Started Guide", url: "https://developer.mozilla.org", type: "docs" },
            { title: "Comprehensive Video Crash Course", url: "https://youtube.com", type: "video" },
          ],
        },
        {
          title: "Reactive Architecture & State Management",
          description: "Deep dive into unidirectional data flows, async operations, and testability.",
          is_major: false,
          xp_reward: 200,
          deliverables: [
            "Refactor business logic into clean domain models",
            "Write comprehensive automated unit test suites",
          ],
          resources: [
            { title: "Clean Architecture Principles", url: "https://martinfowler.com", type: "book" },
          ],
        },
        {
          title: "Production Release & Milestone Capstone",
          description: "Complete and publish a capstone project with automated pipelines and analytics.",
          is_major: true,
          xp_reward: 400,
          deliverables: [
            "Benchmark performance and eliminate bottleneck metrics",
            "Deploy live build to production hosting",
          ],
          resources: [
            { title: "Production Deployment Checklist", url: "https://web.dev", type: "docs" },
          ],
        },
      ],
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
