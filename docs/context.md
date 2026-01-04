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
- Research tree with Models, Capabilities, and Perks

The homepage (`app/page.tsx`) is the landing page. The game uses top-level routes: `/operate`, `/research`, `/lab`, `/inbox`, `/world`.

### Navigation (5 top-level views)

1. **Operate**: Run the lab day-to-day (queue management, job catalog, run jobs)
2. **Research**: Spend RP on all unlocks (Models, Capabilities, Perks)
3. **Lab**: Your organization/ownership (model inventory, publishing controls, upgrades, team)
4. **Inbox**: Events/offers/notifications with deep links
5. **World**: Global layer (leaderboards by model type, public labs)

### Research View Structure

Research is for RP-based unlocks:

1. **Models**: Unlock training for new model types and sizes
2. **Capabilities**: Job types, features, world actions (unlock contract jobs, publishing, API income)
3. **Perks**: Passive bonuses like research speed and income boost

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
  - **Staff**: max active hires (base 1, max rank 6)
  - **Compute**: compute units for parallel training (base 1, max rank 10)
- 1 UP = 1 rank increase (no cost scaling)
- Higher ranks level-gated to prevent early dumping

**Research Points (RP)**:

- Earned by training jobs and research jobs
- Spent in Research view for all unlocks:
  - **Models**: unlock training for new model types and sizes
  - **Capabilities**: new job types, features, system flags
  - **Perks**: passive bonuses (research speed, money multiplier)

**Money**:

- Operational budget for running jobs
- Spent in Operate (training costs, contracts)

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
5. **Publishing**: Toggle visibility (public/private) in Lab > Models (requires publishing capability)
6. **Leaderboards**: Only public models count, grouped by type (LLM/TTS/VLM)

**Contract Jobs** use trained models:
- Auto-select best model by score for the required type
- Require both the capability unlock AND at least one trained model of that type

### Job System (Content Catalog)

All jobs are defined in `convex/lib/contentCatalog.ts`:

**Training Jobs**: Create new model versions
- `job_train_tts_3b`, `job_train_vlm_7b`, `job_train_llm_3b`, `job_train_llm_17b`

**Contract Jobs**: Earn money using trained models
- `job_contract_blog_basic` (uses LLM)
- `job_contract_voice_pack` (uses TTS)
- `job_contract_image_qa` (uses VLM)

**Research Job**: Always available RP trickle
- `job_research_literature`

### Unlock System

Player unlocks are tracked in `playerUnlocks` table:
- `unlockedBlueprintIds`: Which blueprints can be trained
- `unlockedJobIds`: Which jobs can be started
- `enabledSystemFlags`: System features like `publishing`, `model_api_income`

Free starter unlocks (0 RP, level 1):
- `rn_cap_contracts_basic` - Basic blog contracts
- `rn_bp_unlock_tts_3b` - 3B TTS blueprint

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

_Last updated: 2026-01-04 (Playable MVP: blueprint-driven models, content catalog, research unlocks)_

---

## Architecture Decisions (005 Playable MVP)

- **Content Catalog**: Single source of truth for blueprints, jobs, and research nodes in `convex/lib/contentCatalog.ts`
- **Blueprint-driven models**: Models are typed (LLM/TTS/VLM) with scoreRange-based scoring
- **Model versioning**: Each training creates a new version of the blueprint
- **Research unlocks**: Purchasing research nodes unlocks blueprints, jobs, and system flags
- **Contract jobs**: Require both capability unlock AND trained model of the required type
- **Publishing gated**: Must unlock "Model Publishing" capability to publish models
- **Leaderboards by type**: World view filters by LLM/TTS/VLM
- **Milestone inbox events**: Triggered on first level-up, first research, first model, publishing unlock, level 5

## Architecture Decisions (004 Upgrade Points System)

- **Two upgrade currencies**: UP (from leveling) for core lab stats, RP (from jobs) for unlocks
- **UP on level up**: Each level grants +1 UP (not RP). Total 19 UP available by level 20
- **Lab upgrades via UP**: Queue, Staff, Compute purchased in Lab > Upgrades (1 UP = 1 rank)
- **Level-gated ranks**: Higher upgrade ranks unlock at higher levels (prevents early-game dumping)
- **Hard caps**: Queue max 8, Staff max 6, Compute max 10 - players must specialize
- **Central config**: All game constants live in `convex/lib/gameConfig.ts`
- **Lab sub-nav**: upgrades | team | models | levels (nested routes)

## Architecture Decisions (003 Route-based Navigation)

- **Top-level routes**: Views are real Next.js routes (`/operate`, `/research`, `/lab`, `/inbox`, `/world`)
- **Route group**: `(game)` provides shared layout without adding URL segment
- **GameDataProvider**: All Convex queries live in provider, persist across route changes
- **GameShell**: Handles loading states, founder selection, wraps TopNav
- **Link-based nav**: TopNav uses `<Link>` + `usePathname()` instead of state
- **Browser history**: Back/forward navigation works, URLs are bookmarkable/shareable
- **Subscription persistence**: Convex subscriptions stay alive in layout, no re-fetch on navigation
- **Compute as blocking resource**: Training tasks consume Compute. With 1 CU and 1 training running, cannot start another training even if queue allows.

## Repository Structure (Key Files)

- `convex/lib/contentCatalog.ts` — Central source of truth for blueprints, jobs, research nodes, inbox events
- `convex/lib/gameConfig.ts` — XP per-level requirements, UP system, upgrade definitions
- `convex/lib/gameConstants.ts` — Legacy task definitions (kept for backwards compatibility)
- `convex/tasks.ts` — Job mutations/queries (startJob, completeTask, getAvailableJobs)
- `convex/research.ts` — Research mutations/queries (purchaseResearchNode, getResearchTreeState)
- `convex/schema.ts` — Database schema (trainedModels, playerUnlocks, playerResearch)

Note: Game config lives in `convex/lib/` because Convex functions need direct access. Frontend imports via `@/convex/lib/contentCatalog`.
