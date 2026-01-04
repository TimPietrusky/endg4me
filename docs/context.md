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

1. **Research** (RP - permanent unlocks)
2. **People** (staff capacity)
3. **Infrastructure** (compute/GPUs)
4. **XP/Level** (overall lab growth, max level 20)
5. **Money** (operational budget)
6. **Time** (strategic waiting)

**Note**: Reputation has been removed from the game. Progression now uses XP/Level + RP + Money only.

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

- **Style**: Terminal-inspired dark theme with white accent
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

- Terminal-inspired design (white accent, JetBrains Mono font)
- Five main views: Operate, Research, Lab, Inbox, World
- Action cards with images and progress visualization
- Convex-powered reactive state
- WorkOS authentication
- Settings panel (slide-out sheet) with Profile, Organization/Team, and Sign out
- Level-based milestone system (max level 20)

The homepage (`app/page.tsx`) is the landing page. The game uses top-level routes: `/operate`, `/research`, `/lab`, `/inbox`, `/world`.

### Navigation (5 top-level views)

1. **Operate**: Run the lab day-to-day (queue management, job catalog, run jobs)
2. **Research**: Spend RP on permanent unlocks (blueprints, capabilities, perks)
3. **Lab**: Your organization/ownership (model inventory, publishing controls, people)
4. **Inbox**: Events/offers/notifications with deep links
5. **World**: Global layer (leaderboards, public labs)

### Progression System

**XP / Level (max 20)**:

- Earned by completing jobs
- Grants automatic rewards: queue slots, GPU capacity, staff capacity
- Gates visibility of higher-tier content (e.g., Large Models at L12)
- XP is never spent

**Research Points (RP)**:

- Earned by training jobs and research jobs
- Spent only in Research view for permanent unlocks
- Unlocks blueprints, new job types, perks

**Money**:

- Operational budget for running jobs
- Spent in Operate (infra, contracts) and World (district expansion)

### Model Lifecycle

1. **Blueprint**: Unlocked via Research (RP purchase)
2. **Trained Model**: Created by completing training jobs in Operate
3. **Publishing**: Toggle visibility (public/private) in Lab
4. **Leaderboards**: Only public models count

### Unlock Registry

All gating logic lives in Convex (`unlockRegistry` table). UI reads availability status from the registry - no duplicated conditions.

### Settings Panel

The settings panel is accessed via a gear icon in the top nav. It contains:

- **Profile**: User name and founder type badge
- **Organization**: Lab name and team roster (founder + hired employees)
- **Sign out**: Always visible at bottom

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
│   ├── (game)/              # Protected game routes (route group)
│   │   ├── layout.tsx       # Auth + Convex + GameDataProvider + GameShell
│   │   ├── page.tsx         # Redirects to /operate
│   │   ├── operate/page.tsx # TasksView (day-to-day operations)
│   │   ├── research/page.tsx # ResearchView (RP spending)
│   │   ├── lab/page.tsx     # CollectionView (models, organization)
│   │   ├── inbox/page.tsx   # MsgsView (notifications)
│   │   └── world/page.tsx   # WorldView (leaderboards)
│   ├── api/                 # API routes (auth callbacks)
│   ├── globals.css          # Terminal theme (white accent)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── game/
│   │   ├── dashboard/       # View components (TasksView, ResearchView, etc.)
│   │   ├── game-shell.tsx   # Layout wrapper with TopNav + loading states
│   │   ├── game-top-nav.tsx # Navigation with Link-based routing
│   │   ├── founder-selection.tsx
│   │   └── ...
│   ├── ui/                  # shadcn components
│   └── providers/
│       ├── convex-provider.tsx
│       └── game-data-provider.tsx # GameDataContext (shared state)
├── convex/                  # Game logic and data model
│   ├── schema.ts            # Database schema
│   ├── tasks.ts             # Task/job mutations/queries
│   ├── research.ts          # Research tree mutations/queries
│   ├── labs.ts              # Lab operations
│   └── lib/
│       ├── gameConstants.ts # Game balance constants
│       └── skillTree.ts     # Level milestone definitions (1-20)
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
- **Routes are top-level**: `/operate`, `/research`, `/lab`, `/inbox`, `/world` (not nested under `/play`).
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

_Last updated: 2026-01-04 (route-based navigation)_

---

## Architecture Decisions (002 Progression Refactor)

- **Reputation removed**: No REP in schema, rewards, or gating
- **5-tab navigation**: operate / research / lab / inbox / world
- **Max level 20**: Extended XP curve with milestone rewards
- **RP spending**: Only in Research view (permanent unlocks)
- **Model visibility**: trainedModels have public/private toggle
- **Leaderboards**: Only count public models
- **Unlock Registry**: Single source of truth in Convex for all gating
- **Deep links**: Inbox notifications link to relevant views

## Architecture Decisions (003 Route-based Navigation)

- **Top-level routes**: Views are real Next.js routes (`/operate`, `/research`, `/lab`, `/inbox`, `/world`)
- **Route group**: `(game)` provides shared layout without adding URL segment
- **GameDataProvider**: All Convex queries live in provider, persist across route changes
- **GameShell**: Handles loading states, founder selection, wraps TopNav
- **Link-based nav**: TopNav uses `<Link>` + `usePathname()` instead of state
- **Browser history**: Back/forward navigation works, URLs are bookmarkable/shareable
- **Subscription persistence**: Convex subscriptions stay alive in layout, no re-fetch on navigation
- **Unified Navigation**: PageHeader + SubNav system for consistent navigation across all views. SubNav is view-specific and optional. First SubNav element has no left padding to align with logo.
- **Compute Units as blocking resource**: Training tasks consume Compute Units (CU). With 1 CU and 1 training running, cannot start another training even if queue allows. Action cards display CU cost after cash in the attribute grid.
