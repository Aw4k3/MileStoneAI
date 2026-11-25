// supabase/functions/chat-mentor/index.ts
// Milestone AI: Internal AI Engine - Endpoint 3: Context-Aware Streaming AI Mentor
// Internal Model: gemini-2.0-flash (with robust fallback & SSE Streaming)

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
    const roadmapContext = payload.roadmapContext || {
      title: payload.roadmap_title || "General Blueprint",
      overallProgressPercent: payload.overallProgressPercent || 0,
      activeMilestone: payload.activeMilestone || payload.active_milestone || "Getting Started",
      completedTaskTitles: payload.completedTaskTitles || [],
      pendingTaskTitles: payload.pendingTaskTitles || [],
    };

    const chatHistory = payload.chatHistory || payload.messages || [];
    const message = payload.message || payload.text || "";

    const systemInstructionText = `You are an empathetic, highly technical AI Mentor for Milestone AI. 

CURRENT USER ROADMAP CONTEXT:
- Roadmap: ${roadmapContext.title || "Custom Curriculum"}
- Progress: ${roadmapContext.overallProgressPercent || 0}% complete
- Current Active Milestone: ${roadmapContext.activeMilestone || "Foundations"}
- Completed Tasks: ${(roadmapContext.completedTaskTitles || []).join(", ") || "None yet"}
- Pending Tasks: ${(roadmapContext.pendingTaskTitles || []).join(", ") || "Active milestone tasks"}

INSTRUCTIONS:
- Keep responses concise, direct, and practical.
- Tailor guidance directly to the user's active milestone and pending tasks.
- Use Markdown formatting for code snippets and technical terms.`;

    // Map conversation history to Gemini contents structure
    const contents: any[] = [];

    for (const msg of chatHistory) {
      const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
      const text = msg.text || msg.content || "";
      if (text.trim()) {
        contents.push({
          role,
          parts: [{ text }],
        });
      }
    }

    if (message.trim()) {
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });
    }

    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello! How can I proceed with my current milestone?" }],
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
    let streamResponse: Response | null = null;
    let selectedModel = "";

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
        const requestBody = {
          contents,
          system_instruction: {
            parts: [{ text: systemInstructionText }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (res.ok && res.body) {
          streamResponse = res;
          selectedModel = model;
          break;
        } else {
          const err = await res.text();
          console.warn(`[chat-mentor] ${model} returned ${res.status}:`, err);
        }
      } catch (err: any) {
        console.warn(`[chat-mentor] ${model} fetch failed:`, err.message);
      }
    }

    if (!streamResponse || !streamResponse.body) {
      // Fallback single message if streaming upstream fails
      const fallbackPayload = `data: {"chunk": "Welcome! I am your Milestone AI mentor. Keep making progress on your active milestone: **${roadmapContext.activeMilestone}**."}\n\ndata: [DONE]\n\n`;
      return new Response(fallbackPayload, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Stream SSE transformation: from Gemini's SSE format to client format
    const reader = streamResponse.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let buffer = "";

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            // Send final completion marker
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const chunkText =
                  parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (chunkText) {
                  const outPayload = `data: ${JSON.stringify({ chunk: chunkText })}\n\n`;
                  controller.enqueue(encoder.encode(outPayload));
                }
              } catch {
                // Skip unparseable chunks or heartbeat lines
              }
            }
          }
        } catch (err: any) {
          console.error("[chat-mentor] stream read error:", err);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[chat-mentor] top error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error in chat-mentor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
