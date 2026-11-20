// src/lib/mockData.js

export const MOCK_USER = {
  id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
  email: 'alex.developer@example.com',
  display_name: 'Alex Chen',
  avatar_url: null,
  created_at: '2026-10-15T10:00:00Z',
};

export const MOCK_STATS = {
  id: 'stat_01h9x8y7z6a5b4c3d2e1f0g9h8',
  user_id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
  total_xp: 2850,
  current_streak: 14,
  longest_streak: 21,
  last_activity_date: '2026-11-20',
  badges: [
    {
      slug: 'first_roadmap',
      name: 'Trailblazer',
      description: 'Created your first roadmap blueprint',
      emoji: '🗺️',
      earned_at: '2026-10-15T10:15:00Z',
    },
    {
      slug: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintained a 7-day learning streak',
      emoji: '🔥',
      earned_at: '2026-10-22T18:00:00Z',
    },
    {
      slug: 'quiz_ace',
      name: 'Quiz Master',
      description: 'Passed 3 milestone gate quizzes',
      emoji: '🧠',
      earned_at: '2026-11-05T14:30:00Z',
    },
    {
      slug: 'xp_1000',
      name: 'XP Hunter',
      description: 'Earned over 2,000 learning XP',
      emoji: '💎',
      earned_at: '2026-11-12T09:20:00Z',
    },
  ],
};

export const MOCK_SETTINGS = {
  id: 'set_01h9x8y7z6a5b4c3d2e1f0g9h8',
  user_id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
  default_model: 'flash',
  notification_pacing: 'daily',
  push_enabled: true,
  mentor_persona: 'tutor',
};

export const MOCK_ROADMAPS = [
  {
    id: 'roadmap-jetpack-compose',
    user_id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
    title: 'Master Jetpack Compose & Modern Android',
    goal_summary: 'Build fluid, reactive Android user interfaces with Jetpack Compose, Kotlin Coroutines, and MVI architecture.',
    difficulty: 'intermediate',
    duration_months: 3,
    pacing: 'weekly',
    key_outcomes: [
      'Master declarative UI paradigm, State hoisting, and Recomposition optimization',
      'Integrate Navigation Component, Animations, and Material 3 theming',
      'Architect scalable apps using Clean Architecture, ViewModel, and StateFlow',
      'Ship a full-featured open-source Android app to Google Play Store',
    ],
    gemini_model: 'pro',
    status: 'active',
    start_date: '2026-10-01',
    target_end_date: '2027-01-01',
  },
  {
    id: 'roadmap-conversational-french',
    user_id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
    title: 'Conversational French B1 Fluency',
    goal_summary: 'Attain practical conversational fluency in French for travel, daily communication, and cultural comprehension.',
    difficulty: 'beginner',
    duration_months: 6,
    pacing: 'biweekly',
    key_outcomes: [
      'Master essential French phonetics, nasal vowels, and liaison rules',
      'Hold 15-minute uninterrupted everyday conversations with native speakers',
      'Grasp Passé Composé, Imparfait, and Subjunctive mood in real contexts',
      'Understand spoken French media (podcasts, news radio) at natural speed',
    ],
    gemini_model: 'flash',
    status: 'active',
    start_date: '2026-09-15',
    target_end_date: '2027-03-15',
  },
  {
    id: 'roadmap-indie-startup-mvp',
    user_id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
    title: 'Indie SaaS MVP Launch in 12 Weeks',
    goal_summary: 'From validated micro-SaaS idea to fully deployed, paying-customer ready product on Supabase and Stripe.',
    difficulty: 'intermediate',
    duration_months: 3,
    pacing: 'weekly',
    key_outcomes: [
      'Validate problem-solution fit through 20 customer discovery interviews',
      'Implement multi-tenant auth, Stripe subscriptions, and rate limiting',
      'Set up CI/CD pipeline, analytics tracking, and automated error logging',
      'Launch publicly on Product Hunt and acquire first 10 paying customers',
    ],
    gemini_model: 'pro',
    status: 'completed',
    start_date: '2026-06-01',
    target_end_date: '2026-09-01',
  },
];

export const MOCK_MILESTONES = {
  'roadmap-jetpack-compose': [
    {
      id: 'ms-jc-1',
      roadmap_id: 'roadmap-jetpack-compose',
      order_index: 0,
      title: 'Compose Mental Model & Declarative UI Foundations',
      description: 'Shift mindset from imperative Android View hierarchies to declarative Composable functions. Deep dive into Recomposition lifecycles, slot APIs, and standard layouts.',
      is_completed: true,
      is_major: false,
      due_date: '2026-10-15',
      completed_at: '2026-10-14T16:00:00Z',
      xp_reward: 150,
      deliverables: [
        { id: 'del-jc-1-1', title: 'Implement Column, Row, Box responsive dashboard layout', is_completed: true, order_index: 0 },
        { id: 'del-jc-1-2', title: 'Build a custom Profile Card with Modifiers and Material 3 theming', is_completed: true, order_index: 1 },
        { id: 'del-jc-1-3', title: 'Experiment with LayoutInspector to observe recomposition triggers', is_completed: true, order_index: 2 },
      ],
      resources: [
        { id: 'res-jc-1-1', title: 'Thinking in Compose — Official Android Guide', url: 'https://developer.android.com/develop/ui/compose/mental-model', type: 'docs', order_index: 0 },
        { id: 'res-jc-1-2', title: 'Jetpack Compose Basics Codelab', url: 'https://developer.android.com/codelabs/jetpack-compose-basics', type: 'course', order_index: 1 },
        { id: 'res-jc-1-3', title: 'Compose State & Recomposition Deep Dive', url: 'https://www.youtube.com/watch?v=oxwJ3Jb3XvY', type: 'video', order_index: 2 },
      ],
    },
    {
      id: 'ms-jc-2',
      roadmap_id: 'roadmap-jetpack-compose',
      order_index: 1,
      title: 'State Hoisting, ViewModels & Unidirectional Data Flow (UDF)',
      description: 'Master state management with remember, rememberSaveable, and state hoisting. Wire state down and events up with ViewModel and StateFlow.',
      is_completed: true,
      is_major: false,
      due_date: '2026-11-01',
      completed_at: '2026-10-30T19:30:00Z',
      xp_reward: 200,
      deliverables: [
        { id: 'del-jc-2-1', title: 'Refactor stateful widgets into pure stateless components with hoisted lambdas', is_completed: true, order_index: 0 },
        { id: 'del-jc-2-2', title: 'Connect Compose UI with AndroidX ViewModel using collectAsStateWithLifecycle', is_completed: true, order_index: 1 },
        { id: 'del-jc-2-3', title: 'Handle configuration changes and process death using SavedStateHandle', is_completed: true, order_index: 2 },
      ],
      resources: [
        { id: 'res-jc-2-1', title: 'State in Jetpack Compose Documentation', url: 'https://developer.android.com/develop/ui/compose/state', type: 'docs', order_index: 0 },
        { id: 'res-jc-2-2', title: 'Android Architecture: Unidirectional Data Flow', url: 'https://developer.android.com/topic/architecture/ui-layer', type: 'docs', order_index: 1 },
        { id: 'res-jc-2-3', title: 'Kotlin StateFlow & SharedFlow Masterclass', url: 'https://www.youtube.com/watch?v=6mxWtw706Yc', type: 'video', order_index: 2 },
      ],
    },
    {
      id: 'ms-jc-3',
      roadmap_id: 'roadmap-jetpack-compose',
      order_index: 2,
      title: 'Complex Lists, Compose Navigation & Shared Element Transitions',
      description: 'Build performant infinite scroll feeds with LazyColumn, custom keys, and contentType. Implement multi-screen navigation with type-safe arguments and animated route transitions.',
      is_completed: false,
      is_major: true,
      due_date: '2026-11-25',
      completed_at: null,
      xp_reward: 350,
      deliverables: [
        { id: 'del-jc-3-1', title: 'Construct LazyVerticalGrid with sticky headers, pagination, and empty/error states', is_completed: true, order_index: 0 },
        { id: 'del-jc-3-2', title: 'Implement type-safe Compose Navigation 2.8+ using Kotlin serialization routes', is_completed: false, order_index: 1 },
        { id: 'del-jc-3-3', title: 'Add shared element transitions between overview card and detail screen', is_completed: false, order_index: 2 },
      ],
      resources: [
        { id: 'res-jc-3-1', title: 'Lists and Grids in Compose', url: 'https://developer.android.com/develop/ui/compose/lists', type: 'docs', order_index: 0 },
        { id: 'res-jc-3-2', title: 'Type-Safe Navigation in Compose 2.8', url: 'https://developer.android.com/guide/navigation/design/type-safety', type: 'docs', order_index: 1 },
        { id: 'res-jc-3-3', title: 'Compose Animation Cookbook (Official Samples)', url: 'https://github.com/android/snippets/tree/master/compose/snippets', type: 'project', order_index: 2 },
      ],
    },
    {
      id: 'ms-jc-4',
      roadmap_id: 'roadmap-jetpack-compose',
      order_index: 3,
      title: 'Animations, Custom Canvas & Production Readiness',
      description: 'Create delightful micro-interactions with animate*AsState, updateTransition, and AnimatedVisibility. Benchmark frame metrics with Macrobenchmark and deploy release APK.',
      is_completed: false,
      is_major: true,
      due_date: '2026-12-20',
      completed_at: null,
      xp_reward: 500,
      deliverables: [
        { id: 'del-jc-4-1', title: 'Build a custom interactive data visualization chart using Canvas drawBehind', is_completed: false, order_index: 0 },
        { id: 'del-jc-4-2', title: 'Run Compose Compiler Metrics report to identify unstable classes and skip failures', is_completed: false, order_index: 1 },
        { id: 'del-jc-4-3', title: 'Write comprehensive UI automated tests using composeTestRule and semantics matcher', is_completed: false, order_index: 2 },
      ],
      resources: [
        { id: 'res-jc-4-1', title: 'Compose Animations Overview', url: 'https://developer.android.com/develop/ui/compose/animation', type: 'docs', order_index: 0 },
        { id: 'res-jc-4-2', title: 'Compose Compiler Metrics Guide', url: 'https://developer.android.com/develop/ui/compose/performance/stability/diagnose', type: 'docs', order_index: 1 },
        { id: 'res-jc-4-3', title: 'Now in Android — Full Production Reference Architecture', url: 'https://github.com/android/nowinandroid', type: 'project', order_index: 2 },
      ],
    },
  ],
  'roadmap-conversational-french': [
    {
      id: 'ms-fr-1',
      roadmap_id: 'roadmap-conversational-french',
      order_index: 0,
      title: 'Foundations: Phonetics, Greetings & Present Tense',
      description: 'Master French pronunciation nuances, basic conversational routines, numbers, and high-frequency irregular verbs (être, avoir, aller, faire).',
      is_completed: true,
      is_major: false,
      due_date: '2026-10-15',
      completed_at: '2026-10-12T11:00:00Z',
      xp_reward: 150,
      deliverables: [
        { id: 'del-fr-1-1', title: 'Learn IPA pronunciation of 37 French phonemes', is_completed: true, order_index: 0 },
        { id: 'del-fr-1-2', title: 'Record a 2-minute personal introduction in French', is_completed: true, order_index: 1 },
        { id: 'del-fr-1-3', title: 'Complete 100 flashcards for high-frequency A1 vocabulary', is_completed: true, order_index: 2 },
      ],
      resources: [
        { id: 'res-fr-1-1', title: 'French Phonetics & Pronunciation Guide', url: 'https://frenchpod101.com', type: 'course', order_index: 0 },
        { id: 'res-fr-1-2', title: 'Coffee Break French Podcast (Season 1)', url: 'https://coffeebreaklanguages.com/coffeebreakfrench/', type: 'video', order_index: 1 },
      ],
    },
    {
      id: 'ms-fr-2',
      roadmap_id: 'roadmap-conversational-french',
      order_index: 1,
      title: 'Past Tense Mastery: Passé Composé vs Imparfait',
      description: 'Learn to recount past adventures, stories, and background contexts accurately without confusing completed actions and habitual states.',
      is_completed: false,
      is_major: true,
      due_date: '2026-11-30',
      completed_at: null,
      xp_reward: 300,
      deliverables: [
        { id: 'del-fr-2-1', title: 'Write a 300-word essay about your favorite vacation in past tense', is_completed: false, order_index: 0 },
        { id: 'del-fr-2-2', title: 'Memorize the 14 DR & MRS VANDERTRAMP verbs using être auxiliary', is_completed: true, order_index: 1 },
      ],
      resources: [
        { id: 'res-fr-2-1', title: 'Passé Composé vs Imparfait Rules & Practice', url: 'https://www.lawlessfrench.com/grammar/passe-compose-vs-imparfait/', type: 'docs', order_index: 0 },
      ],
    },
  ],
  'roadmap-indie-startup-mvp': [
    {
      id: 'ms-saas-1',
      roadmap_id: 'roadmap-indie-startup-mvp',
      order_index: 0,
      title: 'Customer Discovery & High-Fidelity Prototype',
      description: 'Conducted 20 customer interviews and built clickable prototype in Figma.',
      is_completed: true,
      is_major: false,
      due_date: '2026-06-25',
      completed_at: '2026-06-24T18:00:00Z',
      xp_reward: 200,
      deliverables: [
        { id: 'del-saas-1-1', title: '20 interview summaries synthesized into Pain Point Matrix', is_completed: true, order_index: 0 },
        { id: 'del-saas-1-2', title: 'Interactive Figma prototype with 5 user testing feedback loops', is_completed: true, order_index: 1 },
      ],
      resources: [
        { id: 'res-saas-1-1', title: 'The Mom Test by Rob Fitzpatrick', url: 'https://www.momtestbook.com', type: 'book', order_index: 0 },
      ],
    },
    {
      id: 'ms-saas-2',
      roadmap_id: 'roadmap-indie-startup-mvp',
      order_index: 1,
      title: 'Full Stack Build with Next.js, Supabase & Stripe',
      description: 'Implemented authentication, automated billing webhooks, database RLS, and email alerts.',
      is_completed: true,
      is_major: true,
      due_date: '2026-08-01',
      completed_at: '2026-07-28T22:15:00Z',
      xp_reward: 400,
      deliverables: [
        { id: 'del-saas-2-1', title: 'Supabase Postgres schema with RLS policies enabled', is_completed: true, order_index: 0 },
        { id: 'del-saas-2-2', title: 'Stripe Checkout and Customer Portal integration', is_completed: true, order_index: 1 },
      ],
      resources: [
        { id: 'res-saas-2-1', title: 'Supabase Official Next.js Integration Guide', url: 'https://supabase.com/docs/guides/getting-started/quickstarts/nextjs', type: 'docs', order_index: 0 },
      ],
    },
  ],
};

export const MOCK_CHAT_MESSAGES = [
  {
    id: 'msg-01',
    roadmap_id: 'roadmap-jetpack-compose',
    user_id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
    role: 'user',
    content: 'Hi mentor! I am having trouble understanding when Recomposition happens in Jetpack Compose. Can you explain why my Composable keeps re-rendering?',
    persona: 'tutor',
    created_at: '2026-11-18T14:10:00Z',
  },
  {
    id: 'msg-02',
    roadmap_id: 'roadmap-jetpack-compose',
    user_id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
    role: 'assistant',
    content: `Great question! In Jetpack Compose, **Recomposition** is triggered whenever a **State<T>** read by your composable function changes its value.

Here are the 3 most common culprits for unexpected recompositions:

1. **Unstable Parameters**: If you pass an object whose class is not marked \`@Immutable\` or \`@Stable\` (like standard \`List<T>\`), Compose cannot guarantee it hasn't mutated internally, so it recomposes every time.
   * *Fix*: Use Kotlinx \`ImmutableList\` or wrap items in an \`@Immutable\` data class.

2. **Reading State too High in the Tree**: If you read state at the parent level and pass primitives down, the whole parent recomposes.
   * *Fix*: Pass lambdas or lambda-providers like \`{ count }\` to defer state reading to the actual drawing or layout phase.

3. **Missing \`key()\` in LazyColumn**: Without unique item keys, scrolling or inserting items forces full redraws.

Would you like to review an example with \`derivedStateOf\` to avoid unnecessary calculations?`,
    persona: 'tutor',
    created_at: '2026-11-18T14:10:35Z',
  },
  {
    id: 'msg-03',
    roadmap_id: 'roadmap-jetpack-compose',
    user_id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
    role: 'user',
    content: 'Yes please! How does derivedStateOf compare to simply calculating the value inside the Composable body?',
    persona: 'tutor',
    created_at: '2026-11-18T14:15:00Z',
  },
  {
    id: 'msg-04',
    roadmap_id: 'roadmap-jetpack-compose',
    user_id: 'usr_01h9x8y7z6a5b4c3d2e1f0g9h8',
    role: 'assistant',
    content: `Think of \`derivedStateOf\` as an **intelligent buffer** between high-frequency state updates and low-frequency UI re-renders!

### Without derivedStateOf:
\`\`\`kotlin
// ⚠️ Recomposes EVERY SINGLE PIXEL scrolled!
val isScrolledPastHeader = listState.firstVisibleItemIndex > 0
\`\`\`
Every millisecond during scroll, \`firstVisibleItemIndex\` changes, triggering complete recomposition.

### With derivedStateOf:
\`\`\`kotlin
// ✅ ONLY recomposes when boolean flips true <-> false!
val isScrolledPastHeader by remember {
    derivedStateOf { listState.firstVisibleItemIndex > 0 }
}
\`\`\`

**The Golden Rule:**
Use \`derivedStateOf\` when your state changes *more frequently* than you need your UI to update. For instance: scroll position into boolean toggle, character count into enabled state button!`,
    persona: 'tutor',
    created_at: '2026-11-18T14:16:15Z',
  },
];
