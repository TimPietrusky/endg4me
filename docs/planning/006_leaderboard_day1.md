# 006_world_leaderboard_day1.md
User Story: Leaderboard is available from Day 1 + “neighbors” slice (±20)

## Goal
As a player, I can open **Leaderboard** from day one and immediately compare my progress with other players:
- show my position on a global leaderboard
- show a **slice** around my rank: **20 players above + me + 20 players below**
- no research gating for World or publishing

This makes the game feel social and competitive instantly.

---

## Core Rules

### World accessibility
- **Leaderboard is always available** (no level / research gating).
- Leaderboard is a read-only view (no actions besides filtering/switching views).

### Publishing availability
- **Model publishing (public/private) is available from day one**.
- Default for new models is **Private**.
- Switching a model version to **Public** makes it eligible for Leaderboards immediately.

---

## What Leaderboard shows (MVP)

### Leaderboard has 2 sections (tabs)
1) **Labs** (default)
2) **Models**

This keeps the mental model simple:
- “Labs” = compare overall progression
- “Models” = compare best public models

---

## Labs leaderboard (default)

### Ranking metric: Lab Score
Leaderboard → Labs ranks players by **Lab Score** (descending).

#### Lab Score definition (simple + stable)
Lab Score is deterministic and derived from what the player has achieved so far:

- `labScore =`
  - `levelScore` + `modelScore` + `upgradeScore`

Where:
- `levelScore = playerLevel * 100`
- `modelScore = sum(bestPublicModelScoreByType)`
  - types: `llm`, `tts`, `vlm`
  - if player has no public model for a type, score is 0 for that type
- `upgradeScore = (queueRank + staffRank + computeRank) * 20`

**Hard rules**
- Use **only public** model scores for `modelScore`.
- If a player has zero public models, they still have a Lab Score based on level + upgrades, so they still appear.

> These weights are intentionally simple and editable later. The important part is: it’s stable, readable, and rewards both leveling and publishing.

### View content
The Labs leaderboard row shows:
- rank number
- lab name (or player handle)
- level
- lab score
- best public model highlights (optional small badges): `LLM 72`, `TTS 65`, `VLM 80`

### “Neighbors slice” requirement
Instead of loading the entire leaderboard, Leaderboard shows:
- **20 players immediately above me**
- **me**
- **20 players immediately below me**

Total: 41 rows (unless near the top/bottom).

#### If the player is not ranked yet (first-time edge case)
If the player has no stored lab profile record, create one on first load so the rank exists.

---

## Models leaderboard

### Purpose
Compare my **best public model** against others, per model type.

### Ranking metric: Model Score
For each model type (`llm`, `tts`, `vlm`):
- rank by the **best public model score** for that type (descending)
- each lab contributes at most 1 entry per type (their best public version)

### View content
Models leaderboard row shows:
- rank
- lab name
- model name (e.g. `7B VLM`)
- score
- version (optional)

### “Neighbors slice” requirement
Same slice logic:
- 20 above / me / 20 below (relative to my best public model of the selected type)

#### If the player has no public model for that type
Show:
- a small empty state: “publish a {type} model to get ranked”
- still display the **top 41** entries globally for that type (so the page isn’t empty)

---

## Backend / Data Requirements (Convex)

### Derived vs stored
For MVP:
- Lab Score can be **computed on demand** from player state, but leaderboard queries need ordering.
- To keep it fast and simple, store a materialized leaderboard record per player and keep it in sync.

### New table (recommended)
`worldLeaderboard`
- `playerId`
- `labName`
- `level`
- `labScore` (number)
- `bestPublicScores`: `{ llm?: number, tts?: number, vlm?: number }`
- `updatedAt`

And optionally for model leaderboards:
`worldBestModels`
- key `(playerId, type)`
- `type`: `llm|tts|vlm`
- `blueprintId`
- `modelName`
- `score`
- `version`
- `updatedAt`

### Sync rules (keep everything consistent)
Update leaderboard records when any of these change:
- player levels up
- lab upgrades ranks change (queue/staff/compute)
- a model version changes public/private
- a new model version is trained (and becomes the best public for its type)

**Hard rule:** “best public model” is the maximum score among public versions for that type.

---

## Query API (what the frontend calls)

### 1) Labs neighbors slice
`getLabLeaderboardSlice() -> { rows: LeaderboardRow[], myRank: number }`

Requirements:
- determine `myRank` in the sorted dataset (`labScore desc`, tie-breaker by `updatedAt desc`, then `playerId`)
- return exactly 20 above + self + 20 below when possible

### 2) Models neighbors slice
`getModelLeaderboardSlice(type) -> { rows: ModelRow[], myRank?: number }`

- If I have a public model of `type`, return 20 above + self + 20 below.
- Otherwise return top 41 globally.

---

## UI Requirements

### Leaderboard → Labs (default)
- shows slice around me (41 rows)
- highlights my row
- includes small “how score works” tooltip:
  - “score = level + upgrades + best public models”

### Leaderboard → Models
- type selector: `LLM / TTS / VLM`
- shows slice around my best public model (or top list if none)
- CTA if none: “go to lab → models to publish”

---

## Acceptance Criteria
1) Leaderboard is accessible from day one (no gating).
2) Publishing is available from day one (no research unlock required).
3) Labs leaderboard shows 20 above + me + 20 below, highlights my row.
4) Labs leaderboard rank is based on the defined Lab Score using **public models only**.
5) Models leaderboard supports LLM/TTS/VLM views with the same neighbors slice behavior.
6) If player has no public model for a selected type, Leaderboard shows top 41 and an instruction to publish.
7) Leaderboards update automatically when:
   - level changes
   - upgrades change
   - models are trained
   - model visibility changes

---

## Context.md updates (remove outdated info)

### Remove / rewrite these parts
- Any statement that **Leaderboard is gated** by level, research, districts, or other unlocks (Leaderboard is day-one).
- Any statement that **publishing is a research/capability unlock** (publishing is day-one).
- Any text implying “players can’t participate in leaderboards early” (they can from level 1).

### Add / replace with this truth
- “Leaderboard is available from day one and shows a neighbors slice (±20) around your rank.”
- “Publishing is available from day one; only **public** models count toward leaderboards.”
