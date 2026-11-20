---
name: Milestone AI Design System
description: Technical, dark-first design system for adaptive learning blueprints and curriculum generation
colors:
  canvas: "#0b0f17"
  surface: "#121824"
  surface-elevated: "#1a2332"
  surface-border: "#242f42"
  surface-border-subtle: "#192231"
  surface-hover: "#3b4c68"
  surface-elevated-border: "#2e3d54"
  card-hover-bg: "#141c2b"
  text-white: "#ffffff"
  text-primary: "#f8fafc"
  text-secondary: "#e2e8f0"
  text-slate-300: "#cbd5e1"
  text-muted: "#94a3b8"
  text-dim: "#64748b"
  brand: "#2563eb"
  brand-hover: "#1d4ed8"
  brand-focus: "#3b82f6"
  brand-subtle: "rgba(37, 99, 235, 0.12)"
  signal-emerald: "#10b981"
  signal-amber: "#f59e0b"
  signal-rose: "#f43f5e"
  signal-cyan: "#06b6d4"
  signal-purple: "#8b5cf6"
  shadow-base: "rgba(0, 0, 0, 0.45)"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  heading-1:
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  heading-2:
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  heading-3:
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  body:
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.011em"
  body-sm:
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  caption:
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  micro:
    fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  mono:
    fontFamily: "'JetBrains Mono', SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
  mono-sm:
    fontFamily: "'JetBrains Mono', SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.text-white}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Milestone AI Design System

## Overview
Milestone AI is a technical learning system built for self-directed builders. The interface uses a dark-first canvas (`#0b0f17`) with purposeful illumination, high-contrast typography, and disciplined visual hierarchy. It avoids category clichés (no rainbow gradient text, no eyebrow kickers, no decorative blur halos, no arbitrary 3-column identical card grids) in favor of editorial clarity, structured workflows, and verified progress.

## Colors
The palette is calibrated for high legibility under prolonged technical study:
- **Canvas (`#0b0f17`)**: Deep neutral void, zero color pollution.
- **Surface (`#121824`)**: Elevated container base with minimum 4.5:1 contrast against text.
- **Surface Elevated (`#1a2332`)**: Interactive cards, active milestone steps, and floating panels.
- **Borders (`#242f42` / `#192231`)**: Defined spatial boundaries without heavy outlines.
- **Brand (`#2563eb` / `#1d4ed8`)**: Decisive interactive blue used strictly for primary intents and active states.
- **Signal Colors**:
  - `signal-emerald` (`#10b981`): Verified competence, completed deliverables, passing quizzes.
  - `signal-amber` (`#f59e0b`): In-progress state, overload warnings, pacing alerts.
  - `signal-cyan` (`#06b6d4`): AI diagnostic reasoning, mentor stream indicators.
  - `signal-purple` (`#8b5cf6`): XP rewards, roadmap milestones.
  - `signal-rose` (`#f43f5e`): Errors, failed quiz attempts, reset destructive actions.

## Typography
Type is driven by two families loaded with zero layout shift:
- **Display & Headings (`Plus Jakarta Sans`)**: Tight negative letter-spacing (`-0.02em` to `-0.03em`), bold weight (700/800), balanced line wraps. Never wrapped with eyebrow kickers.
- **Body & Controls (`Plus Jakarta Sans`)**: Regular/Medium (400/500), line measure bounded at 65–75ch for optimal reading ergonomics.
- **Technical & Metrics (`JetBrains Mono`)**: Tabular figures (`tnum`) for XP, month counts, milestone dates, code samples, and CLI prompts.

## Layout
- **Rhythm**: Spacing follows an 8px grid (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`). Generous breathing room between sections (>48px) with tight grouping inside components (<16px).
- **Asymmetric Composition**: Replaces identical 3-card grids with structured focal points: primary hero demonstration, multi-column interactive timeline, and split-pane mentor workspace.
- **Viewport Resilience**: Responsive fluid breakpoints from 360px mobile viewports through 1440px+ ultra-wide workspaces.

## Elevation & Depth
- Elevation is achieved via tonal surface stepping (`#0b0f17` → `#121824` → `#1a2332`) paired with 1px subtle borders (`#242f42`).
- Shadows carry soft vertical offsets (`box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.45)`). No hard zero-blur comic book drop shadows and no decorative neon halos.

## Shapes
- Outer cards and modal containers use `16px` (`rounded-2xl`).
- Buttons, inputs, and list items use `10px` (`rounded-xl`).
- Badges, status pills, and tags use `6px` or `9999px` (`rounded-full`).

## Components
- **Buttons**:
  - `Primary`: Solid brand blue with crisp white text, active spring press (`scale: 0.98`), visible focus ring.
  - `Secondary`: Elevated surface with subtle border, high-contrast hover state.
  - `Ghost / Icon`: Clean touch target (min 40x40px), no background until hovered.
- **Milestone Cards**: Distinctive sequential timeline nodes with active progress indicator, verified gate badge, and expandable deliverables checklist.
- **Quiz Gate Modal**: Accessible multi-step assessment modal with distinct option selection, immediate conceptual feedback, and XP unlock celebration.
- **AI Mentor Workspace**: Split conversational interface with persona switcher, active roadmap context banner, and markdown streaming bubbles.

## Do's and Don'ts
### Do's:
- Do balance headings and let them speak without redundant eyebrow kickers.
- Do use tabular numbers (`font-mono`) for all statistics, XP, dates, and percentages.
- Do provide distinct hover, active, focus-visible, and disabled states on every interactive element.
- Do keep body paragraphs within 65–75 characters per line for optimal reading ergonomics.
- Do use real SVG icons with matching 1.75px/2px stroke weights.

### Don'ts:
- Don't use rainbow or gradient text.
- Don't use decorative colored halos with zero blur.
- Don't nest cards inside identical cards.
- Don't place one-sided borders down the edge of cards.
- Don't use raw emoji or unicode symbols where a consistent vector icon belongs.
