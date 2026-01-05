# Dashboard Features Specification

> This document describes all features and components in the game dashboard. Use this as a reference for creating UI mockups or click dummies.

---

## UI Library Baseline

The project uses **shadcn/ui** with the **base-maia** style, built on **Base UI** primitives (`@base-ui/react`).

### Preset Configuration

```bash
pnpm dlx shadcn@latest create --preset "https://ui.shadcn.com/init?base=base&style=maia&baseColor=zinc&theme=zinc&iconLibrary=phosphor&font=nunito-sans&menuAccent=subtle&menuColor=default&radius=small&template=next" --template next
```

### Settings

| Setting      | Value                      |
| ------------ | -------------------------- |
| Style        | `base-maia`                |
| Base Color   | `zinc`                     |
| Theme        | `zinc` (dark mode enabled) |
| Icon Library | `phosphor`                 |
| Font         | `nunito-sans`              |
| Radius       | `small`                    |
| Menu Accent  | `subtle`                   |
| Menu Color   | `default`                  |

### Available Components

- Button, Card, Badge, Progress, Dialog, Tooltip
- All components use Base UI primitives (NOT Radix)

---

## Dashboard Layout

The dashboard uses a **single-page layout** with:

- Fixed header at top
- Main content area with two-column grid (2/3 + 1/3)
- Slide-out panels for secondary features
- Toast notifications in bottom-right corner

---

## Header

| Element              | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| Lab Logo             | Icon representing the lab (Brain icon in gradient square)        |
| Lab Name             | User's lab name (e.g., "nerd labs")                              |
| Founder Type         | Badge showing founder class (e.g., "Technical Founder")          |
| Notifications Button | Bell icon, shows unread count badge (displays "9+" if count > 9) |
| Clans Button         | Users icon, only visible when player level >= 3                  |
| Sign Out Button      | Sign out icon, logs user out                                     |

---

## Stats Bar

Four stat cards displayed horizontally. Each card shows an icon, label, and value.

| Stat            | Icon            | Example Value | Visibility                |
| --------------- | --------------- | ------------- | ------------------------- |
| Cash            | Currency/Dollar | "$3,120"      | Always                    |
| Research Points | Lightning       | "551"         | After first model trained |
| Reputation      | Star            | "23"          | Always                    |
| Compute         | CPU             | "0/1"         | Always                    |

---

## Model Collection Button

A prominent button that appears **after the player trains their first model**.

| Element  | Description                                      |
| -------- | ------------------------------------------------ |
| Icon     | Brain icon in gradient square                    |
| Title    | "Model Collection"                               |
| Subtitle | "{count} model(s) trained · Best score: {score}" |
| Action   | Opens Model Collection panel                     |
| Arrow    | Right chevron, animates on hover                 |

---

## Player Level Section

Displays player progression information.

| Element          | Description                                               |
| ---------------- | --------------------------------------------------------- |
| Level Badge      | Trophy icon in gradient square                            |
| Label            | "Player Level"                                            |
| Current Level    | Large text showing level (e.g., "Level 2")                |
| XP Display       | "{current} / {required} XP" (e.g., "18 / 300 XP")         |
| Efficiency Bonus | "+{bonus}% efficiency" based on level                     |
| Progress Bar     | Visual bar showing XP progress to next level              |
| Unlock Hint      | "Reach level {X} to unlock Clans" (shown if clans locked) |

---

## Actions Panel (Left Column - 2/3 Width)

### AI Training Section

Section header: "AI TRAINING"

| Action                  | Cost   | Duration | Rewards                  | Disabled When                   |
| ----------------------- | ------ | -------- | ------------------------ | ------------------------------- |
| Train Small Model (3B)  | $500   | 5 min    | +120 RP, +5 Rep, +25 XP  | Not enough cash OR compute full |
| Train Medium Model (7B) | $1,200 | 12 min   | +260 RP, +12 Rep, +60 XP | Not enough cash OR compute full |

### Revenue Section

Section header: "REVENUE"

| Action                | Cost | Duration | Rewards               | Disabled When |
| --------------------- | ---- | -------- | --------------------- | ------------- |
| Freelance AI Contract | Free | 3 min    | +$400, +2 Rep, +10 XP | On cooldown   |

- Shows cooldown timer when on cooldown (e.g., "Cooldown: 4m 32s")

### Hiring Section

Section header: "HIRING ({current}/{max} Staff)"

| Action                 | Cost   | Duration | Rewards                               | Disabled When                        |
| ---------------------- | ------ | -------- | ------------------------------------- | ------------------------------------ |
| Hire Junior Researcher | $1,500 | 2 min    | +10% Research Speed, +1 Parallel Task | Not enough cash OR at staff capacity |

### Action Button Anatomy

Each action button contains:

- Icon (colored gradient square)
- Title (action name)
- Subtitle (cost + duration OR cooldown status)
- Rewards badge (green text showing rewards)
- Right arrow (animates on hover, hidden when disabled)
- Disabled state (greyed out, not clickable)

---

## Active Tasks Panel (Right Column - 1/3 Width)

### Header

"Active Tasks" with clock icon. Shows slot usage when parallel tasks unlocked: "({used}/{total} slots)"

### In-Progress Tasks

Each task card shows:

- Task name (e.g., "Train Small Model (3B)")
- Time remaining countdown (e.g., "2m 34s")
- Progress bar (fills left-to-right as task progresses)

### Task Queue (Progressive Unlock System)

**Locked State** (Level 1):

- Shows locked message: "Task Queue Locked"
- Shows unlock hint: "Reach level {X} to unlock {Y} queue slot(s)"

**Unlocked State** (Level 2+):

- Section divider: "Queued" with queue icon
- Shows slot usage: "{used}/{available} slots"
- Each queued task shows:
  - Task name
  - "Waiting" status indicator
  - No progress bar

**Queue Progression:**
| Level | Queue Slots |
|-------|-------------|
| 1 | 0 (locked) |
| 2 | 1 |
| 4 | 2 |
| 6 | 3 |
| 8 | 4 |

### Empty State

When no tasks running:

- Large clock icon (muted)
- "No active tasks"
- "Start an action to begin!"

### Next Unlock Info

Shows below task list: "Level {X}: +{Y} queue slot"

---

## Recent Activity Feed

Section header: "Recent Activity" with chart icon

Shows last 5 completed activities. Each item displays:

| Element   | Description                                            |
| --------- | ------------------------------------------------------ |
| Icon      | Varies by activity type (see below)                    |
| Title     | Activity title (e.g., "Small Model Training Complete") |
| Message   | Reward summary (e.g., "+120 RP, +5 Rep")               |
| Timestamp | Relative time (e.g., "2m ago", "1h ago", "Just now")   |

**Activity Types & Icons:**
| Type | Icon | Color |
|------|------|-------|
| task_complete | Lightning | Green |
| level_up | Trophy | Violet |
| unlock | Star | Amber |
| hire_complete | User Plus | Blue |

---

## Slide-Out Panels

### Notification Panel

Triggered by: Clicking notifications bell

Contents:

- List of all notifications
- Each notification shows: type icon, title, message, timestamp
- Mark as read functionality
- Close button

### Clan Panel

Triggered by: Clicking clans button (only visible at level 3+)

Contents:

- Create new clan form
- Join existing clan
- Current clan info (if member)
- Clan member list
- Leave clan option
- Close button

### Model Collection Panel

Triggered by: Clicking Model Collection button

**Stats Section (4 cards):**
| Stat | Description |
|------|-------------|
| Total Models | Count of all trained models |
| Total Score | Sum of all model scores |
| Avg. Score | Average score across models |
| Best Model | Highest scoring model's score (highlighted) |

**Model List:**

Each model card shows:

- Icon (gradient square, color varies by model type)
- Model name (e.g., "Train-Small #1")
- Model type badge (Small/Medium)
- Score (e.g., "265 RP")
- Training date (e.g., "Trained on Jan 02, 2026")
- Medal icon if it's the best model

Close button in header.

---

## Toast Notifications

Position: Fixed, bottom-right corner

Triggered by: Task completion, level up, unlocks

**Toast Anatomy:**
| Element | Description |
|---------|-------------|
| Icon | Varies by notification type (colored gradient square) |
| Title | Notification title |
| Message | Reward details or unlock info |
| Timestamp | "Just now" or relative time |
| Dismiss Button | X icon to manually close |
| Progress Bar | Shrinking bar showing auto-dismiss countdown |

**Behavior:**

- Auto-dismisses after 5 seconds
- Can be manually dismissed
- Multiple toasts stack vertically
- Slides in from right

**Toast Types & Colors:**
| Type | Icon | Gradient |
|------|------|----------|
| task_complete | Check Circle | Emerald → Cyan |
| level_up | Trophy | Violet → Purple |
| unlock | Sparkle | Amber → Orange |
| hire_complete | User Plus | Blue → Cyan |

---

## Progressive Disclosure

Features that appear/unlock based on game state:

| Feature                     | Visibility Condition                  |
| --------------------------- | ------------------------------------- |
| Research Points stat        | After first model trained             |
| Model Collection button     | After first model trained             |
| Parallel task slots display | After first hire OR parallelTasks > 1 |
| Clans button                | Player level >= 3                     |
| Task queue                  | Player level >= 2                     |
| Queue upgrade hints         | When queue is unlocked                |

---

_Last updated: 2026-01-02_
