## endg4me — Shared Project Context

> This document is the shared onboarding + architecture context for first-time contributors, developers, and AI agents working on **endg4me** (EndGame).

---

## What this project is

**endg4me** is a browser-based **strategy / management game** inspired by classic browser games like HackTheNet, adapted to the modern AI ecosystem.

Players run an **AI lab** (or AI company) and compete globally to become the most advanced lab and eventually reach **AGI**. The game focuses on:

- **AI research progression**
- **Infrastructure and compute advantage**
- **Hiring and organizational scaling**
- **Indirect competition** via leaderboards and markets
- **Long-term strategic decisions** rather than twitch gameplay

The game should be playable in short sessions while supporting long-term progression.

---

## Core design principles

- **System-first, not AI-first**: The game must be fun and balanced without using real AI. AI may be added later for narrative/flavor, not core mechanics.
- **Progress feels fast early, slow later**: Early progression is intentionally fast; later progression slows down and requires planning.
- **Progressive disclosure**: New players see a simplified interface; advanced players unlock a dense dashboard.
- **Time-based strategy**: Waiting is strategic, not punitive. Long tasks represent commitment and scale.
- **Anti-snowballing**: Capacity limits, diminishing returns, randomness, and global events prevent domination by 24/7 play or automation.

---

## Game fantasy

You are not “a hacker”. You are a **founder of an AI lab** navigating:

- **Research tradeoffs**
- **Infrastructure bets**
- **Talent scaling**
- **Hype cycles**
- **Competition**

Power comes from **systems**, not clicks.

---

## Core game pillars

1. **Research**
2. **People**
3. **Infrastructure**
4. **Reputation**
5. **Time**

---

## UI / UX philosophy

### Two views (same game logic)

- **Simple View**

  - Default
  - Shows only what can be done **right now**
  - Minimal stats
  - No future systems visible

- **Advanced View**
  - Unlockable
  - Full system visibility
  - Dense dashboard

**Important**: both views must operate on the **same underlying game logic**. Views are presentation-only.

---

## High-level architecture

- **Frontend**: Next.js 16 (App Router), React Server Components by default
- **UI**: shadcn/ui + Base UI primitives, Tailwind CSS v4, icons: Phosphor
- **Dashboard Font**: JetBrains Mono (terminal aesthetic)
- **Backend / State**: Convex (reactive game state)
- **Authentication**: WorkOS
- **Deployment**: Vercel

### UI Component Baseline

- **Style**: Terminal-inspired dark theme with cyan accent
- **Base color**: Custom dark palette (oklch)
- **Icon library**: Phosphor
- **Font**: JetBrains Mono (dashboard), Geist (landing)
- **Radius**: Small (0.125rem)

**CRITICAL**: UI components should use **Base UI** primitives (`@base-ui/react`) where available.

- Use Base UI components: https://base-ui.com/react/components/accordion
- When adding new components, use `pnpm dlx shadcn@latest add <component>` first
- Exception: Toast uses Radix (`@radix-ui/react-toast`) as Base UI has no equivalent

### Architectural rules (non-negotiable)

- **No duplicated game logic between views**
- **Views are presentation-only**
- **Game rules live in Convex**
- **No `useEffect` for data flow** (reactive queries + server-first rendering instead)
- **Avoid premature optimization**
- **Avoid real AI integration** until the core loop is proven fun

---

## Current codebase status

The game dashboard is **fully implemented** with:
- Terminal-inspired design (cyan accent, JetBrains Mono font)
- Four main views: Tasks, Models, Messages, Skills
- Action cards with images and progress visualization
- Convex-powered reactive state
- WorkOS authentication
- Settings panel (slide-out sheet) with Profile, Organization/Team, and Sign out
- Skill tree system for level progression

The homepage (`app/page.tsx`) is the landing page. The game lives at `/play`.

### Skill Tree

Click the level badge in the top nav to open the skill tree. It shows:
- **Snake pattern grid**: Levels 1-5 left-to-right, levels 6-10 right-to-left (connected path)
- **Level status**: Completed (cyan), current (white/pulsing), locked (dim)
- **Detail panel**: Click any level to see stats and unlocks

**Progression unlocks** (defined in `convex/lib/skillTree.ts`):
- **Capacity**: Queue slots (0→5), parallel tasks (1→3), staff capacity (2→6)
- **Infrastructure**: Compute units/GPUs (1→5)
- **Research**: Model sizes (3B→405B), AGI research at level 10
- **Income**: Freelance (L1), Government contracts (L7), Research partnerships (L9)
- **Social**: Clans (L3), Leaderboards (Weekly L5, Monthly L7, All-time L9)

### Settings Panel

The settings panel is accessed via a gear icon in the top nav. It contains:
- **Profile**: User name and founder type badge
- **Organization**: Lab name and team roster (founder + hired employees)
- **Sign out**: Always visible at bottom

Team members are displayed with their role. Hired junior researchers will appear here alongside the founder.

---

## Technology stack

| Category            | Technology           | Status |
| ------------------- | -------------------- | ------ |
| **Framework**       | Next.js (App Router) | ✅     |
| **UI Library**      | React                | ✅     |
| **Language**        | TypeScript           | ✅     |
| **Styling**         | Tailwind CSS v4      | ✅     |
| **UI Components**   | shadcn + Base UI     | ✅     |
| **Icons**           | Phosphor Icons       | ✅     |
| **Package Manager** | pnpm                 | ✅     |
| **Linting**         | ESLint               | ✅     |
| **Backend / State** | Convex               | ✅     |
| **Authentication**  | WorkOS               | ✅     |

### Notable frontend libs

- **@base-ui/react** — **Primary UI primitive library** (all shadcn components use this, NOT Radix)
- **class-variance-authority (CVA)** — Component variants
- **clsx** — Conditional class composition
- **tailwind-merge** — Intelligent Tailwind class merging
- **tw-animate-css** — Animation utilities

> ⚠️ **Important**: This project uses **Base UI** (`@base-ui/react`), not Radix UI. All interactive components (Button, Dialog, Accordion, etc.) must import from Base UI.

---

## Repository structure

```
endg4me/
├── app/
│   ├── (game)/              # Protected game routes
│   │   ├── layout.tsx       # Auth check + Convex provider
│   │   └── play/page.tsx    # Main game dashboard
│   ├── api/                 # API routes (auth callbacks)
│   ├── globals.css          # Terminal theme (cyan accent)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── game/
│   │   ├── dashboard/       # Dashboard view components
│   │   ├── lab-dashboard.tsx
│   │   ├── founder-selection.tsx
│   │   └── ...
│   ├── ui/                  # shadcn components
│   └── providers/           # Context providers
├── convex/                  # Game logic and data model
│   ├── schema.ts            # Database schema
│   ├── tasks.ts             # Task mutations/queries
│   ├── labs.ts              # Lab operations
│   └── lib/gameConstants.ts # Game balance constants
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities
│   ├── game-types.ts        # TypeScript types for game
│   └── utils.ts             # Helper functions
├── design/                  # Reference designs (not deployed)
└── docs/                    # Documentation
```

---

## Development workflow

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm

### Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```

### Adding UI components (shadcn/ui + Base UI)

Always add components via shadcn first (they use Base UI primitives):

```bash
pnpm dlx shadcn@latest add button dialog accordion progress
```

Available Base UI components: https://base-ui.com/react/components/accordion

If you need a component that exists in Base UI but not in shadcn, import directly:

```tsx
import { Accordion } from "@base-ui/react/accordion";
```

---

## Path aliases

Configured in `tsconfig.json` (and shadcn `components.json`):

- `@/*` → project root
- `@/components/*` → `components/*`
- `@/components/ui/*` → `components/ui/*`
- `@/lib/*` → `lib/*`
- `@/hooks/*` → `hooks/*`

---

## First-time contributor checklist

- **Understand the product rules**: no duplicated game logic, no real AI yet, anti-snowballing matters.
- **Stay server-first**: default to React Server Components; add `"use client"` only when you need interactivity.
- **Game logic lives in Convex**: UI is presentation-only.
- **Dashboard at `/play`**: requires authentication, uses terminal-style design.
- **Prefer adding UI via shadcn** instead of bespoke components.

---

## Reference links

- [Next.js docs](https://nextjs.org/docs)
- [React docs](https://react.dev)
- [Tailwind CSS docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Base UI components](https://base-ui.com/react/components/accordion) — **Primary primitive library**
- [Convex](https://docs.convex.dev)
- [WorkOS](https://workos.com/docs)
- [Phosphor Icons](https://phosphoricons.com)

---

_Last updated: 2026-01-03_
