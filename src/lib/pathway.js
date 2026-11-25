// src/lib/pathway.js
// AI Pathway Compiler — Gemini-powered personalized learning pathway generation library

import { supabase, isSupabaseConfigured } from './supabase';

export const DEFAULT_PATHWAY_MODEL = 'gemini-2.5-flash';

export const PATHWAY_MODELS = [
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Default — fast & accurate curriculum synthesis',
  },
  {
    value: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: 'Ultra-fast lightweight fallback tier',
  },
  {
    value: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    description: 'Alternate stable Flash model',
  },
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Deep reasoning for dense subjects',
  },
];

const MODEL_FALLBACK_ORDER = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
];

const RESOURCE_TYPES_CANONICAL = {
  course: 'Course',
  book: 'Book',
  video: 'Video',
  docs: 'Docs',
  project: 'Project',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function getGeminiApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && !envKey.includes('your-gemini-api-key') && envKey.trim().length > 10) {
    return envKey.trim();
  }
  return '';
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
 * Sanitizes external URLs without inventing fake links.
 * Returns normalized https URL or null if unsafe/unusable.
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

/**
 * Robust JSON parser that cleans Markdown code fences and extracts valid JSON objects.
 */
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
        // Strip trailing commas before closing brackets as last recovery attempt
        try {
          const repaired = candidate.replace(/,\s*([}\]])/g, '$1');
          return JSON.parse(repaired);
        } catch (innerErr) {
          console.warn('JSON substring parse error:', innerErr.message);
        }
      }
    }
    throw err;
  }
}

function buildModelChain(preferredModel) {
  const first = preferredModel || DEFAULT_PATHWAY_MODEL;
  return [first, ...MODEL_FALLBACK_ORDER.filter((m) => m !== first)];
}

/**
 * Invoke Supabase Edge Function with explicit >= 60s AbortController timeout.
 */
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
    // Use anonKey fallback when session read is unavailable
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
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds. Try a shorter duration, less frequent pacing, or retry.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Direct Google Gemini REST API call with multi-model failover & >= 60s timeout.
 * Only used when a frontend VITE_GEMINI_API_KEY env variable is configured.
 */
async function callDirectGeminiApi({
  prompt,
  systemInstruction,
  temperature = 0.3,
  timeoutMs = 95000,
  preferredModel = DEFAULT_PATHWAY_MODEL,
  maxOutputTokens = 65536,
}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const err = new Error('No Gemini backend proxy or environment API key is configured.');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const models = buildModelChain(preferredModel);
  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
        maxOutputTokens,
      },
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
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
        const err = new Error(`Gemini API Error (${res.status} on ${model}): ${errorText}`);
        err.status = res.status;
        throw err;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text.trim()) {
        throw new Error(`Gemini (${model}) returned an empty response.`);
      }

      const parsed = safeParseJson(text);
      return { data: parsed, modelUsed: model };
    } catch (err) {
      if (err.name === 'AbortError') {
        lastError = new Error(`Gemini (${model}) timed out after ${Math.round(timeoutMs / 1000)}s.`);
      } else {
        lastError = err;
      }
      console.warn(`[pathway] Direct model ${model} failed:`, lastError.message);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error('All Gemini models failed to respond.');
}

// ---------------------------------------------------------------------------
// 1. calculateMilestoneCount
// ---------------------------------------------------------------------------

/**
 * Returns the exact milestone count BEFORE calling Gemini.
 * Overload protection: When duration is 12 months or longer, disable Every day
 * and Every 3 days and automatically treat as Weekly.
 */
export function calculateMilestoneCount(durationMonths, pacing) {
  const months = Math.max(1, Number(durationMonths) || 1);

  let effectivePacing = pacing;
  if (months >= 12 && (pacing === 'daily' || pacing === 'every3days')) {
    effectivePacing = 'weekly';
  }

  switch (effectivePacing) {
    case 'daily':
      return months * 30;
    case 'every3days':
      return months * 10;
    case 'weekly':
      return months * 4;
    case 'biweekly':
      return months * 2;
    case 'monthly':
      return months * 1;
    default:
      return months * 4;
  }
}

// ---------------------------------------------------------------------------
// 2. getMilestoneLabel
// ---------------------------------------------------------------------------

/**
 * Returns a dynamic Day / Week / Month label for a 1-based offset.
 */
export function getMilestoneLabel(offset, pacing) {
  const n = Math.max(1, Number(offset) || 1);
  switch (pacing) {
    case 'daily':
      return `Day ${n}`;
    case 'every3days':
      return `Day ${(n - 1) * 3 + 1}`;
    case 'weekly':
      return `Week ${n}`;
    case 'biweekly':
      return `Week ${(n - 1) * 2 + 1}`;
    case 'monthly':
      return `Month ${n}`;
    default:
      return `Week ${n}`;
  }
}

// ---------------------------------------------------------------------------
// 3. estimatePathwayDuration
// ---------------------------------------------------------------------------

/**
 * Calls Gemini (temp 0.2, JSON mode) to estimate realistic duration in months.
 * Returns { recommended_months, reasoning, model_used? }.
 */
export async function estimatePathwayDuration({ goal, model = DEFAULT_PATHWAY_MODEL }) {
  const cleanGoal = String(goal || '').trim();
  if (!cleanGoal) {
    throw new Error('Please enter a learning goal before estimating duration.');
  }

  // 1. Try Supabase Edge Function gemini-proxy (supports model selection & failover)
  if (isSupabaseConfigured) {
    try {
      const data = await invokeSupabaseFunction(
        'gemini-proxy',
        { action: 'estimate_pathway_duration', payload: { goal: cleanGoal, model } },
        65000
      );
      if (data && typeof data.recommended_months === 'number') {
        return {
          recommended_months: Math.min(24, Math.max(1, Math.round(data.recommended_months))),
          reasoning: data.reasoning || 'Estimated based on scope and steady study cadence.',
          model_used: data.model_used || model,
        };
      }
    } catch (proxyErr) {
      // Fall through cleanly if endpoint unavailable or legacy version
      console.warn('estimate_pathway_duration proxy notice:', proxyErr.message);
    }

    // 2. Try dedicated estimate-duration Edge Function (already deployed, gemini-2.5-flash, temp 0.2)
    try {
      const data = await invokeSupabaseFunction('estimate-duration', { goal: cleanGoal }, 65000);
      if (data && typeof data.recommended_months === 'number') {
        return {
          recommended_months: Math.min(24, Math.max(1, Math.round(data.recommended_months))),
          reasoning: data.reasoning || 'Estimated based on subject breadth and typical pacing.',
          model_used: 'gemini-2.5-flash',
        };
      }
    } catch (edgeErr) {
      console.warn('estimate-duration endpoint notice:', edgeErr.message);
    }
  }

  // 3. Direct Gemini REST API fallback (only if VITE_GEMINI_API_KEY env var exists)
  const prompt = `You are an expert learning strategist. Analyze this learning goal and estimate a realistic time for someone to achieve it with consistent study sessions.

Learning Goal: "${cleanGoal}"

Consider:
- Complexity and breadth of the subject
- Typical learner background
- Recommended pacing for sustainable learning

Return ONLY valid JSON with this exact structure:
{"recommended_months": 3, "reasoning": "Brief explanation of why this duration is realistic and what factors you considered."}`;

  const { data, modelUsed } = await callDirectGeminiApi({
    prompt,
    systemInstruction:
      'You are an expert learning strategist. Output valid JSON only matching {"recommended_months": number, "reasoning": string}.',
    temperature: 0.2,
    timeoutMs: 65000,
    preferredModel: model,
    maxOutputTokens: 1024,
  });

  if (!data || typeof data.recommended_months !== 'number') {
    throw new Error('Invalid response from Gemini: could not parse duration estimate.');
  }

  return {
    recommended_months: Math.min(24, Math.max(1, Math.round(data.recommended_months))),
    reasoning: data.reasoning || '',
    model_used: modelUsed,
  };
}

// ---------------------------------------------------------------------------
// 4. compilePathwayWithAI + strict validation & normalization
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
    ? `\nCHUNK CONTEXT:\nThis is a continuation batch generating milestones ${startOffset} through ${endOffset} out of ${milestoneCount} total milestones.${
        existingOverview ? `\nPathway Title: "${existingOverview.ai_title}"` : ''
      }${
        previousTitles.length > 0
          ? `\nAlready covered in earlier milestones (DO NOT repeat these topics):\n- ${previousTitles.slice(-15).join('\n- ')}`
          : ''
      }\n`
    : '';

  const overviewInstruction =
    startOffset === 1
      ? `  "overview": {
    "ai_title": "Maximum 4 words",
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

  return `You are a world-class learning strategist and curriculum architect. Act like a personal mentor who researches what the learner needs, selects trustworthy real resources, and organizes a realistic educational journey.

Learning Goal: "${goal}"
Total Duration: ${durationMonths} months (~${estimatedWeeks} weeks)
Study Frequency: ${pacing}
Total Pathway Milestones: ${milestoneCount}
${continuityBlock}
CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${chunkCount} milestones for this response.
2. Assign sequential "estimated_week_offset" integer values starting from ${startOffset} through ${endOffset}.
3. Assign sequential "id" values "m${startOffset}" through "m${endOffset}".
4. For EVERY milestone, structure a rich mini-course covering:
   - Learn ("learning_objectives"): Specific concepts, topics, and skills the learner needs to understand.
   - Watch & Read ("resources"): Real, existing courses, videos, tutorials, books, and official documentation.
   - Practice ("practical_exercises"): Hands-on guided exercises and drills.
   - Build ("projects"): Concrete hands-on projects reinforcing the concepts.
   - Deliverables ("deliverables"): Clear, measurable completion outcomes proving understanding.
5. RESOURCE QUALITY REQUIREMENTS:
   - ${resourceCountGuidance}
   - Only cite REAL, well-known resources (official documentation like developer.mozilla.org, docs.python.org, react.dev; free courses on Coursera, edX, freeCodeCamp, Khan Academy, MIT OpenCourseWare, Harvard CS50, roadmap.sh; established YouTube channels/playlists; established books).
   - NEVER invent fake course titles, fake websites, or made-up URLs.
   - If you do not know a deep link with certainty, link cleanly to the official site homepage or verified curriculum section (never use generic search URLs).
   - Set "is_free": true for free resources and "is_free": false for clearly paid courses/books.
   - Match difficulty progressively from fundamentals to advanced topics and distribute workload realistically for ${pacing} pacing.
   - Avoid unnecessary repetition across milestones.

Return ONLY valid JSON matching this exact structure:
{
${overviewInstruction}
  "milestones": [
    {
      "id": "m${startOffset}",
      "title": "Specific descriptive milestone title",
      "description": "2-3 clear sentences explaining what this milestone covers and why it matters.",
      "learning_objectives": [
        "Understand concept X",
        "Apply skill Y"
      ],
      "resources": [
        {
          "type": "Course",
          "title": "Real Existing Course or Tutorial Name",
          "description": "What this resource covers",
          "url": "https://actual-verified-domain.org/path",
          "is_free": true
        }
      ],
      "practical_exercises": [
        "Specific guided exercise 1",
        "Specific guided exercise 2"
      ],
      "projects": [
        "Hands-on project idea reinforcing the milestone"
      ],
      "deliverables": [
        "Measurable deliverable 1",
        "Measurable deliverable 2"
      ],
      "estimated_week_offset": ${startOffset},
      "status": "Not Started"
    }
  ]
}

Generate ALL ${chunkCount} milestones (offsets ${startOffset}..${endOffset}) now. Output valid JSON only.`;
}

function normalizeResourceType(rawType) {
  const key = String(rawType || 'course').trim().toLowerCase();
  if (RESOURCE_TYPES_CANONICAL[key]) return RESOURCE_TYPES_CANONICAL[key];
  if (key.includes('vid') || key.includes('youtube') || key.includes('watch')) return 'Video';
  if (key.includes('doc') || key.includes('guide') || key.includes('article') || key.includes('ref')) return 'Docs';
  if (key.includes('book') || key.includes('read')) return 'Book';
  if (key.includes('proj') || key.includes('build') || key.includes('repo')) return 'Project';
  return 'Course';
}

function normalizeDifficulty(rawDiff) {
  const d = String(rawDiff || '').trim().toLowerCase();
  if (d.includes('begin')) return 'Beginner';
  if (d.includes('adv') || d.includes('expert')) return 'Advanced';
  return 'Intermediate';
}

function normalizeStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (typeof item === 'string' ? item.trim() : String(item?.title || item?.name || '').trim()))
    .filter(Boolean);
}

function normalizeMilestone(m, expectedOffset) {
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
    status: m?.status === 'Completed' ? 'Completed' : 'Not Started',
  };
}

/**
 * Validates parsed AI response and enforces exact milestone count and sorted offsets.
 */
export function validateAndNormalizePathwayResponse(parsed, { goal, durationMonths, milestoneCount }) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid AI response: expected a JSON object.');
  }
  if (!Array.isArray(parsed.milestones)) {
    throw new Error('Invalid AI response: missing milestones array.');
  }

  if (parsed.milestones.length !== milestoneCount) {
    const err = new Error(
      `AI generated ${parsed.milestones.length} milestones, but this configuration requires exact ${milestoneCount} milestones.`
    );
    err.code = 'MILESTONE_COUNT_MISMATCH';
    err.actualCount = parsed.milestones.length;
    err.expectedCount = milestoneCount;
    throw err;
  }

  const sortedMilestones = [...parsed.milestones]
    .sort((a, b) => (Number(a?.estimated_week_offset) || 0) - (Number(b?.estimated_week_offset) || 0))
    .map((m, idx) => normalizeMilestone(m, idx + 1));

  // Enforce sequential 1..milestoneCount offsets cleanly
  sortedMilestones.forEach((m, idx) => {
    m.estimated_week_offset = idx + 1;
  });

  const rawOverview = parsed.overview || {};
  const aiTitle = String(rawOverview.ai_title || '').trim();
  const overview = {
    ai_title: aiTitle || goal.trim(),
    goal_summary: String(rawOverview.goal_summary || goal.trim()).trim(),
    estimated_duration_weeks:
      Number(rawOverview.estimated_duration_weeks) > 0
        ? Math.round(Number(rawOverview.estimated_duration_weeks))
        : Math.round(durationMonths * 4.33),
    difficulty_level: normalizeDifficulty(rawOverview.difficulty_level),
    expected_outcomes: normalizeStringArray(rawOverview.expected_outcomes),
  };

  return {
    overview,
    milestones: sortedMilestones,
    model_used: parsed.model_used,
  };
}

/**
 * Builds the persisted pathway record with:
 * - Unique UUID
 * - overview.ai_title fallback to original goal
 * - Namespaced milestone IDs (${pathwayId}_${milestone.id})
 * - Sorted milestones & checklist map
 */
export function buildPathwayRecord({
  pathwayId,
  userId,
  goal,
  durationMonths,
  pacing,
  milestoneCount,
  modelUsed,
  compiled,
}) {
  const id = pathwayId || generateUUID();
  const cleanGoal = String(goal || '').trim();
  const overview = compiled?.overview || {};
  const resolvedTitle = String(overview.ai_title || '').trim() || cleanGoal;

  const sortedMilestones = [...(compiled?.milestones || [])]
    .sort((a, b) => (Number(a.estimated_week_offset) || 0) - (Number(b.estimated_week_offset) || 0))
    .map((m, idx) => {
      const baseId = String(m.id || `m${idx + 1}`).trim();
      const namespacedId = baseId.startsWith(`${id}_`) ? baseId : `${id}_${baseId}`;
      return {
        ...m,
        id: namespacedId,
        estimated_week_offset: Number(m.estimated_week_offset) || idx + 1,
        status: m.status === 'Completed' ? 'Completed' : 'Not Started',
        checklist: m.checklist || {},
      };
    });

  return {
    id,
    userId: userId || null,
    goal: cleanGoal,
    title: resolvedTitle,
    durationMonths: Number(durationMonths),
    pacing,
    milestoneCount,
    modelUsed: modelUsed || compiled?.model_used || DEFAULT_PATHWAY_MODEL,
    createdAt: new Date().toISOString(),
    overview: {
      ...overview,
      ai_title: resolvedTitle,
    },
    milestones: sortedMilestones,
  };
}

/**
 * Executes one AI JSON call via Supabase Edge Function (gemini-proxy) with
 * automatic fallback to direct Gemini REST API if VITE_GEMINI_API_KEY is configured.
 */
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
      throw new Error('AI proxy returned a response without a valid milestones list.');
    } catch (err) {
      proxyError = err;
      console.warn('[pathway] Supabase proxy compile notice:', err.message);
    }
  }

  // Fallback to direct Gemini REST API only if env API key exists locally
  if (getGeminiApiKey()) {
    const { data, modelUsed } = await callDirectGeminiApi({
      prompt,
      systemInstruction,
      temperature: 0.3,
      timeoutMs: 95000,
      preferredModel: model,
      maxOutputTokens: 65536,
    });
    return { data, modelUsed };
  }

  // Format clear, actionable error if proxy failed
  if (proxyError) {
    if (proxyError.status === 429 || /quota|rate.?limit/i.test(proxyError.message)) {
      throw new Error('Gemini API quota or rate limit exceeded. Try switching to another model (e.g. Gemini 2.5 Flash Lite or Gemini 2.0 Flash) and retry.');
    }
    if (/Unknown action:\s*compile_pathway/i.test(proxyError.message)) {
      throw new Error('The Supabase Edge Function "gemini-proxy" needs to be redeployed with compile_pathway support before live compilation.');
    }
    throw proxyError;
  }

  throw new Error('Unable to reach AI compilation service. Please check your connection and try again.');
}

/**
 * Compiles a complete, validated learning pathway using Gemini.
 * Handles:
 * - Default model gemini-2.5-flash + user-selected model + multi-model failover
 * - Corrective retry when Gemini misses exact milestoneCount
 * - Sequential chunking when milestoneCount > 24 so even large daily/weekly plans succeed
 * - Strict schema & milestoneCount validation
 */
export async function compilePathwayWithAI({
  goal,
  durationMonths,
  pacing,
  milestoneCount,
  model = DEFAULT_PATHWAY_MODEL,
  onProgress,
}) {
  const cleanGoal = String(goal || '').trim();
  if (!cleanGoal) {
    throw new Error('Please enter a learning goal.');
  }

  const expectedCount = Number(milestoneCount) || calculateMilestoneCount(durationMonths, pacing);
  const systemInstruction =
    'You are a world-class learning strategist and curriculum designer. Output valid JSON only. Never fabricate URLs or resource names.';

  const CHUNK_SIZE = 20;

  // Single-call path for plans <= 24 milestones (fast, cohesive)
  if (expectedCount <= 24) {
    const prompt = buildCompilePrompt({
      goal: cleanGoal,
      durationMonths,
      pacing,
      milestoneCount: expectedCount,
    });

    const modelsToTry = buildModelChain(model);
    let lastErr = null;

    for (let attempt = 0; attempt < Math.min(2, modelsToTry.length); attempt++) {
      const attemptModel = modelsToTry[attempt];
      try {
        if (onProgress && attempt > 0) {
          onProgress(`Retrying compilation with ${attemptModel} to match exact ${expectedCount} milestones…`);
        }

        const effectivePrompt =
          attempt === 0
            ? prompt
            : `${prompt}\n\nIMPORTANT CORRECTION: Previous output had ${lastErr?.actualCount || 'wrong number of'} milestones. You MUST output an array containing EXACTLY ${expectedCount} milestone objects numbered estimated_week_offset 1 to ${expectedCount}. Count every milestone before finishing.`;

        const { data, modelUsed } = await executeCompileChunk({
          goal: cleanGoal,
          durationMonths,
          pacing,
          milestoneCount: expectedCount,
          prompt: effectivePrompt,
          systemInstruction,
          model: attemptModel,
        });

        const normalized = validateAndNormalizePathwayResponse(data, {
          goal: cleanGoal,
          durationMonths,
          milestoneCount: expectedCount,
        });
        normalized.model_used = modelUsed || attemptModel;
        return normalized;
      } catch (err) {
        lastErr = err;
        // Retry automatically on count mismatch, JSON issues, 429, or 5xx
        console.warn(`[pathway] Compilation attempt ${attempt + 1} (${attemptModel}) failed:`, err.message);
      }
    }

    throw lastErr || new Error('Failed to compile learning pathway.');
  }

  // Chunked compilation for large pathways (> 24 milestones) to prevent token truncation
  let combinedOverview = null;
  const combinedMilestones = [];
  let modelUsedFinal = model;
  let offset = 1;

  while (offset <= expectedCount) {
    const count = Math.min(CHUNK_SIZE, expectedCount - offset + 1);
    if (onProgress) {
      onProgress(`Compiling milestones ${offset}–${offset + count - 1} of ${expectedCount}…`);
    }

    const prompt = buildCompilePrompt({
      goal: cleanGoal,
      durationMonths,
      pacing,
      milestoneCount: expectedCount,
      startOffset: offset,
      chunkCount: count,
      existingOverview: combinedOverview,
      previousTitles: combinedMilestones.map((m) => m.title),
    });

    let chunkResult = null;
    let lastChunkErr = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const attemptModel = attempt === 0 ? model : buildModelChain(model)[1] || model;
      try {
        const { data, modelUsed } = await executeCompileChunk({
          goal: cleanGoal,
          durationMonths,
          pacing,
          milestoneCount: count,
          prompt:
            attempt === 0
              ? prompt
              : `${prompt}\n\nIMPORTANT: Return EXACTLY ${count} milestones with offsets ${offset} through ${offset + count - 1}.`,
          systemInstruction,
          model: attemptModel,
        });

        if (!data?.milestones || data.milestones.length !== count) {
          throw new Error(
            `Chunk ${offset}-${offset + count - 1} returned ${data?.milestones?.length || 0} milestones instead of ${count}.`
          );
        }

        chunkResult = data;
        if (modelUsed) modelUsedFinal = modelUsed;
        break;
      } catch (err) {
        lastChunkErr = err;
      }
    }

    if (!chunkResult) {
      throw lastChunkErr || new Error(`Failed compiling milestones ${offset}–${offset + count - 1}.`);
    }

    if (offset === 1 && chunkResult.overview) {
      combinedOverview = chunkResult.overview;
    }

    chunkResult.milestones.forEach((m, idx) => {
      combinedMilestones.push({
        ...m,
        estimated_week_offset: offset + idx,
      });
    });

    offset += count;
  }

  const normalized = validateAndNormalizePathwayResponse(
    { overview: combinedOverview, milestones: combinedMilestones },
    {
      goal: cleanGoal,
      durationMonths,
      milestoneCount: expectedCount,
    }
  );
  normalized.model_used = modelUsedFinal;
  return normalized;
}

// ---------------------------------------------------------------------------
// 5. Persistence Helpers (localStorage scoped per user)
// ---------------------------------------------------------------------------

export function savePathway(userId, pathway) {
  const key = `pathway_${userId || 'guest'}`;
  const existing = loadPathways(userId);

  const toSave = {
    id: pathway.id || generateUUID(),
    userId: userId || null,
    createdAt: pathway.createdAt || new Date().toISOString(),
    ...pathway,
  };

  if (Array.isArray(toSave.milestones)) {
    toSave.milestones = toSave.milestones.map((m) => ({
      checklist: {},
      ...m,
    }));
  }

  const exists = existing.some((p) => p.id === toSave.id);
  const updated = exists
    ? existing.map((p) => (p.id === toSave.id ? toSave : p))
    : [toSave, ...existing];

  localStorage.setItem(key, JSON.stringify(updated));
  return toSave;
}

export function loadPathways(userId) {
  const key = `pathway_${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function deletePathway(userId, pathwayId) {
  const key = `pathway_${userId || 'guest'}`;
  const existing = loadPathways(userId);
  const updated = existing.filter((p) => p.id !== pathwayId);
  localStorage.setItem(key, JSON.stringify(updated));
}

export function updatePathwayProgress(userId, pathwayId, milestoneId, completed) {
  const pathways = loadPathways(userId);
  const pathway = pathways.find((p) => p.id === pathwayId);
  if (!pathway) throw new Error(`Pathway not found: ${pathwayId}`);

  pathway.milestones = pathway.milestones.map((m) => {
    if (m.id !== milestoneId) return m;
    return {
      ...m,
      status: completed ? 'Completed' : 'Not Started',
    };
  });

  return savePathway(userId, pathway);
}

export function updateMilestoneChecklist(userId, pathwayId, milestoneId, deliverableIndex, checked) {
  const pathways = loadPathways(userId);
  const pathway = pathways.find((p) => p.id === pathwayId);
  if (!pathway) throw new Error(`Pathway not found: ${pathwayId}`);

  pathway.milestones = pathway.milestones.map((m) => {
    if (m.id !== milestoneId) return m;
    const checklist = { ...m.checklist };
    checklist[deliverableIndex] = checked;
    return { ...m, checklist };
  });

  return savePathway(userId, pathway);
}
