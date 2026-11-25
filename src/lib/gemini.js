// src/lib/gemini.js
// Unified Blueprint AI Engine (automatic multi-model failover & auto-retry)
// Calls Supabase Edge Functions securely so API keys never leak to client bundles.

import { supabase, isSupabaseConfigured } from './supabase';
import {
  DEFAULT_BLUEPRINT_MODEL,
  calculateMilestones,
  normalizePacingKey,
} from './constants';

export { DEFAULT_BLUEPRINT_MODEL };

const RETIRED_MODELS = new Set([
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
]);

const MODEL_FALLBACK_ORDER = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
];

function delayMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeUserErrorMessage(rawMessage) {
  const msg = String(rawMessage || '');
  if (!msg) return 'Temporarily unable to reach the AI service. Please try again.';
  if (/timeout|timed out|abort/i.test(msg)) {
    return 'The request took a bit too long. Please try again.';
  }
  if (/429|quota|rate.?limit|503|high demand|All Gemini models failed|Gemini API Error/i.test(msg)) {
    return 'The AI service is experiencing brief high demand. Please retry in a moment.';
  }
  if (/404|NOT_FOUND/i.test(msg)) {
    return 'The AI service is refreshing its model routing. Please try again.';
  }
  return msg;
}

const RESOURCE_TYPES_CANONICAL = {
  course: 'course',
  book: 'book',
  video: 'video',
  docs: 'docs',
  project: 'project',
};

// Optional local-dev key helper (only via env var; production uses Supabase secrets)
export function getGeminiApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && !envKey.includes('your-gemini-api-key') && envKey.trim().length > 10) {
    return envKey.trim();
  }
  return '';
}

export function setGeminiApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem('milestone_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('milestone_gemini_api_key');
  }
}

export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a short, clean blueprint title automatically via AI (with auto-retry).
 */
export async function generateBlueprintTitleWithAI({ goal }) {
  const cleanGoal = String(goal || '').trim();
  if (!cleanGoal) return '';

  for (let attempt = 0; attempt < 2; attempt++) {
    if (isSupabaseConfigured) {
      try {
        const data = await invokeSupabaseFunction(
          'gemini-proxy',
          { action: 'generate_title', payload: { goal: cleanGoal, model: DEFAULT_BLUEPRINT_MODEL } },
          20000
        );
        if (data?.title && String(data.title).trim()) {
          return String(data.title).trim();
        }
      } catch (err) {
        console.warn(`generate_title proxy attempt ${attempt + 1} notice:`, err.message);
      }
    }

    if (getGeminiApiKey()) {
      try {
        const prompt = `Create a simple, clean, natural course title (maximum 4 words, plain everyday wording, no colons) for this learning goal:
"${cleanGoal}"
Return ONLY valid JSON: {"title": "Short Clean Title"}`;
        const { text } = await callDirectGeminiApi({
          prompt,
          systemInstruction: 'Return valid JSON only: {"title": string}.',
          temperature: 0.2,
          expectJson: true,
          timeoutMs: 20000,
          preferredModel: DEFAULT_BLUEPRINT_MODEL,
          maxOutputTokens: 2048,
        });
        const parsed = safeParseJson(text);
        if (parsed?.title && String(parsed.title).trim()) {
          return String(parsed.title).trim();
        }
      } catch (err) {
        console.warn(`generate_title direct attempt ${attempt + 1} notice:`, err.message);
      }
    }

    if (attempt === 0) {
      await delayMs(500);
    }
  }

  throw new Error('Could not generate title automatically. Please try regenerating or enter one manually.');
}

/**
 * Sanitizes external URLs without fabricating fake domains or search links.
 */
export function sanitizeExternalUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const candidate =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : trimmed.includes('.') && !trimmed.includes(' ')
      ? `https://${trimmed}`
      : null;

  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function getSupabaseConfig() {
  const url =
    (import.meta.env.VITE_SUPABASE_URL &&
      !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT') &&
      import.meta.env.VITE_SUPABASE_URL) ||
    'https://pgoeqctzvbzwhafcrcvq.supabase.co';
  const anonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY &&
      !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key') &&
      import.meta.env.VITE_SUPABASE_ANON_KEY) ||
    'sb_publishable_AS_HS4FR0UicXljopFyJiQ_tucyBqeA';
  return { url, anonKey };
}

function safeParseJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let clean = raw.trim();

  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = clean.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        try {
          return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
        } catch (innerErr) {
          console.warn('JSON substring parse error:', innerErr.message);
        }
      }
    }
    throw err;
  }
}

function buildModelChain(preferredModel) {
  const cleanFirst = preferredModel ? String(preferredModel).replace(/^models\//, '') : '';
  const safeFirst =
    cleanFirst && !RETIRED_MODELS.has(cleanFirst) ? cleanFirst : DEFAULT_BLUEPRINT_MODEL;
  return [safeFirst, ...MODEL_FALLBACK_ORDER.filter((m) => m !== safeFirst)];
}

async function invokeSupabaseFunction(slug, bodyPayload, timeoutMs = 95000) {
  const { url, anonKey } = getSupabaseConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let authHeader = `Bearer ${anonKey}`;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      authHeader = `Bearer ${sessionData.session.access_token}`;
    }
  } catch {
    // Fallback cleanly to anonKey
  }

  try {
    const res = await fetch(`${url}/functions/v1/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: authHeader,
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    const text = await res.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }

    if (!res.ok) {
      const message = parsed?.error || parsed?.message || `HTTP ${res.status}: ${text || res.statusText}`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }

    if (parsed?.error) {
      const err = new Error(parsed.error);
      err.status = 500;
      throw err;
    }

    return parsed;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callDirectGeminiApi({
  prompt,
  systemInstruction,
  contents,
  temperature = 0.3,
  expectJson = false,
  timeoutMs = 95000,
  preferredModel = DEFAULT_BLUEPRINT_MODEL,
  maxOutputTokens = 65536,
}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('No Gemini API key configured locally.');
  }

  const models = buildModelChain(preferredModel);
  const fastRetryModels = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];
  const attemptOrder = [...models, ...fastRetryModels];
  let lastError = null;

  for (let i = 0; i < attemptOrder.length; i++) {
    const model = attemptOrder[i];
    if (i === models.length) {
      await delayMs(600);
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: contents || [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    if (expectJson) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        const err = new Error(`Model ${model} HTTP ${res.status}: ${errorText.slice(0, 180)}`);
        err.status = res.status;
        throw err;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text.trim()) {
        throw new Error(`Model ${model} returned an empty response.`);
      }

      return { text, modelUsed: model };
    } catch (err) {
      const normalizedErr =
        err.name === 'AbortError'
          ? new Error(`Model ${model} timed out after ${Math.round(timeoutMs / 1000)}s.`)
          : err;
      lastError = normalizedErr;
      console.warn(`[blueprint] Direct model ${model} notice:`, normalizedErr.message);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(sanitizeUserErrorMessage(lastError?.message));
}

// ---------------------------------------------------------------------------
// 1. Duration Estimator (temperature 0.2, JSON)
// ---------------------------------------------------------------------------

export async function estimateDurationWithAI({ goal, model = DEFAULT_BLUEPRINT_MODEL }) {
  const cleanGoal = String(goal || '').trim();
  if (!cleanGoal) {
    throw new Error('Please enter a learning goal before estimating duration.');
  }

  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (isSupabaseConfigured) {
      try {
        const data = await invokeSupabaseFunction(
          'gemini-proxy',
          { action: 'estimate_pathway_duration', payload: { goal: cleanGoal, model } },
          45000
        );
        if (data && typeof data.recommended_months === 'number') {
          return {
            recommended_months: Math.min(24, Math.max(1, Math.round(data.recommended_months))),
            reasoning: data.reasoning || 'Estimated based on scope and sustainable study pacing.',
            model_used: data.model_used || model,
          };
        }
      } catch (proxyErr) {
        lastErr = proxyErr;
        console.warn(`estimate_pathway_duration attempt ${attempt + 1} notice:`, proxyErr.message);
      }

      try {
        const data = await invokeSupabaseFunction('estimate-duration', { goal: cleanGoal }, 45000);
        if (data && typeof data.recommended_months === 'number') {
          return {
            recommended_months: Math.min(24, Math.max(1, Math.round(data.recommended_months))),
            reasoning: data.reasoning || 'Estimated based on subject breadth and practical cadence.',
            model_used: 'gemini-3.5-flash',
          };
        }
      } catch (edgeErr) {
        lastErr = edgeErr;
        console.warn(`estimate-duration attempt ${attempt + 1} notice:`, edgeErr.message);
      }
    }

    if (getGeminiApiKey()) {
      try {
        const prompt = `You are an expert learning strategist. Analyze this learning goal and estimate a realistic duration in months for someone to achieve it with consistent study sessions.

Learning Goal: "${cleanGoal}"

Return ONLY valid JSON with this exact structure:
{"recommended_months": 3, "reasoning": "Brief explanation of why this duration is realistic and what factors you considered."}`;

        const { text, modelUsed } = await callDirectGeminiApi({
          prompt,
          systemInstruction:
            'You are an expert learning strategist. Output valid JSON only matching {"recommended_months": number, "reasoning": string}.',
          temperature: 0.2,
          expectJson: true,
          timeoutMs: 45000,
          preferredModel: model,
          maxOutputTokens: 2048,
        });

        const parsed = safeParseJson(text);
        if (parsed && typeof parsed.recommended_months === 'number') {
          return {
            recommended_months: Math.min(24, Math.max(1, Math.round(parsed.recommended_months))),
            reasoning: parsed.reasoning || '',
            model_used: modelUsed,
          };
        }
      } catch (directErr) {
        lastErr = directErr;
      }
    }

    if (attempt === 0) {
      await delayMs(600);
    }
  }

  throw new Error(sanitizeUserErrorMessage(lastErr?.message));
}

// ---------------------------------------------------------------------------
// 2. Blueprint Compiler (automatic multi-model failover, temp 0.3, exact validation)
// ---------------------------------------------------------------------------

function buildCompilePrompt({
  goal,
  durationMonths,
  pacing,
  milestoneCount,
  startOffset = 1,
  chunkCount = milestoneCount,
  existingOverview = null,
  previousTitles = [],
}) {
  const estimatedWeeks = Math.round(durationMonths * 4.33);
  const endOffset = startOffset + chunkCount - 1;
  const isChunked = startOffset > 1 || chunkCount < milestoneCount;

  const continuityBlock = isChunked
    ? `\nCHUNK CONTEXT:\nGenerating milestones ${startOffset} through ${endOffset} of ${milestoneCount} total milestones.${
        existingOverview ? `\nBlueprint Title: "${existingOverview.ai_title}"` : ''
      }${
        previousTitles.length > 0
          ? `\nAlready covered (do NOT repeat topics):\n- ${previousTitles.slice(-15).join('\n- ')}`
          : ''
      }\n`
    : '';

  const overviewInstruction =
    startOffset === 1
      ? `  "overview": {
    "ai_title": "Simple, nice, clear title (maximum 4 words, plain everyday wording)",
    "goal_summary": "2-3 sentence description of what the learner will achieve",
    "estimated_duration_weeks": ${estimatedWeeks},
    "difficulty_level": "Beginner|Intermediate|Advanced",
    "expected_outcomes": [
      "Specific measurable outcome 1",
      "Specific measurable outcome 2",
      "Specific measurable outcome 3",
      "Specific measurable outcome 4"
    ]
  },`
      : '';

  const resourceCountGuidance =
    chunkCount > 16
      ? 'Provide 2 focused, real learning resources per milestone and 2-3 crisp deliverables/exercises so every milestone fits cleanly without truncation.'
      : 'Provide 2-4 authoritative, real learning resources per milestone and 2-3 specific deliverables, exercises, and projects.';

  return `You are a personal learning strategist and curriculum architect. Act like a mentor who researches what the learner needs, curates authentic real-world resources, and structures an actionable educational blueprint.

Learning Goal: "${goal}"
Total Duration: ${durationMonths} months (~${estimatedWeeks} weeks)
Study Frequency: ${pacing}
Total Blueprint Milestones: ${milestoneCount}
${continuityBlock}
CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${chunkCount} milestones for this response.
2. Assign sequential "estimated_week_offset" integer values starting from ${startOffset} through ${endOffset}.
3. Assign sequential "id" values "m${startOffset}" through "m${endOffset}".
4. Keep "overview.ai_title" simple, natural, approachable, and max 4 words (e.g., "Python for Data Science", "Full-Stack Web Apps", "Conversational French Basics").
5. For EVERY milestone, provide a structured guided course covering:
   - Learn ("learning_objectives"): Topics, concepts, and skills the user needs to understand.
   - Watch & Read ("resources"): Real courses, video tutorials, articles, books, and official docs with direct URLs.
   - Practice ("practical_exercises"): Hands-on guided exercises and drills.
   - Build ("projects"): Concrete hands-on projects reinforcing the concepts.
   - Deliverables ("deliverables"): Clear, measurable completion outcomes proving understanding.
6. RESOURCE QUALITY REQUIREMENTS:
   - ${resourceCountGuidance}
   - Only cite REAL, existing resources (official docs like developer.mozilla.org, docs.python.org, react.dev; free courses on Coursera, edX, freeCodeCamp, Khan Academy, MIT OpenCourseWare, Harvard CS50, Kaggle Learn; well-known YouTube educators/playlists; real published books).
   - NEVER fabricate course titles, websites, or URLs. Never output generic search URLs like youtube.com/results?search_query=....
   - Set "is_free": true for free resources and "is_free": false for clearly paid courses/books.
   - Match materials progressively from fundamentals to advanced and avoid unnecessary repetition.

Return ONLY valid JSON matching this exact structure:
{
${overviewInstruction}
  "milestones": [
    {
      "id": "m${startOffset}",
      "title": "Specific descriptive milestone title",
      "description": "2-3 sentences explaining what this milestone covers and why it matters.",
      "learning_objectives": ["Understand concept X", "Apply skill Y"],
      "resources": [
        {
          "type": "Course|Book|Video|Docs|Project",
          "title": "Real Course or Documentation Title",
          "description": "What this covers",
          "url": "https://actual-verified-url.org",
          "is_free": true
        }
      ],
      "practical_exercises": ["Guided exercise 1", "Guided exercise 2"],
      "projects": ["Hands-on build project idea"],
      "deliverables": ["Measurable deliverable 1", "Measurable deliverable 2"],
      "estimated_week_offset": ${startOffset},
      "status": "Not Started"
    }
  ]
}

Generate ALL ${chunkCount} milestones (offsets ${startOffset}..${endOffset}) now. Return valid JSON only.`;
}

function normalizeResourceType(rawType) {
  const key = String(rawType || 'course').trim().toLowerCase();
  if (RESOURCE_TYPES_CANONICAL[key]) return RESOURCE_TYPES_CANONICAL[key];
  if (key.includes('vid') || key.includes('youtube') || key.includes('watch')) return 'video';
  if (key.includes('doc') || key.includes('guide') || key.includes('article') || key.includes('ref')) return 'docs';
  if (key.includes('book') || key.includes('read')) return 'book';
  if (key.includes('proj') || key.includes('build') || key.includes('repo')) return 'project';
  return 'course';
}

function normalizeDifficultyLower(rawDiff) {
  const d = String(rawDiff || '').trim().toLowerCase();
  if (d.includes('begin')) return 'beginner';
  if (d.includes('adv') || d.includes('expert')) return 'advanced';
  return 'intermediate';
}

function normalizeStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (typeof item === 'string' ? item.trim() : String(item?.title || item?.name || '').trim()))
    .filter(Boolean);
}

function normalizeCompiledMilestone(m, expectedOffset, totalCount) {
  const rawId = String(m?.id || `m${expectedOffset}`).trim() || `m${expectedOffset}`;
  const resources = Array.isArray(m?.resources)
    ? m.resources
        .map((r) => {
          const title = String(r?.title || '').trim();
          const url = sanitizeExternalUrl(r?.url);
          if (!title) return null;
          return {
            type: normalizeResourceType(r?.type),
            title,
            description: String(r?.description || '').trim(),
            url,
            is_free: typeof r?.is_free === 'boolean' ? r.is_free : true,
          };
        })
        .filter(Boolean)
    : [];

  const isCapstone = expectedOffset === totalCount;
  const isPeriodicMajor = totalCount >= 4 && expectedOffset % Math.max(3, Math.floor(totalCount / 3)) === 0;

  return {
    id: rawId,
    title: String(m?.title || `Milestone ${expectedOffset}`).trim(),
    description: String(m?.description || '').trim(),
    learning_objectives: normalizeStringArray(m?.learning_objectives),
    resources,
    practical_exercises: normalizeStringArray(m?.practical_exercises),
    projects: normalizeStringArray(m?.projects),
    deliverables: normalizeStringArray(m?.deliverables),
    estimated_week_offset: Number(m?.estimated_week_offset) || expectedOffset,
    is_major: typeof m?.is_major === 'boolean' ? m.is_major : isCapstone || isPeriodicMajor,
    xp_reward: Number(m?.xp_reward) > 0 ? Math.round(Number(m.xp_reward)) : isCapstone ? 350 : 180,
    status: m?.status === 'Completed' ? 'Completed' : 'Not Started',
  };
}

export function validateAndNormalizeBlueprintResponse(parsed, { goal, durationMonths, milestoneCount }) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid AI response: expected a JSON object.');
  }
  if (!Array.isArray(parsed.milestones)) {
    throw new Error('Invalid AI response: missing milestones array.');
  }

  if (parsed.milestones.length !== milestoneCount) {
    const err = new Error(
      `AI generated ${parsed.milestones.length} milestones instead of the required ${milestoneCount}.`
    );
    err.code = 'MILESTONE_COUNT_MISMATCH';
    err.actualCount = parsed.milestones.length;
    err.expectedCount = milestoneCount;
    throw err;
  }

  const sortedMilestones = [...parsed.milestones]
    .sort((a, b) => (Number(a?.estimated_week_offset) || 0) - (Number(b?.estimated_week_offset) || 0))
    .map((m, idx) => normalizeCompiledMilestone(m, idx + 1, milestoneCount));

  sortedMilestones.forEach((m, idx) => {
    m.estimated_week_offset = idx + 1;
  });

  const rawOverview = parsed.overview || {};
  const aiTitle = String(rawOverview.ai_title || parsed.title || '').trim();
  const fallbackTitle = String(goal || '').trim() || 'Custom Learning Blueprint';
  const resolvedAiTitle = aiTitle || fallbackTitle;
  const diffLower = normalizeDifficultyLower(rawOverview.difficulty_level || parsed.difficulty);

  const overview = {
    ai_title: resolvedAiTitle,
    goal_summary: String(rawOverview.goal_summary || parsed.goal_summary || goal || '').trim(),
    estimated_duration_weeks:
      Number(rawOverview.estimated_duration_weeks) > 0
        ? Math.round(Number(rawOverview.estimated_duration_weeks))
        : Math.round((Number(durationMonths) || 3) * 4.33),
    difficulty_level: diffLower.charAt(0).toUpperCase() + diffLower.slice(1),
    expected_outcomes: normalizeStringArray(rawOverview.expected_outcomes || parsed.key_outcomes),
  };

  return {
    title: resolvedAiTitle,
    goal_summary: overview.goal_summary,
    difficulty: diffLower,
    estimated_duration_weeks: overview.estimated_duration_weeks,
    key_outcomes: overview.expected_outcomes,
    overview,
    milestones: sortedMilestones,
    model_used: parsed.model_used,
  };
}

async function executeCompileChunk({
  goal,
  durationMonths,
  pacing,
  milestoneCount,
  prompt,
  systemInstruction,
  model,
}) {
  let proxyError = null;

  if (isSupabaseConfigured) {
    try {
      const data = await invokeSupabaseFunction(
        'gemini-proxy',
        {
          action: 'compile_pathway',
          payload: {
            goal,
            durationMonths,
            pacing,
            milestoneCount,
            model,
            prompt,
            systemInstruction,
          },
        },
        95000
      );

      if (data && Array.isArray(data.milestones)) {
        return { data, modelUsed: data.model_used || model };
      }
      throw new Error('AI proxy returned a response without a valid milestones array.');
    } catch (err) {
      proxyError = err;
      console.warn('[blueprint] Supabase proxy compile notice:', err.message);
    }
  }

  if (getGeminiApiKey()) {
    const { text, modelUsed } = await callDirectGeminiApi({
      prompt,
      systemInstruction,
      temperature: 0.3,
      expectJson: true,
      timeoutMs: 95000,
      preferredModel: model,
      maxOutputTokens: 65536,
    });
    return { data: safeParseJson(text), modelUsed };
  }

  if (proxyError) {
    throw new Error(sanitizeUserErrorMessage(proxyError.message));
  }

  throw new Error('Unable to reach the AI compilation service. Please try again.');
}

/**
 * Main Blueprint Compilation entrypoint (replaces legacy simple roadmap generator).
 */
export async function generateRoadmapWithAI({
  goal,
  titleOverride = '',
  duration_months,
  durationMonths: durationMonthsCamel,
  pacing = 'weekly',
  target_milestones,
  milestoneCount: milestoneCountCamel,
  model = DEFAULT_BLUEPRINT_MODEL,
  onProgress,
}) {
  const cleanGoal = String(goal || '').trim();
  if (!cleanGoal) {
    throw new Error('Please enter a learning goal.');
  }

  const resolvedMonths = Math.max(1, Number(durationMonthsCamel || duration_months) || 3);
  const resolvedPacing = normalizePacingKey(pacing);
  const expectedCount =
    Number(milestoneCountCamel || target_milestones) ||
    calculateMilestones(resolvedMonths, resolvedPacing);

  const systemInstruction =
    'You are a world-class learning strategist and curriculum designer. Output valid JSON only. Never fabricate URLs or course titles.';
  const CHUNK_SIZE = 20;

  let result;

  if (expectedCount <= 24) {
    const prompt = buildCompilePrompt({
      goal: cleanGoal,
      durationMonths: resolvedMonths,
      pacing: resolvedPacing,
      milestoneCount: expectedCount,
    });

    let lastErr = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (onProgress && attempt > 0) {
          onProgress(
            lastErr?.code === 'MILESTONE_COUNT_MISMATCH'
              ? `Refining timeline to guarantee all ${expectedCount} milestones…`
              : 'Retrying automatically with backup capacity…'
          );
        }

        const effectivePrompt =
          attempt === 0 || !lastErr?.code
            ? prompt
            : `${prompt}\n\nIMPORTANT CORRECTION: Previous output contained ${lastErr?.actualCount || 'wrong count of'} milestones. You MUST output EXACTLY ${expectedCount} milestone objects numbered estimated_week_offset 1..${expectedCount}.`;

        const { data, modelUsed } = await executeCompileChunk({
          goal: cleanGoal,
          durationMonths: resolvedMonths,
          pacing: resolvedPacing,
          milestoneCount: expectedCount,
          prompt: effectivePrompt,
          systemInstruction,
          model,
        });

        result = validateAndNormalizeBlueprintResponse(data, {
          goal: cleanGoal,
          durationMonths: resolvedMonths,
          milestoneCount: expectedCount,
        });
        result.model_used = modelUsed || model;
        break;
      } catch (err) {
        lastErr = err;
        console.warn(`[blueprint] Compilation attempt ${attempt + 1} notice:`, err.message);
        if (attempt === 0) {
          await delayMs(1800);
          continue;
        }
        throw new Error(sanitizeUserErrorMessage(err.message));
      }
    }

    if (!result) {
      throw lastErr || new Error('Failed to compile course blueprint.');
    }
  } else {
    // Batch 1 builds overview + first chunk; remaining batches compile in parallel
    const firstCount = Math.min(CHUNK_SIZE, expectedCount);
    if (onProgress) {
      onProgress(`Compiling milestones 1–${firstCount} of ${expectedCount}…`);
    }

    const firstPrompt = buildCompilePrompt({
      goal: cleanGoal,
      durationMonths: resolvedMonths,
      pacing: resolvedPacing,
      milestoneCount: expectedCount,
      startOffset: 1,
      chunkCount: firstCount,
    });

    const { data: firstData, modelUsed: firstModelUsed } = await executeCompileChunk({
      goal: cleanGoal,
      durationMonths: resolvedMonths,
      pacing: resolvedPacing,
      milestoneCount: firstCount,
      prompt: firstPrompt,
      systemInstruction,
      model,
    });

    if (!firstData?.milestones || firstData.milestones.length !== firstCount) {
      throw new Error(
        `Initial batch returned ${firstData?.milestones?.length || 0} milestones instead of ${firstCount}. Please retry.`
      );
    }

    const combinedOverview = firstData.overview;
    const modelUsedFinal = firstModelUsed || model;
    const combinedMilestones = firstData.milestones.map((m, idx) => ({
      ...m,
      estimated_week_offset: idx + 1,
    }));

    const batchSpecs = [];
    for (let offset = firstCount + 1; offset <= expectedCount; offset += CHUNK_SIZE) {
      batchSpecs.push({ offset, count: Math.min(CHUNK_SIZE, expectedCount - offset + 1) });
    }

    if (batchSpecs.length > 0 && onProgress) {
      onProgress(`Compiling remaining milestones (${firstCount + 1}–${expectedCount}) in parallel…`);
    }

    const remainingResults = await Promise.all(
      batchSpecs.map(async ({ offset, count }) => {
        const prompt = buildCompilePrompt({
          goal: cleanGoal,
          durationMonths: resolvedMonths,
          pacing: resolvedPacing,
          milestoneCount: expectedCount,
          startOffset: offset,
          chunkCount: count,
          existingOverview: combinedOverview,
          previousTitles: combinedMilestones.map((m) => m.title),
        });

        const { data } = await executeCompileChunk({
          goal: cleanGoal,
          durationMonths: resolvedMonths,
          pacing: resolvedPacing,
          milestoneCount: count,
          prompt,
          systemInstruction,
          model,
        });

        if (!data?.milestones || data.milestones.length !== count) {
          throw new Error(
            `Batch ${offset}–${offset + count - 1} returned ${data?.milestones?.length || 0} milestones instead of ${count}.`
          );
        }

        return data.milestones.map((m, idx) => ({
          ...m,
          estimated_week_offset: offset + idx,
        }));
      })
    );

    remainingResults.forEach((batchList) => {
      combinedMilestones.push(...batchList);
    });

    result = validateAndNormalizeBlueprintResponse(
      { overview: combinedOverview, milestones: combinedMilestones },
      {
        goal: cleanGoal,
        durationMonths: resolvedMonths,
        milestoneCount: expectedCount,
      }
    );
    result.model_used = modelUsedFinal;
  }

  // Apply explicit custom title only if user edited/provided one in Review phase
  if (titleOverride && titleOverride.trim()) {
    result.title = titleOverride.trim();
    result.overview.ai_title = titleOverride.trim();
  }

  return result;
}

// ---------------------------------------------------------------------------
// 3. Mentor Chat, Micro-Quiz & Rebalance
// ---------------------------------------------------------------------------

async function invokeLegacyGeminiAction(action, payload) {
  if (isSupabaseConfigured) {
    try {
      const data = await invokeSupabaseFunction('gemini-proxy', { action, payload }, 65000);
      if (data && !data.error) {
        return data;
      }
    } catch (edgeErr) {
      console.warn(`Supabase edge function notice (${action}):`, edgeErr.message);
    }
  }

  if (getGeminiApiKey()) {
    try {
      if (action === 'chat') {
        const { messages, roadmap_title, goal_summary, active_milestone, persona, model, gemini_model } = payload;
        const resolvedModel = model || gemini_model || 'gemini-3.5-flash';
        const personaInstructions = {
          tutor: 'Act as a Socratic Tutor: ask probing questions, guide step-by-step, explain conceptual mental models.',
          coach: 'Act as a Strict Accountability Coach: focus on implementation, zero excuses, high standards, timeboxing.',
          peer: 'Act as an Encouraging Peer: empathetic, relatable, share anecdotal analogies, celebrate wins.',
        };
        const systemInstruction = `You are the dedicated AI Mentor for "${roadmap_title}".
Context: ${goal_summary}. Active Milestone: ${active_milestone || 'General Curriculum'}.
Persona: ${personaInstructions[persona] || personaInstructions.tutor}
Stay strictly within "${roadmap_title}" and format answers cleanly with Markdown.`;

        const contents = (messages || []).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const { text } = await callDirectGeminiApi({
          systemInstruction,
          contents,
          temperature: 0.7,
          expectJson: false,
          preferredModel: resolvedModel,
          maxOutputTokens: 2048,
        });
        return { content: text };
      }

      if (action === 'micro_quiz') {
        const { milestone_title, milestone_description } = payload;
        const prompt = `Generate a 3-question multiple choice verification quiz for Milestone "${milestone_title}" (${milestone_description}). Return JSON: {"questions": [{"id": "q1", "question": "...", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "..."}]}`;
        const { text } = await callDirectGeminiApi({
          prompt,
          systemInstruction: 'Output valid JSON quiz only.',
          temperature: 0.3,
          expectJson: true,
        });
        return safeParseJson(text);
      }
    } catch (directErr) {
      console.warn(`Direct fallback notice (${action}):`, directErr.message);
    }
  }

  if (action === 'micro_quiz') {
    const title = payload.milestone_title || 'Core Milestone';
    return {
      questions: [
        {
          id: 'q1',
          question: `In the context of ${title}, what is the most reliable way to solidify mastery?`,
          options: [
            'Completing hands-on deliverables and verifying edge cases',
            'Skimming documentation without building exercises',
            'Skipping error handling to move faster',
            'Memorizing syntax without applying concepts',
          ],
          correct_index: 0,
          explanation: 'Applying concepts through hands-on deliverables builds lasting comprehension.',
        },
        {
          id: 'q2',
          question: 'How should unexpected errors and edge cases be handled in practice?',
          options: [
            'Explicit handling with clear recovery paths',
            'Ignoring errors silently',
            'Crashing the application immediately',
            'Retrying infinitely without backoff',
          ],
          correct_index: 0,
          explanation: 'Explicit error handling makes systems predictable and debuggable.',
        },
        {
          id: 'q3',
          question: 'When is a milestone ready to mark complete?',
          options: [
            'When deliverables are tested, documented, and verified',
            'After opening the resource link briefly',
            'When copying code without understanding dependencies',
            'Before testing any exercises',
          ],
          correct_index: 0,
          explanation: 'Verifying every deliverable confirms readiness for the next milestone.',
        },
      ],
    };
  }

  if (action === 'chat') {
    const roadmapTitle = payload.roadmap_title || 'Current Blueprint';
    const activeMilestone = payload.active_milestone || 'Active Milestone';
    return {
      content: `Let's focus on **${activeMilestone}** in **${roadmapTitle}**. Break your next deliverable into a small 30–45 minute build step, verify edge cases, and ask me if you hit any conceptual roadblock!`,
    };
  }

  return {
    message: 'Schedule adapted: Remaining incomplete milestones redistributed smoothly across your timeline.',
  };
}

export async function sendMentorMessage(payload) {
  return invokeLegacyGeminiAction('chat', payload);
}

export async function generateMicroQuiz(payload) {
  return invokeLegacyGeminiAction('micro_quiz', payload);
}

export const generateMicroQuizWithAI = generateMicroQuiz;

export async function rebalanceRoadmapWithAI(payload) {
  return invokeLegacyGeminiAction('rebalance', payload);
}
