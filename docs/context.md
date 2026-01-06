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
- **Time-based strategy**: Waiting is strategic, not punitive. Long tasks represent commitment and scale.
- **Anti-snowballing**: Capacity limits, diminishing returns, randomness, and global events prevent domination by 24/7 play or automation.

---

## Game fantasy

You are not "a hacker". You are a **founder of an AI lab** navigating:

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

---

## UI / UX philosophy

- **Terminal aesthetic**: Dark theme with white/monochrome accents, JetBrains Mono font
- **Information density**: Show relevant stats without overwhelming new players
- **Progressive unlocks**: Content reveals as player progresses through research and levels

---

## High-level architecture

- **Frontend**: Next.js 16 (App Router), React Server Components by default
- **UI**: shadcn/ui + Base UI primitives, Tailwind CSS v4, icons: Phosphor
- **3D**: React Three Fiber + Drei for landing page 3D scene
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
- Blueprint-driven model training system
- Research tree with Models, Revenue, Hiring, and Perks

The homepage (`app/page.tsx`) is the landing page with a 3D CRT monitor hero scene. The game uses top-level routes: `/operate`, `/research`, `/lab`, `/inbox`, `/leaderboard`.

### Landing Page (3D CRT Hero)

The landing page features a 3D CRT monitor scene using React Three Fiber:
- CRT model from Poly Haven (CC0, stored in `public/models/crt.glb`)
- HTML overlay on the screen renders logo, slogan, and CTA button
- Responsive camera presets for mobile/tablet/desktop
- WebGL fallback to static hero when unsupported
- Credits page at `/credits` with Poly Haven attribution

### Navigation (5 top-level views)

1. **Operate**: Run the lab day-to-day (queue management, job catalog, run jobs, hire temporary staff)
2. **Research**: Spend RP on all unlocks (Models, Revenue, Hiring, Perks)
3. **Lab**: Your organization/ownership (model inventory, publishing controls, upgrades, team)
4. **Inbox**: Events/offers/notifications with deep links
5. **Leaderboard**: Global layer (leaderboards by model type, public labs)

### Research View Structure

Research is for RP-based unlocks:

1. **Models**: Unlock training for new model types and sizes
2. **Revenue**: Ways to earn money (contracts, freelance work, API income, licensing)
3. **Hiring**: Unlock temporary hire types for boosts (junior researcher, efficiency expert, etc.)
4. **Perks**: Passive bonuses like speed and money multiplier

Each node has:

- RP cost
- Min level requirement
- Prerequisite nodes (must purchase in order)
- Immediate effect on purchase (unlocks blueprints, jobs, or system flags)

### Lab View Structure

Lab is your organization/ownership hub (nested routes under `/lab`):

1. **Upgrades**: Spend UP on queue/staff/compute ranks (`/lab/upgrades`)
2. **Team**: Founder and hired staff roster (`/lab/team`)
3. **Models**: Trained model collection with visibility toggle (`/lab/models`)
4. **Levels**: Level progression table with XP thresholds and UP rewards (`/lab/levels`)

### Progression System

**XP / Level (max 20)**:

- Earned by completing jobs
- **XP resets to 0 on level-up** (overflow carries to next level)
- **Gates access** to research nodes and upgrade ranks
- XP is never spent
- Level-up grants **Upgrade Points (UP)**, not RP

**Upgrade Points (UP)**:

- Earned only from level-ups (+1 UP per level)
- Spent only in Lab > Upgrades for core lab stats:
  - **Queue**: max concurrent jobs (base 1, max rank 8)
  - **Team Size**: max active team members (base 1, max rank 6)
  - **Compute**: compute units for parallel training (base 1, max rank 10)
- 1 UP = 1 rank increase (no cost scaling)
- Higher ranks level-gated to prevent early dumping

**Research Points (RP)**:

- Earned by training jobs and research jobs
- Spent in Research view for all unlocks:
  - **Models**: unlock training for new model types and sizes
  - **Revenue**: contracts, freelance jobs, API income, licensing
  - **Hiring**: temporary staff boosts
  - **Perks**: passive bonuses (speed, money multiplier)

**Money**:

- Operational budget for running jobs
- Starting cash: $1,000
- Spent in Operate (training costs, contracts, hiring)

### Model System (Blueprint-driven)

**Blueprints** define what models can be trained:
- `bp_tts_3b` - 3B TTS (voice model)
- `bp_vlm_7b` - 7B VLM (vision-language model)
- `bp_llm_3b` - 3B LLM (text model)
- `bp_llm_17b` - 17B LLM (stronger text model)

**Model Lifecycle**:
1. **Blueprint**: Unlocked via Research (RP purchase)
2. **Training Job**: Available once blueprint is unlocked
3. **Trained Model**: Created by completing training jobs, scored from blueprint's scoreRange
4. **Versioning**: Each training creates a new version (v1, v2, v3...)
5. **Publishing**: Toggle visibility (public/private) in Lab > Models (available from day one)
6. **Leaderboards**: Only best public model per lab per type counts (no duplicate entries)

**Model UI Patterns**:
- **Operate view**: Training cards show version badge ("v9") and "retrain" button when previously trained
- **Lab > Models**: One card per blueprint (grouped), shows latest version + version count, expandable to see all versions
- **Leaderboard**: One entry per lab per model type, always the highest-scoring public model

**Contract Jobs** use trained models:
- Auto-select best model by score for the required type
- Require both the capability unlock AND at least one trained model of that type

### Job System (Content Catalog)

All jobs are defined in `convex/lib/contentCatalog.ts`:

**Training Jobs**: Create new model versions
- `job_train_tts_3b` (2 min, 50 XP, 125 RP), `job_train_vlm_7b`, `job_train_llm_3b`, `job_train_llm_17b`

**Contract Jobs**: Earn money using trained models
- `job_contract_blog_basic` (uses LLM)
- `job_contract_voice_pack` (uses TTS)
- `job_contract_image_qa` (uses VLM)

**Revenue Jobs**: Freelance work, no models needed
- `job_income_basic_website` (level 1, $200 + 30 XP)
- `job_income_api_integration` (level 3, $400 + 50 XP)

**Hire Jobs**: Temporary boosts to lab stats, cost money
- `job_hire_junior_researcher` (level 2, +1 queue, 8 min, $300)
- `job_hire_optimization_specialist` (level 3, +15% speed, 10 min, $1000)
- `job_hire_hr_manager` (level 5, +1 staff, 15 min, $500)
- `job_hire_business_partner` (level 6, +25% money multiplier, 15 min, $900)
- `job_hire_senior_engineer` (level 10, +1 compute, 20 min, $1500)

**Research Job**: Always available RP trickle
- `job_research_literature`

### Unlock System

Player unlocks are tracked in `playerUnlocks` table:
- `unlockedBlueprintIds`: Which blueprints can be trained
- `unlockedJobIds`: Which jobs can be started
- `enabledSystemFlags`: System features like `model_api_income`

Free starter unlocks (0 RP, level 1):
- `rn_cap_contracts_basic` - Basic blog contracts (monetization)
- `rn_bp_unlock_tts_3b` - 3B TTS blueprint (model)
- `rn_income_basic_website` - Basic website gigs (income)

### Settings Panel

The settings panel is accessed via a gear icon in the top nav. It contains:

- **Profile**: User name and founder type badge
- **Organization**: Lab name and team roster (founder + hired employees)
- **Sign out**: Always visible at bottom

---

## Technology stack

| Category            | Technology           | Status |
| ------------------- | -------------------- | ------ |
| **Framework**       | Next.js (App Router) | Active |
| **UI Library**      | React                | Active |
| **Language**        | TypeScript           | Active |
| **Styling**         | Tailwind CSS v4      | Active |
| **UI Components**   | shadcn + Base UI     | Active |
| **Icons**           | Phosphor Icons       | Active |
| **Package Manager** | pnpm                 | Active |
| **Linting**         | ESLint               | Active |
| **Backend / State** | Convex               | Active |
| **Authentication**  | WorkOS               | Active |

### Notable frontend libs

- **@base-ui/react** — **Primary UI primitive library** (all shadcn components use this, NOT Radix)
- **@react-three/fiber** — React renderer for Three.js (3D scenes)
- **@react-three/drei** — Useful helpers for R3F (useGLTF, Html, etc.)
- **class-variance-authority (CVA)** — Component variants
- **clsx** — Conditional class composition
- **tailwind-merge** — Intelligent Tailwind class merging
- **tw-animate-css** — Animation utilities

> **Important**: This project uses **Base UI** (`@base-ui/react`), not Radix UI. All interactive components (Button, Dialog, Accordion, etc.) must import from Base UI.

---

## Repository structure

```
endg4me/
├── app/
│   ├── (game)/              # Protected game routes (route group)
│   │   ├── layout.tsx       # Auth + Convex + GameDataProvider + GameShell
│   │   ├── page.tsx         # Redirects to /operate
│   │   ├── operate/page.tsx # TasksView (day-to-day operations)
│   │   ├── research/page.tsx # PerkTree (RP spending)
│   │   ├── lab/
│   │   │   ├── layout.tsx   # Lab header + sub-nav
│   │   │   ├── page.tsx     # Redirects to /lab/upgrades
│   │   │   ├── upgrades/page.tsx # UpgradesView (UP spending)
│   │   │   ├── team/page.tsx     # TeamView (roster)
│   │   │   ├── models/page.tsx   # CollectionView (trained models)
│   │   │   └── levels/page.tsx   # LevelsView (XP/UP progression)
│   │   ├── inbox/page.tsx   # MsgsView (notifications)
│   │   └── leaderboard/page.tsx # LabsLeaderboard + ModelsLeaderboard
│   ├── api/                 # API routes (auth callbacks)
│   ├── globals.css          # Terminal theme (white accent)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── game/
│   │   ├── dashboard/       # View components (TasksView, PerkTree, etc.)
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
│       ├── contentCatalog.ts # Central content catalog (blueprints, jobs, research nodes)
│       ├── gameConfig.ts     # Game balance constants (XP, UP, upgrades)
│       ├── gameConstants.ts  # Task definitions (legacy)
│       └── skillTree.ts      # Perk nodes (legacy, now in contentCatalog)
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
- **Routes are top-level**: `/operate`, `/research`, `/lab`, `/inbox`, `/world`.
- **Content lives in contentCatalog.ts**: Blueprints, jobs, and research nodes are defined in one place.
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

_Last updated: 2026-01-06 (Lab Stats Architecture)_

---

## Architecture Decisions (012 Lab Stats & Founder Simplification)

- **5 Lab Stats**: Queue, Compute, Speed, Money Multiplier, Staff - single source of truth
- **Multiple sources feed into stats**: UP ranks (permanent), Founder (permanent), Hires (temporary)
- **Founder simplification**: Technical = +25% Speed only, Business = +50% Money Multiplier only
- **Removed founder abilities**: modelScore, moneyRewards, hiringSpeed (dead code)
- **FOUNDER_BONUSES config**: Single config mapping founder type to lab stat bonuses
- **Hires reworked**: 5 hires, one per lab stat:
  - Junior Researcher (+1 Queue)
  - Optimization Specialist (+15% Speed)
  - HR Manager (+1 Staff)
  - Business Partner (+25% Money Multiplier)
  - Senior Engineer (+1 Compute)
- **Removed**: Efficiency Expert (XP boost doesn't map to lab stats)
- **Upgrades view breakdown**: Shows total + sources (UP rank, Founder, Hires)
- **getUpgradeDetails query**: Returns breakdown per source for UI display
- **getActiveHires query**: Returns active hire jobs with stat contributions

## Architecture Decisions (011 Model Versioning UI)

- **Aggregated model view**: Lab > Models shows one card per blueprint, not per version
- **Card data**: Latest version number, total version count, best score across all versions
- **Expandable versions**: Click card to reveal all versions with individual visibility toggles
- **Training state indicator**: Operate shows version badge ("v9") on cards for previously trained models
- **Retrain button**: Training cards show "retrain" instead of "train" when model has versions
- **Leaderboard deduplication**: Only best-scoring public model per lab per type appears on leaderboard
- **New queries**: `getAggregatedModels` (grouped by blueprint), `getTrainingHistory` (summary per blueprint)
- **Action type extended**: Added `latestVersion`, `versionCount`, `bestScore` to Action interface

## Architecture Decisions (010 Speed + Money Multiplier Rework)

- **Speed renamed from Research Speed**: Generic speed bonus that applies to ALL timed operations (training, operate jobs, research)
- **Speed upgrades**: Purchased with UP in Lab > Upgrades (5 ranks, +5% per rank)
- **Founder speed bonus**: Technical founder gets +25% speed (Business gets none)
- **Money Multiplier expanded scope**: Now affects both costs and rewards
  - **Reduces costs**: Job money costs are divided by multiplier
  - **Increases income**: Money rewards are multiplied by multiplier
- **Founder money bonus**: Business founder gets +50% money multiplier (Technical gets none)
- **DB fields renamed**: `researchSpeedBonus` -> `speedBonus`, `researchSpeedRank` -> `speedRank`
- **Icon change**: Speed now uses Clock icon (was Lightning)

## Architecture Decisions (009 SpendButton Component)

- **Unified action button**: `SpendButton` component in `components/game/dashboard/spend-button.tsx`
- **Four states**: ready (clickable), confirm (yes/no), active (progress bar), disabled (with reason)
- **Configurable attributes**: Array of `SpendAttribute` with type, value, and isGain flag
- **Attribute types**: time, cash, gpu, rp, xp, up - each with its icon
- **Shortfall display**: Shows "need X more" for insufficient resources
- **Used by**: ActionCard (Operate), PerkTree (Research), UpgradesView (Lab)
- **Timed vs instant**: duration/remainingTime props for progress bar, omit for instant actions
- **Confirmation toggle**: `showConfirmation` prop (default true, false for Upgrades)
- **Time Warp aware**: `speedFactor` prop for accelerated progress display

## Architecture Decisions (008 Dev Time Warp)

- **Time Warp**: Dev-only feature to accelerate all timed jobs for testing
- **Server-enforced**: Only users in `DEV_ADMIN_USER_EMAILS` env allowlist can use Time Warp
- **Allowed scales**: 1x (normal), 5x, 20x, 100x
- **Per-user setting**: Each dev user can independently set their time scale
- **Effective time**: All job timing uses `getEffectiveNow()` instead of `Date.now()`
- **Scheduler sync**: Job completion scheduled at real wall-clock time accounting for warp
- **No gameplay changes for normal players**: Time Warp controls hidden from non-dev users
- **New table**: `devUserSettings` stores per-user time scale and warp baselines
- **UI location**: Settings panel shows Time Warp controls for dev admins only

## Architecture Decisions (007 Research Categories & Hiring)

- **Research categories consolidated**: Models, Revenue, Hiring, Perks (merged Monetization + Income into Revenue)
- **Hiring system**: Research unlocks hire types, Operate lets you hire for temporary boosts
- **Hire types**: Each hire boosts one lab stat (see 012 for current list)
- **Hire mechanic**: Jobs with duration, cost money, no cooldown - can re-hire immediately after expiry
- **Starting cash reduced**: $1,000 (was $5,000) for tighter early-game economy
- **3B TTS rebalanced**: 2 min duration (was 5), 50 XP (was 80), 125 RP (was 120)
- **Clan feature dormant**: Notification removed, backend exists but UI not connected

## Architecture Decisions (006 Leaderboard Day One)

- **Leaderboard available from day one**: No level or research gating
- **Publishing available from day one**: Toggle visibility (public/private) without research unlock
- **Lab Score**: Ranking metric = (level x 100) + sum(best public model scores) + (upgrade ranks x 20)
- **Neighbors slice**: Leaderboard shows 20 above + you + 20 below (41 rows max)
- **Two leaderboard views**: Labs (default, by Lab Score) and Models (by type: LLM/TTS/VLM)
- **Materialized leaderboard**: `worldLeaderboard` and `worldBestModels` tables for fast queries
- **Sync on activity**: Leaderboard updates when player levels up, upgrades, trains, or toggles visibility
- **Only public models count**: Lab Score and model rankings only consider public models

## Architecture Decisions (005 Playable MVP)

- **Content Catalog**: Single source of truth for blueprints, jobs, and research nodes in `convex/lib/contentCatalog.ts`
- **Blueprint-driven models**: Models are typed (LLM/TTS/VLM) with scoreRange-based scoring
- **Model versioning**: Each training creates a new version of the blueprint
- **Research unlocks**: Purchasing research nodes unlocks blueprints, jobs, and system flags
- **Contract jobs**: Require both capability unlock AND trained model of the required type
- **Leaderboards by type**: World view filters by LLM/TTS/VLM
- **Milestone inbox events**: Triggered on first level-up, first research, first model, level 5

## Architecture Decisions (004 Upgrade Points System)

- **Two upgrade currencies**: UP (from leveling) for core lab stats, RP (from jobs) for unlocks
- **UP on level up**: Each level grants +1 UP (not RP). Total 19 UP available by level 20
- **Lab upgrades via UP**: Queue, Staff, Compute purchased in Lab > Upgrades (1 UP = 1 rank)
- **Level-gated ranks**: Higher upgrade ranks unlock at higher levels (prevents early-game dumping)
- **Hard caps**: Queue max 8, Staff max 6, Compute max 10 - players must specialize
- **Central config**: All game constants live in `convex/lib/gameConfig.ts`
- **Lab sub-nav**: upgrades | team | models | levels (nested routes)

## Architecture Decisions (003 Route-based Navigation)

- **Top-level routes**: Views are real Next.js routes (`/operate`, `/research`, `/lab`, `/inbox`, `/leaderboard`)
- **Route group**: `(game)` provides shared layout without adding URL segment
- **GameDataProvider**: All Convex queries live in provider, persist across route changes
- **GameShell**: Handles loading states, founder selection, wraps TopNav
- **Link-based nav**: TopNav uses `<Link>` + `usePathname()` instead of state
- **Browser history**: Back/forward navigation works, URLs are bookmarkable/shareable
- **Subscription persistence**: Convex subscriptions stay alive in layout, no re-fetch on navigation
- **Compute as blocking resource**: Training tasks consume Compute. With 1 CU and 1 training running, cannot start another training even if queue allows.

## Repository Structure (Key Files)

- `components/game/dashboard/spend-button.tsx` — Unified action button component (states: ready/confirm/active/disabled)
- `components/game/dashboard/action-card.tsx` — Job card wrapper using SpendButton
- `convex/lib/contentCatalog.ts` — Central source of truth for blueprints, jobs, research nodes, inbox events
- `convex/lib/gameConfig.ts` — XP per-level requirements, UP system, upgrade definitions
- `convex/lib/gameConstants.ts` — Legacy task definitions (kept for backwards compatibility)
- `convex/tasks.ts` — Job mutations/queries (startJob, completeTask, getAvailableJobs)
- `convex/research.ts` — Research mutations/queries (purchaseResearchNode, getResearchTreeState)
- `convex/leaderboard.ts` — Leaderboard sync and slice queries (Lab Score, neighbors)
- `convex/dev.ts` — Dev tools (Time Warp, game reset utilities)
- `convex/schema.ts` — Database schema (trainedModels, playerUnlocks, playerResearch, worldLeaderboard, worldBestModels, devUserSettings)

Note: Game config lives in `convex/lib/` because Convex functions need direct access. Frontend imports via `@/convex/lib/contentCatalog`.
