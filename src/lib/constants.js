// src/lib/constants.js

export const APP_NAME = 'Milestone AI'

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced']

export const PACING_OPTIONS = [
  { value: 'weekly', label: 'Weekly', description: '1 milestone per week' },
  { value: 'biweekly', label: 'Bi-weekly', description: '1 milestone every 2 weeks' },
  { value: 'monthly', label: 'Monthly', description: '1 milestone per month' },
  { value: 'quarterly', label: 'Quarterly', description: '1 milestone every 3 months' },
]

/**
 * Automate milestone count based on duration and pacing frequency:
 * - 24 months + Monthly = 24 milestones
 * - 24 months + Quarterly = 8 milestones
 * - 12 months + Monthly = 12 milestones
 * - 6 months + Monthly = 6 milestones
 */
export function calculateMilestones(durationMonths, pacing) {
  const months = Math.max(1, Math.round(Number(durationMonths) || 1));
  switch (pacing) {
    case 'weekly':
      return Math.min(36, Math.max(1, months * 4));
    case 'biweekly':
      return Math.min(36, Math.max(1, months * 2));
    case 'quarterly':
      return Math.max(1, Math.round(months / 3));
    case 'monthly':
    default:
      return Math.max(1, months);
  }
}

export const GEMINI_MODELS = [
  { value: 'flash', label: 'Gemini Flash', description: 'Fast — chat, quizzes' },
  { value: 'pro', label: 'Gemini Pro', description: 'Deep — roadmap generation' },
]

export const MENTOR_PERSONAS = [
  { value: 'tutor', label: 'Socratic Tutor', emoji: '🎓' },
  { value: 'coach', label: 'Strict Coach', emoji: '💪' },
  { value: 'peer', label: 'Encouraging Peer', emoji: '🤝' },
]

export const RESOURCE_TYPES = [
  { value: 'course', label: 'Course', icon: '📚' },
  { value: 'book', label: 'Book', icon: '📖' },
  { value: 'video', label: 'Video', icon: '🎥' },
  { value: 'docs', label: 'Docs', icon: '📄' },
  { value: 'project', label: 'Project', icon: '🛠️' },
]

export const ROADMAP_TEMPLATES = [
  {
    title: 'Jetpack Compose',
    goal: 'Master Jetpack Compose for building modern Android UIs',
    difficulty: 'intermediate',
    duration: 3,
    icon: '📱',
  },
  {
    title: '10K Running',
    goal: 'Train from couch to running a 10K race comfortably',
    difficulty: 'beginner',
    duration: 3,
    icon: '🏃',
  },
  {
    title: 'Conversational French',
    goal: 'Reach conversational fluency in French for travel and daily life',
    difficulty: 'beginner',
    duration: 6,
    icon: '🇫🇷',
  },
  {
    title: 'Indie Startup MVP',
    goal: 'Build and launch an MVP for an indie SaaS product',
    difficulty: 'intermediate',
    duration: 4,
    icon: '🚀',
  },
  {
    title: 'Machine Learning',
    goal: 'Learn machine learning from fundamentals to deploying models',
    difficulty: 'advanced',
    duration: 6,
    icon: '🤖',
  },
]

export const BADGE_DEFINITIONS = [
  { slug: 'first_roadmap', name: 'Trailblazer', description: 'Created your first roadmap', emoji: '🗺️' },
  { slug: 'first_complete', name: 'Finisher', description: 'Completed your first roadmap', emoji: '🏁' },
  { slug: 'streak_7', name: 'Week Warrior', description: '7-day activity streak', emoji: '🔥' },
  { slug: 'streak_30', name: 'Monthly Master', description: '30-day activity streak', emoji: '⚡' },
  { slug: 'xp_1000', name: 'XP Hunter', description: 'Earned 1,000 XP', emoji: '💎' },
  { slug: 'quiz_ace', name: 'Quiz Ace', description: 'Passed 10 milestone quizzes', emoji: '🧠' },
]
