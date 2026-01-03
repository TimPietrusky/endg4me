# User Story: Refactor Navigation + Progression (XP/Level + RP) + Remove Reputation (Unified UI)

## Goal

Refactor endg4me so the UI and progression are:

- Easy to understand via 5 clear top-level modes
- Built on only XP/Level + Research Points (RP) + Money
- Free of Reputation (REP removed entirely)
- Consistent across the app with a single source of truth for unlocks/gating
- Able to support: owned trained models → publishing → leaderboards

---

## Top-Level Navigation (New)

Implement exactly these 5 top-level nav items (in this order):

1. operate
2. research
3. lab
4. inbox
5. world

### Rename/migrate existing routes

- Tasks -> operate
- Models -> lab (Models lives inside Lab)
- Messages -> inbox
- Skills -> Milestones (not top-level; accessed via level badge or inside operate/lab)

---

## Progression System (Authoritative Definitions)

### XP / Level (max 20)

Meaning:

- “overall lab growth and capacity”

Earned by:

- Completing jobs (training + research + operations jobs)
- Milestone completions (optional)

Used for:

- Increasing queue slots (parallel job capacity)
- Unlocking visibility of higher-tier categories (soft gating)
- Unlocking access gates that are about “scale” not “knowledge”
  (example: Large-model category becomes visible at Level 12)

Rules:

- XP is never spent
- Level rewards are automatic
- Max level is 20

### Research Points (RP)

Meaning:

- “permanent knowledge / blueprints / capabilities”

Earned by:

- Completing jobs that yield RP (research jobs, some training jobs)

Spent only in:

- research (RP-only)

Used for (permanent unlocks):

- Model blueprints (e.g. LLM 17B blueprint)
- Capability unlocks (new job types / systems)
- Permanent perks/modifiers (simple, readable buffs)

Rules:

- RP purchases are permanent
- RP is never spent outside research
- No “double buy”: RP unlock once, then the unlocked item appears elsewhere

### Money

Meaning:

- “operational budget”

Spent in:

- operate (infra, contracts)
- world (district expansion, world actions)

Rule:

- money buys operations/resources, not knowledge

### Reputation

Reputation is removed entirely:

- no REP in schema/state
- no REP rewards
- no REP gates
- no REP spending

---

## Where Things Live (Non-Negotiable Placement Rules)

### operate (run the lab day-to-day)

Purpose:

- manage the queue and execute jobs
  Contains:
- Queue panel (active + queued jobs; slots used/total; reorder/cancel)
- Job catalog (runnable jobs)
- Money spending panel/tab for infra + contracts

Jobs are the ONLY things that consume:

- queue slots
- time
- compute units (CU, if applicable)
- money (if a job has a cost)

Job completion must:

- apply rewards (XP, RP, money)
- create assets (trained models) when applicable
- generate inbox notifications with deep links

### research (spend RP)

Purpose:

- the RP store and permanent unlock system
  Contains:
- Research Tree (nodes)
- Each node shows:
  - RP cost
  - requirements (min level + prerequisite nodes)
  - unlock outputs (“unlocks job X in operate”, “unlocks action Y in world”, “unlocks blueprint Z for training”)

Research must NOT contain:

- money purchases
- runnable queue jobs

Research unlock must:

- instantly make new content available elsewhere (operate/world/lab)

### lab (your organization / ownership)

Purpose:

- “my lab” identity and owned assets
  Contains at minimum:
- Models inventory (trained model instances)
- Publishing controls (public/private per model)
- People/contracts overview (active + history)
- Lab overview stats (optional)

### inbox (events/offers/notifications)

Purpose:

- player receives the world + system messages
  Contains:
- narrative events
- contract offers
- job completion notifications
- unlock notifications

Inbox items must deep link to:

- operate (run job / queue)
- research (specific node)
- lab (specific trained model)
- world (district, leaderboard, public lab)

### world (global layer)

Purpose:

- districts / factions (if in beta)
- leaderboards
- public labs (view others’ published models)

Leaderboards must use:

- ONLY public models

---

## Model Lifecycle (Blueprints vs Trained Instances)

### Blueprint

Unlocked via:

- Research node purchase (RP)

Represents:

- capability to run a training job for that model family/size

Blueprint visibility:

- can be level-gated (category appears at min level)
- but can only become usable by RP purchase

### Trained Model Instance

Created by:

- completing an operate training job

Stored as an owned asset in:

- lab → Models

Each model instance stores:

- model_instance_id
- blueprint_id / type (LLM/vision/etc.)
- size (e.g., 17B)
- trained_at timestamp
- performance metrics (leaderboard inputs)
- visibility: private/public
- optional: “leaderboard contender” flag or automatically eligible if public

Publishing rules:

- Player can toggle visibility in lab
- Public models:
  - appear on the player’s public lab page (world)
  - are eligible for leaderboards
- Private models:
  - never appear publicly
  - are excluded from leaderboards immediately

---

## Unlock Registry (Single Source of Truth)

Define one authoritative registry (in Convex) that describes:

- unlockable items (jobs, blueprints, perks, world actions)
- requirements (min level, prerequisite research nodes, world state)
- outputs (what becomes available where)

UI rules:

- UI must not reimplement gating logic
- UI reads: “available/locked + lock reason + deep link”

Lock reason rule:

- show exactly one primary reason:
  - requires level X
  - requires research node Y
  - requires world state Z (optional)

Deep link rule:

- every locked card has a “go to…” action:
  - go to node (research)
  - go to job (operate)
  - go to world action (world)

---

## Sync Rules (Must Stay In Sync Everywhere)

### When a research node is purchased

- RP decreases immediately
- unlocked items appear immediately:
  - new jobs in operate
  - new world actions in world
  - new blueprints reflected in lab/research library
- inbox message generated (optional but recommended)

### When a job completes

- queue updates
- rewards applied (XP/RP/money)
- trained model instance created (if relevant)
- lab models list updates
- inbox notification created with deep link to the new model

### When model visibility changes

- public lab page updates instantly
- leaderboard eligibility updates instantly

---

## Example Flow (Level gate + RP unlock + train + publish + leaderboard)

1. Player runs jobs in operate → gains XP + RP
2. Player reaches Level 12 → +1 queue slot and Large Models category becomes visible
3. Player goes to research → buys “LLM 17B Blueprint” for RP
4. operate now shows “Train 17B LLM” job
5. Player runs job; completion creates trained model instance in lab → Models
6. Player sets model to public in lab
7. world shows the model on public lab profile; model is eligible and appears in leaderboards

---

## Refactor Checklist (Implementation)

- Replace top-level nav with: operate / research / lab / inbox / world
- Rename “Messages” to “Inbox”
- Move “Models” from top-level to lab → Models
- Rename “Skills” to “Milestones” (level track) and remove it from top-level
- Remove Reputation from schema/UI/gates/rewards
- Implement Research Tree (RP store) + RP spending mutation
- Implement Unlock Registry in Convex for gating/availability
- Implement trained model inventory + publishing + leaderboard eligibility
- Ensure deep links exist from locked items and inbox items

---

## Acceptance Criteria

1. Top nav exists in order: operate, research, lab, inbox, world
2. Reputation does not exist anywhere (state/schema/UI/gating/rewards)
3. RP is spendable only in research
4. Level-ups (max 20) grant queue slots and other milestone rewards automatically
5. “Milestones” is a level track, not a purchasable skill tree
6. Research Tree unlocks blueprints/capabilities/perks permanently with RP
7. Trained models appear in lab → Models with metrics and visibility toggle
8. Only public models appear on public labs and count for leaderboards
9. All gating logic comes from a single unlock registry (Convex), no duplicated conditions
10. Research purchase, job completion, and visibility toggles keep operate/research/lab/world/inbox in sync instantly
