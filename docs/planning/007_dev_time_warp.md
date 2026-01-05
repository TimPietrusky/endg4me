User Story: Dev-only Time Warp (speed up all timed jobs) + optional dev actions

## Goal

During development/testing, I can speed up time for **all timed systems** (training, revenue jobs, contracts, research tasks, etc.) without changing the normal gameplay UI/flow.

- Primary feature: **Time Warp** (time speed multiplier)

All dev tools must be **server-enforced** so there is no backdoor for real players.

---

## Scope

### Applies to everything that uses time

Any feature that relies on job duration / countdown / completion timing must respect Time Warp, including:

- model training
- revenue/contract jobs
- research jobs
- any future timed tasks

No separate “cheat versions” of jobs. The same logic runs, only time moves faster for the allowed dev user(s).

---

## Core Rules

### 1) Time Warp is dev-only and server-controlled

- Time Warp is only available when the authenticated user is allowed by a server-side check.
- Allowed dev users are defined via env allowlist:
  - `DEV_ADMIN_USER_EMAILS="userA@email.com,userB@example.de"`
- Additionally, Time Warp should be disabled automatically in production unless explicitly allowed (recommended safeguard).

### 2) Time Warp is per-user

- Each dev user can enable/disable Time Warp for their own account.
- Default is `1x` (normal speed).

### 3) No gameplay/UI differences for normal players

- Normal players never see Time Warp controls.
- Normal players are unaffected and cannot enable it via client-side calls.

---

## Data Model

### `devUserSettings` (new table)

Per user:

- `userId`
- `timeScale` (number; allowed values only)
- `warpEnabledAtRealMs` (number | null)
- `warpEnabledAtEffectiveMs` (number | null)
- `updatedAt`

Defaults:

- if no record exists → `timeScale = 1` and warp baseline fields are null

### Allowed `timeScale` values

Keep it simple:

- `1x` (normal)
- `5x`
- `20x`
- `100x`

---

## Implementation: Single source of truth for “now”

Introduce a single helper used everywhere that computes “effective time”.

### Helper functions (server)

- `isDevAdmin(ctx): boolean`
  - checks auth + `DEV_ADMIN_USER_EMAILS` allowlist (+ optional `NODE_ENV !== "production"` safeguard)
- `getTimeScale(ctx): number`
  - returns user’s `timeScale` if `isDevAdmin(ctx)` else `1`
- `getEffectiveNow(ctx): number`
  - compute stable time-warped now:
    - `realNow = Date.now()`
    - if `timeScale === 1` or baseline null → return `realNow`
    - else:
      - `effectiveNow = warpEnabledAtEffectiveMs + (realNow - warpEnabledAtRealMs) * timeScale`

### Toggle behavior (important)

To avoid timer jumps when changing scale:

- When switching from `1x` → `Nx`:
  - set `warpEnabledAtRealMs = realNow`
  - set `warpEnabledAtEffectiveMs = realNow`
- When switching between `Nx` → `Mx`:
  - compute current `effectiveNow` using old baseline, then:
    - set `warpEnabledAtRealMs = realNow`
    - set `warpEnabledAtEffectiveMs = effectiveNow`
- When switching to `1x`:
  - set `timeScale = 1`
  - set baseline fields to null

---

## Job Timing: How timed jobs must be evaluated

All job timing logic must use `effectiveNow`, not `Date.now()` directly.

### Standard job fields (existing or implied)

For each job/task:

- `startedAtMs`
- `durationMs`
- `completedAtMs?`

### Completion check

A job is complete if:

- `effectiveNow >= startedAtMs + durationMs`

### Remaining time

- `remainingMs = max(0, (startedAtMs + durationMs) - effectiveNow)`

This same logic must be used for:

- job lists
- job detail view
- backend completion handlers
- any revenue payout logic that relies on time windows

---

## API (Convex) changes

### Queries

- `getDevSettings()`
  - returns `{ allowed: boolean, timeScale: number }`
  - `allowed` is true only if `isDevAdmin(ctx)` is true
- Any existing job query that returns timing should return either:
  - `remainingMs` computed using `effectiveNow` (preferred), OR
  - `effectiveNow` so the client can compute remaining time consistently

### Mutations

- `setTimeScale(timeScale)`
  - dev-only; validates allowlist
  - allowed values only (1, 5, 20, 100)
  - updates baseline fields as described above

### Completion processing

Wherever job completion is processed:

- it must evaluate completion using `effectiveNow`
- and it must run the same reward/model generation logic as normal completion

---

## UI changes (minimal)

- Add a small dev-only panel (e.g. Settings) shown only when `getDevSettings().allowed === true`
- UI control: “Time Warp” dropdown with `1x / 5x / 20x / 100x`
- No other UI changes required (jobs simply finish faster).

---

## Acceptance Criteria

1. Normal players:

- never see Time Warp controls
- never experience accelerated timers
- cannot enable it via direct mutation calls

2. Dev allowlisted user:

- can set Time Warp to 1x/5x/20x/100x
- all timed jobs (training + revenue jobs + research jobs) complete faster accordingly
- switching scale does not cause timer glitches or negative remaining time

3. Consistency:

- job completion uses the same logic path as normal completion (same rewards, model creation, leaderboard updates, etc.)
- time calculations are centralized (no scattered `Date.now()` logic in job timing)
