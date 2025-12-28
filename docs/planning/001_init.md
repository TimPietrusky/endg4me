# Planning 001: Initial POC Implementation

## Goal

Implement the first playable Proof of Concept (POC) of the AI Lab strategy game.

The POC must:
- be playable for ~30–60 minutes
- teach the core systems naturally
- feel fast and rewarding early
- establish long-term progression pacing

---

## High-Level Progression Philosophy

### Early Game (0–30 min)
- Fast feedback
- Short tasks
- Frequent unlocks
- Player feels powerful quickly

### Mid Game (30–60 min)
- First friction appears
- Decisions start to matter
- Parallelism becomes valuable

### Later Game (conceptually prepared)
- Long tasks
- Planning across sessions
- Automation becomes necessary

---

## Core Progression Axes

Players progress on four axes simultaneously:

1. Lab progression (resources, infrastructure)
2. Player progression (levels)
3. Social progression (clans)
4. Knowledge progression (systems unlocked)

---

## Step 1: Project Setup

- Initialize Next.js 16 using the shadcn creator preset
- App Router only
- No Pages Router
- No useEffect for data flow

---

## Step 2: Authentication

- Integrate WorkOS
- User must be authenticated to play
- Auth available server-side
- No client-side auth state handling

---

## Step 3: Convex Data Model

### users
- id
- workosUserId
- createdAt

### labs
- id
- userId
- name
- founderType
- createdAt

### labState
- labId
- cash
- researchPoints
- reputation
- computeUnits
- staffCapacity
- parallelTasks

### playerState
- userId
- level
- experience
- clanId (nullable)

---

## Step 4: Founder Selection

### Founder Types

#### Technical Founder
- +25% research speed
- +10% model score
- -20% money rewards

#### Business Founder
- +30% money rewards
- +20% hiring speed
- -20% research speed

Founder modifiers are applied multiplicatively.

---

## Step 5: Initial State

### Lab State
- cash: 5000
- researchPoints: 0
- reputation: 0
- computeUnits: 1
- staffCapacity: 2
- parallelTasks: 1

### Player State
- level: 1
- experience: 0

---

## Step 6: Player Leveling System

### Purpose
- Separate personal progression from lab resources
- Reward engagement even during slow lab phases
- Unlock social and strategic systems

### XP Sources
- Completing tasks
- Training models
- Hiring staff
- Reaching milestones

### XP Curve

| Level | XP Required |
|------|-------------|
| 1 → 2 | 100 |
| 2 → 3 | 300 |
| 3 → 4 | 700 |
| 4 → 5 | 1500 |

XP grows ~2.2× per level.

### Level Rewards
- +1% global efficiency per level
- Clans unlock at level 3

---

## Step 7: Core Actions

### Train Small Model (3B)

- Time: 5 minutes
- Cost: $500 + 1 compute unit
- Base Reward:
  - 120 research points
  - 5 reputation

Final RP formula:

RP = baseRP × founderModifier × randomFactor (0.9–1.1)

---

### Train Medium Model (7B)

- Time: 12 minutes
- Cost: $1200 + 1 compute unit
- Base Reward:
  - 260 research points
  - 12 reputation
- Random factor: 0.85–1.15

---

### Freelance AI Contract

- Time: 3 minutes
- Cost: none
- Reward:
  - $400
  - 2 reputation
- Cooldown: 5 minutes

Ensures players are never stuck.

---

## Step 8: Task System

- Tasks are queued
- Only parallelTasks run simultaneously
- Tasks resolve automatically
- Player receives notification on completion

---

## Step 9: Hiring System (POC)

### Hire Junior Researcher

- Cost: $2000
- Staff Capacity: 1
- Effects:
  - +10% research speed
  - +1 parallel task slot

No salaries.
Staff capacity limits scaling.

---

## Step 10: Progressive Disclosure Rules

Simple View must:
- Show only valid actions
- Hide future mechanics
- Reveal stats only when relevant

Examples:
- RP bar appears after first model
- Parallel task UI appears after first hire
- Level bar appears after first XP gain

---

## Step 11: Clans (POC Lite)

### Unlock
- Player level ≥ 3

### Mechanics
- Create or join a clan
- Clan has:
  - name
  - members
  - combined reputation score

### Clan Bonus
- +5% reputation gain for all members
- No resource sharing

---

## Step 12: Early-to-Late Game Pacing

### Pacing Controls

1. Time
   - Task duration scales faster than rewards

2. Capacity
   - Staff capacity and parallelism are limited

3. XP Curve
   - Player leveling slows naturally

4. Randomness
   - Prevents deterministic grinding

### Example Scaling

| Stage | Avg Task Time | RP per Minute |
|-------|---------------|---------------|
| Early | 3–5 min | High |
| Mid | 10–15 min | Medium |
| Later | 30+ min | Low but strategic |

---

## Step 13: Notifications

- In-app only
- Triggered on:
  - task completion
  - hire completion
  - level up
  - system unlock

---

## Success Criteria

The POC is successful if:
- A new player understands what to do without explanation
- Progress feels fast in the first 15 minutes
- First meaningful friction appears around minute 30
- The player wants to return later
