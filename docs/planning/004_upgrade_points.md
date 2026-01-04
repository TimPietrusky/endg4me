# User Story: Lab Upgrades with Upgrade Points (UP) — 1 UP = 1 Rank + Default Caps/Values (Central Config)

## Goal

Introduce **Upgrade Points (UP)** as the predictable currency for global lab upgrades:

- Players earn **UP only from leveling up**
- Players spend **UP only in `lab → upgrades`**
- **1 UP always buys exactly 1 upgrade rank** (no cost scaling)
- Balance is enforced via **max ranks** and **level-gated rank availability**
- Research remains **RP-only** (blueprints/capabilities/perks)
- Milestones shows UP gained per level
- Default values/caps are defined in a **single static central config** so they’re easy to edit

Bonuses (green %) come from founder/hires/perks, never from levels.

---

## Definitions

### XP / Level (max 20)

- XP comes from completing jobs.
- When reaching XP threshold, player levels up.
- Level-up grants **UP only**.

### Upgrade Points (UP)

- Earned only from level-ups.
- Visible only on `lab → upgrades`.
- Spent only on global lab upgrades.
- **1 UP = +1 rank** on a chosen upgrade.

### Research Points (RP)

- Earned from research jobs.
- Spent only in `research`.
- Unlocks blueprints/capabilities/perks.

---

## Navigation / Placement Rules

### `lab` (top-level)

Subpages:

- overview (read-only)
- upgrades (spend UP)
- team
- models
- milestones (level table)

### `research` (top-level)

Tabs:

- blueprints
- capabilities
- perks

Hard rule:

- Research must not contain UP or global lab upgrades.

---

## Central Static Config (Single Source of Truth)

All defaults and caps for leveling + lab upgrades must live in one static, editable place.

### Requirements

- One file/module defines:
  - max level (20)
  - XP thresholds per level
  - UP granted per level
  - lab upgrade definitions:
    - base value
    - value per rank
    - max rank
    - level requirement per rank band
- The rest of the app reads these values (no duplicated numbers in UI).

### Suggested file location/name (adjust to your repo conventions)

- `convex/lib/gameConfig.ts`
  - exports `GAME_CONFIG`

---

## Default Progression Values (Editable)

### Max Level

- `MAX_LEVEL = 20`

### UP per Level

- `UP_PER_LEVEL = 1`
- Total UP available by level 20: **20 UP**

### XP Thresholds (Simple Curve)

Use a predictable increasing curve (editable). Example:

- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 220 XP
- Level 4: 360 XP
- Level 5: 520 XP
- Level 6: 700 XP
- Level 7: 900 XP
- Level 8: 1120 XP
- Level 9: 1360 XP
- Level 10: 1620 XP
- Level 11: 1900 XP
- Level 12: 2200 XP
- Level 13: 2520 XP
- Level 14: 2860 XP
- Level 15: 3220 XP
- Level 16: 3600 XP
- Level 17: 4000 XP
- Level 18: 4420 XP
- Level 19: 4860 XP
- Level 20: 5320 XP

(Exact curve is tunable; these are sane starter numbers for a beta.)

---

## Lab Upgrades (Global Stats)

### Upgrade Cards

1. **queue** — max concurrent jobs
2. **staff** — max active hires/boosts
3. **compute** — total GPU capacity budget (jobs + API serving)

### 1 UP = 1 Rank Rule

- Clicking upgrade spends exactly **1 UP** and increases the rank by 1.

### Caps (Max Ranks)

We enforce hard caps so upgrades don’t get out of hand:

- `queue.maxRank = 8`
- `staff.maxRank = 6`
- `compute.maxRank = 10`

These caps are designed so players must choose:

- With 20 UP total, they can’t max everything.
- They can specialize (queue-heavy, compute-heavy, etc.).

### Rank Values (Defaults)

Define base values + per-rank increments:

#### Queue

- `queue.base = 1`
- `queue.perRank = +1`
- Rank → Slots:
  - Rank 0: 1 slot (starting)
  - Rank 1: 2
  - Rank 2: 3
  - ...
  - Rank 8: 9 (cap)

This makes queue feel powerful but not infinite.

#### Staff

- `staff.base = 0` (starting hires allowed)
- `staff.perRank = +1`
- Rank → Active hires:
  - Rank 0: 0 hires
  - Rank 1: 1
  - ...
  - Rank 6: 6 (cap)

This keeps hires meaningful and paced.

#### Compute (GPU Capacity Budget)

Compute should be a single number used by:

- training jobs
- work jobs
- API serving reservation

- `compute.base = 100`
- `compute.perRank = +50`
- Rank → Total capacity:
  - Rank 0: 100
  - Rank 1: 150
  - ...
  - Rank 10: 600 (cap)

This is a strong scaling lever and ties into your “serve + train in parallel” loop.

---

## Level-Gated Rank Availability (Required)

Even with caps, players could dump early UP into one stat.
We keep 1 UP = 1 rank but unlock higher ranks only after certain levels.

### Default gating bands

Applies to all three upgrades (unless overridden per upgrade):

- Ranks 0–2 unlocked at Level 1+
- Ranks 3–4 unlocked at Level 6+
- Ranks 5–6 unlocked at Level 11+
- Ranks 7–10 unlocked at Level 16+

So:

- Early game: you can reach Rank 2 quickly
- Mid game: you unlock Rank 4
- Late game: you can push higher

UI must show:

- “next rank unlocks at level X” if locked.

---

## Compute Usage Model (For Consistency)

Track compute as:

- `compute_total` (from upgrade rank + modifiers)
- `compute_reserved_serving`
- `compute_in_use_jobs`
- `compute_available = total - reserved_serving - in_use_jobs`

Compute upgrades increase `compute_total`.

---

## UI Requirements

### `lab → upgrades`

- Shows only here:
  - UP balance (e.g., “upgrade points: 2”)
- Each upgrade card shows:
  - current rank / max rank
  - current value / next value
  - upgrade button (spend 1 UP)
  - lock reason if next rank is not available (level gate or max rank)

### `lab → milestones`

- Each level row shows:
  - XP threshold
  - **UP reward: +1**

### Operate integration

- Operate uses queue slots from `queue` upgrade.
- Operate shows compute breakdown using compute totals.

---

## Backend / State Requirements

- UP balance stored per player.
- Upgrade ranks stored per player:
  - `queue_rank`
  - `staff_rank`
  - `compute_rank`
- All derived values (slots, staff cap, compute total) are computed from config + rank + modifiers.

---

## Migration Tasks

1. Remove `research → attributes`
2. Add `lab → upgrades` page with UP-based upgrades
3. Move Level view to `lab → milestones` and show UP rewards
4. Ensure queue/staff/compute values are read from the new upgrade ranks

---

## Acceptance Criteria

1. Level-ups grant **UP only** (default +1 per level).
2. UP is visible only in `lab → upgrades` (not top nav).
3. Each upgrade click costs exactly 1 UP and increases rank by exactly 1.
4. Queue/staff/compute have hard caps and cannot exceed max rank.
5. Higher ranks are locked behind level bands and show clear unlock levels in UI.
6. `lab → milestones` shows UP reward per level.
7. Research remains RP-only (blueprints/capabilities/perks).
8. All defaults (XP curve, UP per level, caps, rank values, gating) live in one central static config file and can be edited easily.
9. Upgrades update the game immediately across operate/lab/inbox/world without refresh.
