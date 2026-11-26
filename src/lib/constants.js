// src/lib/constants.js

export const APP_NAME = 'Milestone AI';

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

export const PACING_OPTIONS = [
  { value: 'daily', label: 'Every day', description: '30 milestones per month', rate: '30/mo' },
  { value: 'every_3_days', label: 'Every 3 days', description: '10 milestones per month', rate: '10/mo' },
  { value: 'weekly', label: 'Weekly', description: '4 milestones per month', rate: '4/mo' },
  { value: 'biweekly', label: 'Every 2 weeks', description: '2 milestones per month', rate: '2/mo' },
  { value: 'monthly', label: 'Monthly', description: '1 milestone per month', rate: '1/mo' },
];

export const DEFAULT_BLUEPRINT_MODEL = 'gemini-3.5-flash';

export function normalizePacingKey(pacing) {
  const raw = String(pacing || 'weekly').toLowerCase();
  if (raw === 'every3days') return 'every_3_days';
  if (raw === 'daily' || raw === 'every_3_days' || raw === 'weekly' || raw === 'biweekly' || raw === 'monthly') {
    return raw;
  }
  return 'weekly';
}

export function getPacingLabel(pacing) {
  const key = normalizePacingKey(pacing);
  return PACING_OPTIONS.find((p) => p.value === key)?.label || pacing;
}

/**
 * Automated milestone count with overload protection:
 * - Every day: Months * 30
 * - Every 3 days: Months * 10
 * - Weekly: Months * 4
 * - Every 2 weeks: Months * 2
 * - Monthly: Months * 1
 * For durations >= 12 months, Daily and Every 3 Days fall back to Weekly.
 */
export function calculateMilestones(durationMonths, pacing) {
  const months = Math.max(1, Math.round(Number(durationMonths) || 1));
  let effectivePacing = normalizePacingKey(pacing);

  if (months >= 12 && (effectivePacing === 'daily' || effectivePacing === 'every_3_days')) {
    effectivePacing = 'weekly';
  }

  switch (effectivePacing) {
    case 'daily':
      return months * 30;
    case 'every_3_days':
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

/**
 * Dynamic Day / Week / Month label for a 1-based milestone offset.
 */
export function getMilestoneLabel(offset, pacing) {
  const n = Math.max(1, Number(offset) || 1);
  switch (normalizePacingKey(pacing)) {
    case 'daily':
      return `Day ${n}`;
    case 'every_3_days':
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

export const MENTOR_PERSONAS = [
  { value: 'tutor', label: 'Socratic Tutor', hint: 'Discovery-guided' },
  { value: 'coach', label: 'Strict Coach', hint: 'Deliverable-focused' },
  { value: 'peer', label: 'Study Peer', hint: 'Collaborative' },
];

export const RESOURCE_TYPES = [
  { value: 'course', label: 'Course' },
  { value: 'book', label: 'Book' },
  { value: 'video', label: 'Video' },
  { value: 'docs', label: 'Docs' },
  { value: 'project', label: 'Project' },
];

export const BADGE_DEFINITIONS = [
  { slug: 'first_roadmap', name: 'Trailblazer', description: 'Created your first blueprint' },
  { slug: 'first_complete', name: 'Finisher', description: 'Completed your first blueprint' },
  { slug: 'streak_7', name: 'Week Warrior', description: '7-day activity streak' },
  { slug: 'streak_30', name: 'Monthly Master', description: '30-day activity streak' },
  { slug: 'xp_1000', name: 'XP Hunter', description: 'Earned 1,000 XP' },
  { slug: 'quiz_ace', name: 'Quiz Ace', description: 'Passed 10 milestone quizzes' },
];
