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
2. **Research**: Spend RP on all upgrades (Attributes, Blueprints, Capabilities, Perks)
3. **Lab**: Your organization/ownership (model inventory, publishing controls, people)
4. **Inbox**: Events/offers/notifications with deep links
5. **World**: Global layer (leaderboards, public labs)

### Research View Structure (Cyberpunk-inspired)

Research is for RP-based unlocks (global stats moved to Lab > Upgrades):

1. **Blueprints**: Model training capabilities (branching tree)
2. **Capabilities**: Job types, features, world actions (branching tree)
3. **Perks**: Passive bonuses like research speed and income boost (branching tree)

Each node has:

- RP cost
- Min level requirement
- Prerequisite nodes (must purchase in order)
- Immediate effect on purchase

### Lab View Structure

Lab is your organization/ownership hub (nested routes under `/lab`):

1. **Upgrades**: Spend UP on queue/staff/compute ranks (`/lab/upgrades`)
2. **Team**: Founder and hired staff roster (`/lab/team`)
3. **Models**: Trained model collection with visibility toggle (`/lab/models`)
4. **Levels**: Level progression table with XP thresholds and UP rewards (`/lab/levels`)

### Progression System

**XP / Level (max 20)**:

- Earned by completing jobs
- **Gates access** to research nodes and upgrade ranks
- XP is never spent
- Level-up grants **Upgrade Points (UP)**, not RP

**Upgrade Points (UP)**:

- Earned only from level-ups (+1 UP per level)
- Spent only in Lab > Upgrades for core lab stats:
  - **Queue**: max concurrent jobs (base 1, max rank 8)
  - **Staff**: max active hires (base 1, max rank 6)
  - **Compute**: compute units for parallel training (base 1, max rank 10)
- 1 UP = 1 rank increase (no cost scaling)
- Higher ranks level-gated to prevent early dumping

**Research Points (RP)**:

- Earned by training jobs and research jobs
- Spent in Research view for perks only:
  - **Blueprints**: model training capabilities
  - **Capabilities**: new job types, features
  - **Perks**: passive bonuses (research speed, money multiplier)

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
│   │   ├── lab/
│   │   │   ├── layout.tsx   # Lab header + sub-nav
│   │   │   ├── page.tsx     # Redirects to /lab/upgrades
│   │   │   ├── upgrades/page.tsx # UpgradesView (UP spending)
│   │   │   ├── team/page.tsx     # TeamView (roster)
│   │   │   ├── models/page.tsx   # CollectionView (trained models)
│   │   │   └── levels/page.tsx   # LevelsView (XP/UP progression)
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
│       └── skillTree.ts     # Attribute nodes, XP requirements (no auto rewards)
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities
│   ├── game-types.ts        # TypeScript types for game
│   └── utils.ts             # Helper functions
├── scripts/                 # CLI utilities
│   └── generate-image.mjs   # AI image generation for game assets
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

## Asset Generation (CLI utility)

Use `scripts/generate-image.mjs` to generate game assets (action card backgrounds, UI elements, etc.) via RunPod AI.

```bash
# Show help
node scripts/generate-image.mjs --help

# Generate an image
node scripts/generate-image.mjs --prompt "cyberpunk AI datacenter with neon lights"

# With options
node scripts/generate-image.mjs -p "futuristic lab interior" -a 16:9 -o lab-background.jpg
```

**Options:**
- `--prompt, -p` — Image description (required)
- `--output, -o` — Output filename (default: auto-generated timestamp)
- `--aspect, -a` — Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4 (default: 16:9)
- `--seed, -s` — Seed for reproducibility

**Output:** Images are saved to `public/` folder.

**Environment:** Requires `RUNPOD_API_KEY` in `.env.local` (or `.env` as fallback).

---

_Last updated: 2026-01-04 (asset generation utility)_

---

## Architecture Decisions (002 Progression Refactor)

- **Reputation removed**: No REP in schema, rewards, or gating
- **5-tab navigation**: operate / research / lab / inbox / world
- **Max level 20**: Extended XP curve, level gates access to nodes
- **Model visibility**: trainedModels have public/private toggle
- **Leaderboards**: Only count public models
- **Unlock Registry**: Single source of truth in Convex for all gating
- **Deep links**: Inbox notifications link to relevant views

## Architecture Decisions (004 Upgrade Points System)

- **Two upgrade currencies**: UP (from leveling) for core lab stats, RP (from jobs) for perks
- **UP on level up**: Each level grants +1 UP (not RP). Total 19 UP available by level 20
- **Lab upgrades via UP**: Queue, Staff, Compute purchased in Lab > Upgrades (1 UP = 1 rank)
- **RP perks only**: Research speed and money multiplier remain as RP purchases in Research > Perks
- **Level-gated ranks**: Higher upgrade ranks unlock at higher levels (prevents early-game dumping)
- **Hard caps**: Queue max 8, Staff max 6, Compute max 10 - players must specialize
- **Central config**: All game constants live in `convex/lib/gameConfig.ts`
- **Lab sub-nav**: upgrades | team | models | levels (nested routes)
- **Levels view**: Shows XP thresholds and UP rewards per level
- **Research simplified**: Attributes tab removed, only Blueprints | Capabilities | Perks

## Architecture Decisions (003 Route-based Navigation)

- **Top-level routes**: Views are real Next.js routes (`/operate`, `/research`, `/lab`, `/inbox`, `/world`)
- **Route group**: `(game)` provides shared layout without adding URL segment
- **GameDataProvider**: All Convex queries live in provider, persist across route changes
- **GameShell**: Handles loading states, founder selection, wraps TopNav
- **Link-based nav**: TopNav uses `<Link>` + `usePathname()` instead of state
- **Browser history**: Back/forward navigation works, URLs are bookmarkable/shareable
- **Subscription persistence**: Convex subscriptions stay alive in layout, no re-fetch on navigation
- **Unified Navigation**: PageHeader + SubNav system for consistent navigation across all views. SubNav is view-specific and optional. First SubNav element has no left padding to align with logo.
- **Compute as blocking resource**: Training tasks consume Compute. With 1 CU and 1 training running, cannot start another training even if queue allows.

## Repository Structure (Key Files)

- `convex/lib/gameConfig.ts` — Central source of truth for XP thresholds, UP system, upgrade definitions
- `convex/lib/gameConstants.ts` — Task definitions (imports from gameConfig)
- `convex/lib/skillTree.ts` — RP perk nodes (research_speed, money_multiplier only)
- `convex/upgrades.ts` — UP balance and upgrade rank queries/mutations
- `convex/schema.ts` — Database schema (playerState has upgradePoints, queueRank, staffRank, computeRank)

Note: Game config lives in `convex/lib/` because Convex functions need direct access. Frontend imports via `@/convex/lib/gameConfig`.
