User Story: Make **endg4me** fully playable (MVP content pack + progression wiring)

## Goal

Ship a version of the game that is **actually playable and progressable**:

- a new player can start, run jobs, earn **XP / Money / RP**, level up, spend **UP** in **Lab → Upgrades**, spend **RP** in **Research**, unlock new jobs/models, train models, see them in **Lab → Models**, publish models, and see results in **World**.
- Research is **not empty** and clearly communicates when content is locked by level/prereqs.

This user story is designed to work with the current code layout:

- **Central config** (`gameConfig.ts`, `gameConstants.ts`, `skillTree.ts`)
- **Convex** queries/mutations (`tasks.ts`, `research.ts`)
- Current nav concept: **Operate / Research / Lab / Inbox / World**

---

## Non-goals (for this MVP)

- No real ML training/inference (all simulation)
- No reputation system
- No “simple vs advanced view” split
- No complex economy balancing beyond the defaults here (tune later in config)

---

## Core Rules (must be true everywhere)

### Currencies

- **XP**: earned from jobs; only used to increase **Level**.
- **Level (max 20)**: gates visibility/unlocks; leveling grants **UP only**.
- **UP (Upgrade Points)**: **only** earned from leveling; **only** spent in **Lab → Upgrades**; **1 UP = +1 rank**.
- **RP (Research Points)**: earned from research/training jobs; **only** spent in **Research** on research nodes.
- **Money**: earned from jobs + passive income; spent to start jobs.

### No hidden progression

- Research nodes must be visible (locked or available), never “missing”.
- Locked nodes must show **why**: needs level / missing prereq / insufficient RP.

---

## Central “Content Catalog” (single source of truth)

Create/extend a single static module that defines everything below (so you can tune it without touching game logic).

### New file

- `convex/lib/contentCatalog.ts`

### It exports

1. `MODEL_BLUEPRINTS`
2. `JOB_DEFS` (Operate jobs)
3. `RESEARCH_NODES` (Blueprints + Capabilities + Perks)
4. (Optional) `INBOX_EVENTS` (small MVP set)
5. (Optional) `WORLD_LEADERBOARD_DEFS` (simple MVP)

**Hard rule:** all IDs referenced across systems come from here.

---

## Models (Blueprints)

Use **simple names**. Each has a 1-sentence description and a few metrics.

> NOTE: You currently already simulate “Train Small Model (3B)” and “Train Medium Model (7B)”.
> For MVP: keep those existing task IDs, but map them to **real, typed blueprints** instead of generic “small_3b / medium_7b”.

### Blueprint schema (static)

- `id` (string, stable)
- `name` (e.g. `3B TTS`)
- `type` (`llm` | `tts` | `vlm`)
- `description` (one sentence)
- `minLevelToTrain`
- `trainingJobId` (references `JOB_DEFS`)
- `scoreRange` (min/max)
- `tags` (optional)

### Default blueprint list (MVP)

1. **bp_tts_3b**

- name: `3B TTS`
- type: `tts`
- description: `A small voice model for audio gigs.`
- minLevelToTrain: 1
- scoreRange: 40–70

2. **bp_vlm_7b**

- name: `7B VLM`
- type: `vlm`
- description: `A vision-language model for image understanding contracts.`
- minLevelToTrain: 2
- scoreRange: 55–85

3. **bp_llm_3b**

- name: `3B LLM`
- type: `llm`
- description: `A small text model for basic writing work.`
- minLevelToTrain: 3
- scoreRange: 45–75

4. **bp_llm_17b**

- name: `17B LLM`
- type: `llm`
- description: `A stronger text model that wins premium contracts.`
- minLevelToTrain: 7
- scoreRange: 65–95

---

## Research (RP spending)

Research is **RP-only** and must contain three sections:

- **Blueprints** (unlock what can be trained)
- **Capabilities** (unlock what job types exist)
- **Perks** (passive modifiers)

### Research node schema

- `nodeId`
- `category`: `blueprint` | `capability` | `perk`
- `name`
- `description` (one sentence)
- `costRP`
- `minLevel`
- `prerequisiteNodes: string[]`
- `unlocks` (structured outputs; see below)

### Unlock output rules

A research node must have explicit outputs:

- `unlocksBlueprintIds?: string[]`
- `unlocksJobIds?: string[]`
- `enablesSystemFlags?: string[]` (e.g. `model_api_income`, `publishing`)
- `perkType?: "research_speed" | "money_multiplier"` (existing perk system)

### Default Research nodes (MVP)

#### Starter (so Research is never dead)

1. **rn_cap_contracts_basic**

- category: capability
- name: `basic contracts`
- description: `Unlock simple paid contracts in Operate.`
- costRP: 0
- minLevel: 1
- prereqs: []
- unlocksJobIds: `job_contract_blog_basic`

2. **rn_bp_unlock_tts_3b**

- category: blueprint
- name: `3b tts blueprint`
- description: `Unlock training for 3B TTS.`
- costRP: 0
- minLevel: 1
- prereqs: []
- unlocksBlueprintIds: `bp_tts_3b`
- unlocksJobIds: `job_train_tts_3b`

3. **rn_perk_research_speed_1**

- category: perk
- name: `research speed i`
- description: `Earn research points a bit faster.`
- costRP: 120
- minLevel: 1
- prereqs: []
- perkType: `research_speed`

#### Early progression

4. **rn_bp_unlock_vlm_7b**

- category: blueprint
- name: `7b vlm blueprint`
- description: `Unlock training for 7B VLM.`
- costRP: 250
- minLevel: 2
- prereqs: []
- unlocksBlueprintIds: `bp_vlm_7b`
- unlocksJobIds: `job_train_vlm_7b`

5. **rn_cap_contracts_voice**

- category: capability
- name: `voice gigs`
- description: `Unlock audio contracts that use your TTS models.`
- costRP: 200
- minLevel: 2
- prereqs: []
- unlocksJobIds: `job_contract_voice_pack`

6. **rn_cap_contracts_vision**

- category: capability
- name: `vision contracts`
- description: `Unlock image QA contracts that use your VLM models.`
- costRP: 220
- minLevel: 3
- prereqs: []
- unlocksJobIds: `job_contract_image_qa`

7. **rn_bp_unlock_llm_3b**

- category: blueprint
- name: `3b llm blueprint`
- description: `Unlock training for 3B LLM.`
- costRP: 350
- minLevel: 3
- prereqs: []
- unlocksBlueprintIds: `bp_llm_3b`
- unlocksJobIds: `job_train_llm_3b`

8. **rn_perk_money_multiplier_1**

- category: perk
- name: `payout booster i`
- description: `Earn a bit more money from contracts.`
- costRP: 180
- minLevel: 3
- prereqs: []
- perkType: `money_multiplier`

#### Mid-game hooks

9. **rn_bp_unlock_llm_17b**

- category: blueprint
- name: `17b llm blueprint`
- description: `Unlock training for 17B LLM.`
- costRP: 900
- minLevel: 7
- prereqs: [`rn_bp_unlock_llm_3b`]
- unlocksBlueprintIds: `bp_llm_17b`
- unlocksJobIds: `job_train_llm_17b`

10. **rn_cap_model_publishing**

- category: capability
- name: `model publishing`
- description: `Publish models to the public lab and world rankings.`
- costRP: 250
- minLevel: 4
- prereqs: []
- enablesSystemFlags: [`publishing`]

11. **rn_cap_model_api_income**

- category: capability
- name: `model api income`
- description: `Earn passive money from hosted model APIs.`
- costRP: 350
- minLevel: 5
- prereqs: []
- enablesSystemFlags: [`model_api_income`]

> You can (and should) add more nodes later, but these are enough for a playable loop.

---

## Operate Jobs (JOB_DEFS)

Operate must show jobs based on unlock status:

- jobs that are runnable now
- locked jobs can be hidden or shown as locked (either is fine) but Research must always show what exists.

### Job schema

- `jobId`
- `name`
- `description` (one sentence)
- `durationMs`
- `moneyCost`
- `computeRequiredCU`
- `rewards`: `{ money, xp, rp }`
- `requirements`:
  - `minLevel`
  - `requiredResearchNodeIds?: string[]`
  - `requiredBlueprintIds?: string[]` (for contracts that need a model)
  - `requiredCapabilityFlags?: string[]` (optional)
- `output`:
  - training jobs: `{ trainsBlueprintId }`
  - contract jobs: `{ usesBlueprintType?: "tts"|"vlm"|"llm" }` (auto-pick best model)

### Default job list (MVP)

#### Training jobs

A) `job_train_tts_3b`

- name: `train 3b tts`
- description: `Train a new version of your 3B TTS model.`
- duration: 5m
- cost: 500
- compute: 1 CU
- rewards: money 0, xp 80, rp 120
- requirements: minLevel 1, blueprint `bp_tts_3b`
- output: trains `bp_tts_3b`

B) `job_train_vlm_7b`

- name: `train 7b vlm`
- description: `Train a new version of your 7B VLM model.`
- duration: 12m
- cost: 1200
- compute: 1 CU
- rewards: money 0, xp 140, rp 260
- requirements: minLevel 2, blueprint `bp_vlm_7b`
- output: trains `bp_vlm_7b`

C) `job_train_llm_3b`

- name: `train 3b llm`
- description: `Train a new version of your 3B LLM model.`
- duration: 8m
- cost: 900
- compute: 1 CU
- rewards: money 0, xp 120, rp 200
- requirements: minLevel 3, blueprint `bp_llm_3b`
- output: trains `bp_llm_3b`

D) `job_train_llm_17b`

- name: `train 17b llm`
- description: `Train a new version of your 17B LLM model.`
- duration: 20m
- cost: 3000
- compute: 2 CU
- rewards: money 0, xp 260, rp 480
- requirements: minLevel 7, blueprint `bp_llm_17b`
- output: trains `bp_llm_17b`

#### Contracts (money jobs)

E) `job_contract_blog_basic`

- name: `blog post batch`
- description: `Deliver basic blog posts using your best LLM.`
- duration: 4m
- cost: 0
- compute: 1 CU
- rewards: money 450, xp 60, rp 0
- requirements: minLevel 1, capability `basic contracts`
- output: uses blueprint type `llm` (must have at least one LLM trained, otherwise job is locked)

F) `job_contract_voice_pack`

- name: `voiceover pack`
- description: `Generate voiceovers using your best TTS.`
- duration: 4m
- cost: 0
- compute: 1 CU
- rewards: money 520, xp 70, rp 0
- requirements: minLevel 2, capability `voice gigs`, needs at least one TTS model trained
- output: uses blueprint type `tts`

G) `job_contract_image_qa`

- name: `image qa contract`
- description: `Answer image questions using your best VLM.`
- duration: 6m
- cost: 0
- compute: 1 CU
- rewards: money 700, xp 90, rp 0
- requirements: minLevel 3, capability `vision contracts`, needs at least one VLM model trained
- output: uses blueprint type `vlm`

#### Research job (always available RP trickle to avoid softlock)

H) `job_research_literature`

- name: `literature sweep`
- description: `Do foundational research to earn RP steadily.`
- duration: 3m
- cost: 150
- compute: 0 CU
- rewards: money 0, xp 40, rp 60
- requirements: minLevel 1
- output: none

---

## Lab Upgrades (UP spending)

Keep your existing UP system:

- UP only visible/spendable in **Lab → Upgrades**
- 1 UP = +1 rank
- level-gated rank bands (already in `gameConfig.ts`)
- caps (already in `gameConfig.ts`)

No additional “cost scaling”.

---

## Model Versioning + “Best Version Auto-Used”

Training the same blueprint repeatedly creates **versions**.

- Each blueprint maintains many model versions.
- The system always picks the **best score** version automatically for:
  - contract jobs
  - API income (when enabled)
  - public display / leaderboards

### Scoring (fix the current behavior)

Currently you use RP reward as score for trained models.
For MVP, trained model score must be generated using:

- blueprint `scoreRange` + small randomness + perk modifiers (optional)
  and must be stored on the model record.

---

## Inbox (MVP events, minimal)

Add 5 lightweight events triggered by milestones:

1. First level-up → explains UP and upgrades
2. First research purchase → explains Research tabs
3. First trained model → explains Lab → Models
4. Publishing unlocked → explains public/private
5. Reaching level 5 → hints at passive API income

Inbox messages should not spam for money ticks; they’re only for milestone events.

---

## World (MVP)

World becomes meaningful when:

- a player can publish a model
- World can show a simple leaderboard

### MVP leaderboard

- Show public models only
- Rank by `score`
- Group by `type`: LLM / TTS / VLM

---

## Implementation Tasks (what to change in code)

### 1) Research backend must return all node categories (not perks only)

**Current:** `research.ts` uses `const ALL_NODES = PERK_NODES;`
**Change:**

- import `RESEARCH_NODES` from `contentCatalog.ts`
- expose:
  - `getResearchNodes` → returns all nodes (with availability + lockReason)
  - `purchaseResearchNode` → same, but supports blueprint/capability/perk outputs

### 2) Tasks/job system must be blueprint-driven

**Current:** training only supports `train_small_model` / `train_medium_model` and writes `modelType: "small_3b" | "medium_7b"`.
**Change:**

- training jobs output `blueprintId` (e.g. `bp_tts_3b`)
- trainedModels records store:
  - `blueprintId`, `type`, `name`, `version`, `score`, `visibility`
- contract jobs declare what model type they use and auto-pick best version

### 3) Operate job catalog must be unlocked via research

- Operate job query returns:
  - all jobs that are currently unlocked and runnable
  - (optional) locked jobs with a lockReason

### 4) Remove “DB-only surprise models”

If “3B TTS” and “7B VLM” exist only as DB records today:

- keep them if you want for your dev lab,
- but the MVP must allow **creating them from gameplay** using the blueprint + job system.

---

## Acceptance Criteria (“Playable MVP” definition)

A brand new player can:

1. Start at level 1 and run at least two jobs in Operate.
2. Earn RP and purchase at least one Research node within 10 minutes.
3. Unlock at least one new training job from Research and complete it.
4. See the trained model in Lab → Models.
5. Level up once, spend UP in Lab → Upgrades, and feel the effect (more queue or compute).
6. Unlock and run at least one contract job that consumes a trained model type.
7. Publish a model (after unlocking publishing) and see it appear in World leaderboard.

---

# Context.md cleanup (outdated sections to remove or rewrite)

Your current `context.md` still contains outdated rules that will confuse agents.

## Remove (outdated / no longer true)

1. **Reputation**

- Remove Reputation from the “core pillars / resources” list.
- Remove any mention of “reputation as a spendable/unlock currency”.

2. **Simple View / Advanced View**

- Remove the “progressive disclosure” section that says:
  - new players see simplified UI; advanced players unlock dense dashboard
- Remove the statement that “both views must operate on the same underlying logic”.

3. **Level-based capacity unlocks (old skill tree definition)**

- Remove references that level progression directly unlocks:
  - queue slots / parallel tasks / staff capacity / compute units
    These are now handled via:
- **UP** (earned by leveling) spent in **Lab → Upgrades**

4. **Old navigation naming**

- Replace references to top-level:
  - “Tasks / Models / Messages”
    with:
  - **Operate / Research / Lab / Inbox / World**

## Keep (still correct)

- Core fantasy: AI lab founder, strategic tradeoffs, time-based jobs
- Convex reactive state + Next.js app structure
- Max level 20
- Research Points and the idea of permanent unlocks
- Model publishing concept (private vs public)

## Rewrite (to match current rules)

- Any “skill tree” wording that describes levels as the skill tree:
  - Replace with:
    - `lab → milestones` = level overview (UP gained)
    - `lab → upgrades` = UP spending
    - `research` = RP spending tech tree (blueprints/capabilities/perks)

---

## Notes for future expansions (not required now)

- Passive API income tick simulation (reactive updates)
- Model evaluation / model score improvements via retraining
- More districts/factions and faction-gated research nodes
