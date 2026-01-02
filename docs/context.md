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

## High-level architecture (target)

This is the intended "locked" architecture. The repo may not yet contain all integrations.

- **Frontend**: Next.js 16 (App Router), React Server Components by default
- **UI**: shadcn/ui (base-maia style) + Base UI primitives, Tailwind CSS v4 (base color: zinc), icons: Phosphor, font: Nunito Sans (target)
- **Backend / State**: Convex (reactive game state)
- **Authentication**: WorkOS
- **Deployment**: Vercel

Note: the current scaffold still uses Next.js template fonts; align to the target font when the game UI is implemented.

### UI Component Baseline (non-negotiable)

The project was initialized with this exact shadcn preset:

```bash
pnpm dlx shadcn@latest create --preset "https://ui.shadcn.com/init?base=base&style=maia&baseColor=zinc&theme=zinc&iconLibrary=phosphor&font=nunito-sans&menuAccent=subtle&menuColor=default&radius=small&template=next" --template next
```

This configures:
- **Style**: `base-maia` (shadcn + Base UI primitives)
- **Base color**: `zinc`
- **Icon library**: `phosphor`
- **Font**: `nunito-sans`
- **Radius**: `small`

**CRITICAL**: All UI components MUST use **Base UI** primitives (`@base-ui/react`), NOT Radix, NOT custom implementations.

- Use Base UI components: https://base-ui.com/react/components/accordion
- shadcn components in this project are built on Base UI, not Radix
- When adding new components, always use `pnpm dlx shadcn@latest add <component>` first
- Only create custom components if no Base UI equivalent exists

### Architectural rules (non-negotiable)

- **No duplicated game logic between views**
- **Views are presentation-only**
- **Game rules live in Convex**
- **No `useEffect` for data flow** (reactive queries + server-first rendering instead)
- **Avoid premature optimization**
- **Avoid real AI integration** until the core loop is proven fun

---

## Current codebase status (what exists today)

The repository currently contains a **minimal Next.js scaffold** (App Router + Tailwind v4 + shadcn configuration). The homepage is still the default template and should be treated as placeholder.

Also note:

- The **product name** is **endg4me**.

---

## Technology stack (current)

| Category            | Technology           | Current in repo |
| ------------------- | -------------------- | --------------- |
| **Framework**       | Next.js (App Router) | ✅              |
| **UI Library**      | React                | ✅              |
| **Language**        | TypeScript           | ✅              |
| **Styling**         | Tailwind CSS v4      | ✅              |
| **UI Components**   | shadcn + Base UI     | ✅              |
| **Icons**           | Phosphor Icons       | ✅              |
| **Package Manager** | pnpm                 | ✅              |
| **Linting**         | ESLint               | ✅              |
| **Backend / State** | Convex               | ⏳ (planned)    |
| **Authentication**  | WorkOS               | ⏳ (planned)    |

### Notable frontend libs

- **@base-ui/react** — **Primary UI primitive library** (all shadcn components use this, NOT Radix)
- **class-variance-authority (CVA)** — Component variants
- **clsx** — Conditional class composition
- **tailwind-merge** — Intelligent Tailwind class merging
- **tw-animate-css** — Animation utilities

> ⚠️ **Important**: This project uses **Base UI** (`@base-ui/react`), not Radix UI. All interactive components (Button, Dialog, Accordion, etc.) must import from Base UI.

---

## Repository structure (current)

```
endg4me/                     # repo folder name (may be renamed later)
├── app/                     # Next.js App Router
│   ├── globals.css          # Tailwind v4 + theme tokens (light/dark)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Route: / (placeholder)
├── docs/
│   └── context.md           # This file
├── public/                  # Static assets
├── components.json          # shadcn/ui configuration
├── eslint.config.mjs        # ESLint flat config (Next.js presets)
├── next.config.ts           # Next.js config (currently minimal)
├── package.json             # scripts + dependencies
├── postcss.config.mjs       # Tailwind/PostCSS config
└── tsconfig.json            # TS config (+ path aliases)
```

### Planned directories (from `components.json` aliases)

- `components/` — Reusable React components
- `components/ui/` — shadcn/ui components
- `lib/` — Utilities/shared logic
- `hooks/` — Custom React hooks (use sparingly; prefer server-first)

When Convex is added, expect a `convex/` folder for game rules and data model.

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

- **Understand the product rules first**: two views, no duplicated game logic, no real AI yet, anti-snowballing matters.
- **Stay server-first**: default to React Server Components; add `"use client"` only when you need interactivity.
- **Treat `app/page.tsx` as placeholder** until the game UI is implemented.
- **Prefer adding UI via shadcn** instead of bespoke components.
- **Keep game logic centralized** (eventually: Convex). UI should not become the rules engine.

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

_Last updated: 2026-01-02_
