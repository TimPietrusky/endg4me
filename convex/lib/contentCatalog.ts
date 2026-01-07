// =============================================================================
// UNIFIED CONTENT CATALOG
// =============================================================================
//
// Single source of truth for ALL game content. One entry = one thing in the game.
//
// ADDING NEW CONTENT:
// 1. Add an entry to CONTENT_CATALOG below
// 2. Fill in the required fields based on contentType
// 3. Done.
//
// =============================================================================

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

/** Model type for trainable AI models. Used in leaderboards and contracts. */
export type ModelType = "llm" | "tts" | "vlm";

/**
 * Content type determines which fields are required/used.
 * 
 * - "model": Trainable AI model (has training job, research unlock)
 * - "contract": Job that uses a trained model to earn money
 * - "income": Freelance job that earns money without models
 * - "hire": Temporary staff boost
 * - "research": Always-available research job (Literature Sweep)
 */
export type ContentType = "model" | "contract" | "income" | "hire" | "research";

/**
 * UI category for grouping in views.
 * 
 * Operate view (uppercase): TRAINING, CONTRACTS, INCOME, HIRING, RESEARCH
 * Research view (lowercase): model, revenue, hiring
 */
export type UICategory = 
  | "TRAINING" | "CONTRACTS" | "INCOME" | "HIRING" | "RESEARCH"
  | "model" | "revenue" | "hiring";

/** Hire stat type for temporary boosts. Maps to the 5 lab stats. */
export type HireStatType = "queue" | "compute" | "speed" | "moneyMultiplier" | "staff";

// -----------------------------------------------------------------------------
// CONTENT ENTRY
// -----------------------------------------------------------------------------

export interface ContentEntry {
  // =========================================================================
  // IDENTITY (required for all)
  // =========================================================================
  
  /** Unique identifier. Used as primary key everywhere. */
  id: string;

  /** Human-readable name shown in UI. */
  name: string;

  /** Short description shown on cards. Keep under 100 characters. */
  description: string;

  /** What type of content this is. Determines which fields are used. */
  contentType: ContentType;

  /** UI category for grouping in views. */
  uiCategory: UICategory;

  // =========================================================================
  // UNLOCK REQUIREMENTS (how to make this available)
  // =========================================================================

  /** Minimum player level required. Default: 1 */
  minLevel?: number;

  /** RP cost to unlock via research. 0 = free starter (auto-unlocked). undefined = always available. */
  unlockCostRP?: number;

  /** Time to complete research unlock (milliseconds). */
  unlockDurationMs?: number;

  /** ID of prerequisite content that must be unlocked first. */
  prerequisite?: string;

  // =========================================================================
  // JOB PROPERTIES (for content that can be run as a job)
  // =========================================================================

  /** Time to complete the job (milliseconds). */
  jobDurationMs?: number;

  /** Money cost to start the job. Default: 0 */
  jobMoneyCost?: number;

  /** Compute units required. Default: 0 */
  jobComputeCost?: number;

  /** Money reward on completion. */
  rewardMoney?: number;

  /** XP reward on completion. */
  rewardXP?: number;

  /** RP reward on completion. */
  rewardRP?: number;

  // =========================================================================
  // MODEL PROPERTIES (for contentType: "model")
  // =========================================================================

  /** Model type for leaderboards and contracts. */
  modelType?: ModelType;

  /** Score range for trained models (random within range). */
  scoreRange?: { min: number; max: number };

  // =========================================================================
  // CONTRACT PROPERTIES (for contentType: "contract")
  // =========================================================================

  /** Model type required to run this contract. */
  requiresModelType?: ModelType;

  // =========================================================================
  // HIRE PROPERTIES (for contentType: "hire")
  // =========================================================================

  /** Which lab stat this hire boosts. */
  hireStat?: HireStatType;

  /** Bonus amount for the stat. */
  hireBonus?: number;

  // =========================================================================
  // ASSET PROPERTIES
  // =========================================================================

  /** Slug for entity assets. Maps to /public/assets/entities/{slug}/ */
  assetSlug?: string;
}

// -----------------------------------------------------------------------------
// CONTENT CATALOG
// -----------------------------------------------------------------------------

export const CONTENT_CATALOG: ContentEntry[] = [
  // ===========================================================================
  // TTS MODELS
  // ===========================================================================
  {
    id: "tts_3b",
    name: "3B TTS",
    description: "A small voice model for audio gigs.",
    contentType: "model",
    uiCategory: "TRAINING",
    minLevel: 1,
    unlockCostRP: 0,
    unlockDurationMs: 30 * 1000,
    jobDurationMs: 2 * 60 * 1000,
    jobMoneyCost: 500,
    jobComputeCost: 1,
    rewardXP: 50,
    rewardRP: 125,
    modelType: "tts",
    scoreRange: { min: 40, max: 70 },
    assetSlug: "3b-tts",
  },
  {
    id: "tts_7b",
    name: "7B TTS",
    description: "A mid-range voice model with better clarity.",
    contentType: "model",
    uiCategory: "TRAINING",
    minLevel: 3,
    unlockCostRP: 200,
    unlockDurationMs: 2 * 60 * 1000,
    prerequisite: "tts_3b",
    jobDurationMs: 6 * 60 * 1000,
    jobMoneyCost: 1000,
    jobComputeCost: 1,
    rewardXP: 100,
    rewardRP: 200,
    modelType: "tts",
    scoreRange: { min: 55, max: 82 },
    assetSlug: "7b-tts",
  },
  {
    id: "tts_30b",
    name: "30B TTS",
    description: "A large voice model with rich intonation.",
    contentType: "model",
    uiCategory: "TRAINING",
    minLevel: 5,
    unlockCostRP: 400,
    unlockDurationMs: 4 * 60 * 1000,
    prerequisite: "tts_7b",
    jobDurationMs: 15 * 60 * 1000,
    jobMoneyCost: 2500,
    jobComputeCost: 2,
    rewardXP: 200,
    rewardRP: 400,
    modelType: "tts",
    scoreRange: { min: 70, max: 92 },
    assetSlug: "30b-tts",
  },
  {
    id: "tts_70b",
    name: "70B TTS",
    description: "A massive voice model with studio-quality output.",
    contentType: "model",
    uiCategory: "TRAINING",
    minLevel: 7,
    unlockCostRP: 700,
    unlockDurationMs: 6 * 60 * 1000,
    prerequisite: "tts_30b",
    jobDurationMs: 25 * 60 * 1000,
    jobMoneyCost: 5000,
    jobComputeCost: 3,
    rewardXP: 350,
    rewardRP: 600,
    modelType: "tts",
    scoreRange: { min: 85, max: 99 },
    assetSlug: "70b-tts",
  },

  // ===========================================================================
  // VLM MODELS
  // ===========================================================================
  {
    id: "vlm_7b",
    name: "7B VLM",
    description: "A vision-language model for image understanding contracts.",
    contentType: "model",
    uiCategory: "TRAINING",
    minLevel: 2,
    unlockCostRP: 250,
    unlockDurationMs: 3 * 60 * 1000,
    jobDurationMs: 12 * 60 * 1000,
    jobMoneyCost: 1200,
    jobComputeCost: 1,
    rewardXP: 140,
    rewardRP: 260,
    modelType: "vlm",
    scoreRange: { min: 55, max: 85 },
  },

  // ===========================================================================
  // LLM MODELS
  // ===========================================================================
  {
    id: "llm_3b",
    name: "3B LLM",
    description: "A small text model for basic writing work.",
    contentType: "model",
    uiCategory: "TRAINING",
    minLevel: 3,
    unlockCostRP: 350,
    unlockDurationMs: 4 * 60 * 1000,
    jobDurationMs: 8 * 60 * 1000,
    jobMoneyCost: 900,
    jobComputeCost: 1,
    rewardXP: 120,
    rewardRP: 200,
    modelType: "llm",
    scoreRange: { min: 45, max: 75 },
  },
  {
    id: "llm_17b",
    name: "17B LLM",
    description: "A stronger text model that wins premium contracts.",
    contentType: "model",
    uiCategory: "TRAINING",
    minLevel: 7,
    unlockCostRP: 900,
    unlockDurationMs: 12 * 60 * 1000,
    prerequisite: "llm_3b",
    jobDurationMs: 20 * 60 * 1000,
    jobMoneyCost: 3000,
    jobComputeCost: 2,
    rewardXP: 260,
    rewardRP: 480,
    modelType: "llm",
    scoreRange: { min: 65, max: 95 },
  },

  // ===========================================================================
  // CONTRACTS
  // ===========================================================================
  {
    id: "contract_blog",
    name: "Blog Post Batch",
    description: "Deliver basic blog posts using your best LLM.",
    contentType: "contract",
    uiCategory: "CONTRACTS",
    minLevel: 1,
    unlockCostRP: 0,
    unlockDurationMs: 30 * 1000,
    jobDurationMs: 4 * 60 * 1000,
    jobMoneyCost: 0,
    jobComputeCost: 1,
    rewardMoney: 450,
    rewardXP: 60,
    requiresModelType: "llm",
  },
  {
    id: "contract_voice",
    name: "Voiceover Pack",
    description: "Generate voiceovers using your best TTS.",
    contentType: "contract",
    uiCategory: "CONTRACTS",
    minLevel: 2,
    unlockCostRP: 200,
    unlockDurationMs: 2 * 60 * 1000,
    jobDurationMs: 4 * 60 * 1000,
    jobMoneyCost: 0,
    jobComputeCost: 1,
    rewardMoney: 520,
    rewardXP: 70,
    requiresModelType: "tts",
  },
  {
    id: "contract_vision",
    name: "Image QA Contract",
    description: "Answer image questions using your best VLM.",
    contentType: "contract",
    uiCategory: "CONTRACTS",
    minLevel: 3,
    unlockCostRP: 220,
    unlockDurationMs: 2.5 * 60 * 1000,
    jobDurationMs: 6 * 60 * 1000,
    jobMoneyCost: 0,
    jobComputeCost: 1,
    rewardMoney: 700,
    rewardXP: 90,
    requiresModelType: "vlm",
  },

  // ===========================================================================
  // INCOME
  // ===========================================================================
  {
    id: "income_website",
    name: "Basic Website",
    description: "Build a simple website for a client. Pure freelance work.",
    contentType: "income",
    uiCategory: "INCOME",
    minLevel: 1,
    unlockCostRP: 0,
    unlockDurationMs: 30 * 1000,
    jobDurationMs: 3 * 60 * 1000,
    jobMoneyCost: 0,
    jobComputeCost: 0,
    rewardMoney: 200,
    rewardXP: 30,
    assetSlug: "basic-website",
  },
  {
    id: "income_website_advanced",
    name: "Advanced Website",
    description: "Build a polished website with modern features. Premium freelance.",
    contentType: "income",
    uiCategory: "INCOME",
    minLevel: 4,
    unlockCostRP: 280,
    unlockDurationMs: 3 * 60 * 1000,
    prerequisite: "income_website",
    jobDurationMs: 6 * 60 * 1000,
    jobMoneyCost: 0,
    jobComputeCost: 0,
    rewardMoney: 550,
    rewardXP: 70,
    assetSlug: "advanced-website",
  },
  {
    id: "income_api",
    name: "API Integration Gig",
    description: "Integrate third-party APIs for a startup.",
    contentType: "income",
    uiCategory: "INCOME",
    minLevel: 3,
    unlockCostRP: 180,
    unlockDurationMs: 2 * 60 * 1000,
    prerequisite: "income_website",
    jobDurationMs: 5 * 60 * 1000,
    jobMoneyCost: 0,
    jobComputeCost: 0,
    rewardMoney: 400,
    rewardXP: 50,
  },

  // ===========================================================================
  // HIRES
  // ===========================================================================
  {
    id: "hire_junior",
    name: "Junior Researcher",
    description: "Hire a junior to help. +1 queue slot for 8 minutes.",
    contentType: "hire",
    uiCategory: "HIRING",
    minLevel: 2,
    unlockCostRP: 150,
    unlockDurationMs: 1.5 * 60 * 1000,
    jobDurationMs: 8 * 60 * 1000,
    jobMoneyCost: 300,
    jobComputeCost: 0,
    hireStat: "queue",
    hireBonus: 1,
  },
  {
    id: "hire_optimizer",
    name: "Optimization Specialist",
    description: "Speed expert joins. +15% speed for 10 minutes.",
    contentType: "hire",
    uiCategory: "HIRING",
    minLevel: 3,
    unlockCostRP: 300,
    unlockDurationMs: 3 * 60 * 1000,
    prerequisite: "hire_junior",
    jobDurationMs: 10 * 60 * 1000,
    jobMoneyCost: 1000,
    jobComputeCost: 0,
    hireStat: "speed",
    hireBonus: 15,
  },
  {
    id: "hire_hr",
    name: "HR Manager",
    description: "Talent scout joins. +1 team size for 15 minutes.",
    contentType: "hire",
    uiCategory: "HIRING",
    minLevel: 5,
    unlockCostRP: 250,
    unlockDurationMs: 3 * 60 * 1000,
    prerequisite: "hire_optimizer",
    jobDurationMs: 15 * 60 * 1000,
    jobMoneyCost: 500,
    jobComputeCost: 0,
    hireStat: "staff",
    hireBonus: 1,
  },
  {
    id: "hire_partner",
    name: "Business Partner",
    description: "Partner up for deals. +25% money multiplier for 15 minutes.",
    contentType: "hire",
    uiCategory: "HIRING",
    minLevel: 6,
    unlockCostRP: 450,
    unlockDurationMs: 5 * 60 * 1000,
    prerequisite: "hire_hr",
    jobDurationMs: 15 * 60 * 1000,
    jobMoneyCost: 900,
    jobComputeCost: 0,
    hireStat: "moneyMultiplier",
    hireBonus: 25,
  },
  {
    id: "hire_senior",
    name: "Senior Engineer",
    description: "Top talent joins. +1 compute for 20 minutes.",
    contentType: "hire",
    uiCategory: "HIRING",
    minLevel: 10,
    unlockCostRP: 700,
    unlockDurationMs: 8 * 60 * 1000,
    prerequisite: "hire_partner",
    jobDurationMs: 20 * 60 * 1000,
    jobMoneyCost: 1500,
    jobComputeCost: 0,
    hireStat: "compute",
    hireBonus: 1,
  },

  // ===========================================================================
  // REVENUE FEATURES
  // ===========================================================================
  {
    id: "revenue_api",
    name: "Model API Income",
    description: "Earn passive money from hosted model APIs.",
    contentType: "income",
    uiCategory: "revenue",
    minLevel: 5,
    unlockCostRP: 350,
    unlockDurationMs: 4 * 60 * 1000,
  },
  {
    id: "revenue_licensing",
    name: "Model Licensing",
    description: "License your models to enterprises for big payouts.",
    contentType: "income",
    uiCategory: "revenue",
    minLevel: 8,
    unlockCostRP: 500,
    unlockDurationMs: 6 * 60 * 1000,
    prerequisite: "revenue_api",
  },

  // ===========================================================================
  // ALWAYS AVAILABLE
  // ===========================================================================
  {
    id: "research_literature",
    name: "Literature Sweep",
    description: "Do foundational research to earn RP steadily.",
    contentType: "research",
    uiCategory: "RESEARCH",
    minLevel: 1,
    jobDurationMs: 3 * 60 * 1000,
    jobMoneyCost: 150,
    jobComputeCost: 0,
    rewardXP: 40,
    rewardRP: 60,
  },
];

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/** Get content entry by ID. */
export function getContentById(id: string): ContentEntry | undefined {
  return CONTENT_CATALOG.find((c) => c.id === id);
}

/** Get all content of a specific type. */
export function getContentByType(contentType: ContentType): ContentEntry[] {
  return CONTENT_CATALOG.filter((c) => c.contentType === contentType);
}

/** Get all content in a UI category. */
export function getContentByUICategory(uiCategory: UICategory): ContentEntry[] {
  return CONTENT_CATALOG.filter((c) => c.uiCategory === uiCategory);
}

/** Get all trainable models. */
export function getAllModels(): ContentEntry[] {
  return getContentByType("model");
}

/** Get all content that has a job (can be started as a task). */
export function getAllJobs(): ContentEntry[] {
  return CONTENT_CATALOG.filter((c) => c.jobDurationMs !== undefined);
}

/** Get all content that needs research unlock. */
export function getAllUnlockables(): ContentEntry[] {
  return CONTENT_CATALOG.filter((c) => c.unlockCostRP !== undefined);
}

/** Get research category for an entry. */
export function getResearchCategory(entry: ContentEntry): "model" | "revenue" | "hiring" | null {
  switch (entry.contentType) {
    case "model": return "model";
    case "contract":
    case "income": return "revenue";
    case "hire": return "hiring";
    default: return null;
  }
}

/** Calculate model score from entry + randomness. */
export function calculateModelScore(entry: ContentEntry, bonusPercent: number = 0): number {
  if (!entry.scoreRange) return 0;
  const { min, max } = entry.scoreRange;
  const baseScore = min + Math.random() * (max - min);
  const bonusMultiplier = 1 + bonusPercent / 100;
  return Math.round(baseScore * bonusMultiplier);
}

/** Get free starters (auto-unlocked at game start). */
export function getFreeStarters(): ContentEntry[] {
  return CONTENT_CATALOG.filter(
    (c) => c.unlockCostRP === 0 && (c.minLevel ?? 1) === 1 && !c.prerequisite
  );
}

/** Get starter unlock IDs for new players. */
export function getStarterUnlockIds(): string[] {
  const ids = getFreeStarters().map((c) => c.id);
  // Always include research_literature
  if (!ids.includes("research_literature")) {
    ids.push("research_literature");
  }
  return ids;
}

/** Get all content IDs. */
export const ALL_CONTENT_IDS = CONTENT_CATALOG.map((c) => c.id);

// -----------------------------------------------------------------------------
// INBOX EVENTS
// -----------------------------------------------------------------------------

export interface InboxEventDef {
  eventId: string;
  trigger: "first_level_up" | "first_research" | "first_model" | "level_5";
  title: string;
  message: string;
  deepLink?: {
    view: "operate" | "research" | "lab" | "inbox" | "world";
    target?: string;
  };
}

export const INBOX_EVENTS: InboxEventDef[] = [
  {
    eventId: "evt_first_level_up",
    trigger: "first_level_up",
    title: "Level Up! Upgrade Points Unlocked",
    message: "You earned UP from leveling. Spend them in Lab > Upgrades.",
    deepLink: { view: "lab", target: "upgrades" },
  },
  {
    eventId: "evt_first_research",
    trigger: "first_research",
    title: "Research Unlocked!",
    message: "Use Research Points to unlock new models, revenue streams, and hires.",
    deepLink: { view: "research" },
  },
  {
    eventId: "evt_first_model",
    trigger: "first_model",
    title: "First Model Trained!",
    message: "Your model is in Lab > Models. Publish to compete on leaderboards.",
    deepLink: { view: "lab", target: "models" },
  },
  {
    eventId: "evt_level_5",
    trigger: "level_5",
    title: "Passive Income Available",
    message: "Unlock Model API Income in Research for passive money.",
    deepLink: { view: "research" },
  },
];

// -----------------------------------------------------------------------------
// ENTITY ASSETS
// -----------------------------------------------------------------------------

export interface EntityAsset {
  id: string;
  title: string;
  slug: string;
  version: string;
  files: { image: string; depth?: string; model?: string };
  notes?: string;
}

export const ENTITY_ASSETS: EntityAsset[] = [
  {
    id: "tts_3b",
    title: "3B TTS",
    slug: "3b-tts",
    version: "v007",
    files: { image: "/assets/entities/3b-tts/3b-tts_v007_transparent.png" },
  },
  {
    id: "income_website",
    title: "Basic Website",
    slug: "basic-website",
    version: "v001",
    files: { image: "/assets/entities/basic-website/basic-website_v001_transparent.png" },
    notes: "Compact browser cartridge with HTML brackets and webpage wireframe layout",
  },
  {
    id: "tts_7b",
    title: "7B TTS",
    slug: "7b-tts",
    version: "v002",
    files: { image: "/assets/entities/7b-tts/7b-tts_v002_transparent.png" },
  },
  {
    id: "tts_30b",
    title: "30B TTS",
    slug: "30b-tts",
    version: "v003",
    files: { image: "/assets/entities/30b-tts/30b-tts_v003_transparent.png" },
  },
  {
    id: "tts_70b",
    title: "70B TTS",
    slug: "70b-tts",
    version: "v002",
    files: { image: "/assets/entities/70b-tts/70b-tts_v002_transparent.png" },
  },
];

/** Get asset by slug. */
export function getAssetBySlug(slug: string): EntityAsset | undefined {
  return ENTITY_ASSETS.find((a) => a.slug === slug);
}

/** Get image URL for a content entry. */
export function getContentImageUrl(entry: ContentEntry): string | undefined {
  if (!entry.assetSlug) return undefined;
  const asset = getAssetBySlug(entry.assetSlug);
  return asset?.files.image;
}

/** Convert name to slug. */
export function toEntitySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
