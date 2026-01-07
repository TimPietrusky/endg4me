// =============================================================================
// CONTENT CATALOG - Single source of truth for all game content
// Location: convex/lib/ so both Convex functions and frontend can import
// =============================================================================

// -----------------------------------------------------------------------------
// MODEL BLUEPRINTS
// -----------------------------------------------------------------------------

export type ModelType = "llm" | "tts" | "vlm";

export interface ModelBlueprint {
  id: string;
  name: string;
  type: ModelType;
  description: string;
  minLevelToTrain: number;
  trainingJobId: string;
  scoreRange: { min: number; max: number };
  tags?: string[];
  assetSlug?: string; // Links to ENTITY_ASSETS by slug
}

export const MODEL_BLUEPRINTS: ModelBlueprint[] = [
  {
    id: "bp_tts_3b",
    name: "3B TTS",
    type: "tts",
    description: "A small voice model for audio gigs.",
    minLevelToTrain: 1,
    trainingJobId: "job_train_tts_3b",
    scoreRange: { min: 40, max: 70 },
    assetSlug: "3b-tts",
  },
  {
    id: "bp_tts_7b",
    name: "7B TTS",
    type: "tts",
    description: "A mid-range voice model with better clarity.",
    minLevelToTrain: 3,
    trainingJobId: "job_train_tts_7b",
    scoreRange: { min: 55, max: 82 },
    assetSlug: "7b-tts",
  },
  {
    id: "bp_tts_30b",
    name: "30B TTS",
    type: "tts",
    description: "A large voice model with rich intonation.",
    minLevelToTrain: 5,
    trainingJobId: "job_train_tts_30b",
    scoreRange: { min: 70, max: 92 },
    assetSlug: "30b-tts",
  },
  {
    id: "bp_tts_70b",
    name: "70B TTS",
    type: "tts",
    description: "A massive voice model with studio-quality output.",
    minLevelToTrain: 7,
    trainingJobId: "job_train_tts_70b",
    scoreRange: { min: 85, max: 99 },
    assetSlug: "70b-tts",
  },
  {
    id: "bp_vlm_7b",
    name: "7B VLM",
    type: "vlm",
    description: "A vision-language model for image understanding contracts.",
    minLevelToTrain: 2,
    trainingJobId: "job_train_vlm_7b",
    scoreRange: { min: 55, max: 85 },
  },
  {
    id: "bp_llm_3b",
    name: "3B LLM",
    type: "llm",
    description: "A small text model for basic writing work.",
    minLevelToTrain: 3,
    trainingJobId: "job_train_llm_3b",
    scoreRange: { min: 45, max: 75 },
  },
  {
    id: "bp_llm_17b",
    name: "17B LLM",
    type: "llm",
    description: "A stronger text model that wins premium contracts.",
    minLevelToTrain: 7,
    trainingJobId: "job_train_llm_17b",
    scoreRange: { min: 65, max: 95 },
  },
];

// -----------------------------------------------------------------------------
// JOB DEFINITIONS
// -----------------------------------------------------------------------------

export interface JobRewards {
  money: number;
  xp: number;
  rp: number;
}

export interface JobRequirements {
  minLevel: number;
  requiredResearchNodeIds?: string[];
  requiredBlueprintIds?: string[];
  requiredModelType?: ModelType; // For contracts that need a trained model
}

export interface JobOutput {
  trainsBlueprintId?: string;
  usesBlueprintType?: ModelType;
  hiresRole?: string;
  // For hire jobs: which lab stat is boosted and by how much
  hireStat?: "queue" | "compute" | "speed" | "moneyMultiplier" | "staff";
  hireBonus?: number; // +1 for capacity stats, +X% for percentage stats
}

export interface JobDefinition {
  jobId: string;
  name: string;
  description: string;
  durationMs: number;
  moneyCost: number;
  computeRequiredCU: number;
  rewards: JobRewards;
  requirements: JobRequirements;
  output: JobOutput;
  category: "training" | "contract" | "research" | "revenue" | "hire";
}

export const JOB_DEFS: JobDefinition[] = [
  // === TRAINING JOBS ===
  {
    jobId: "job_train_tts_3b",
    name: "Train 3B TTS",
    description: "Train a new version of your 3B TTS model.",
    durationMs: 2 * 60 * 1000, // 2 minutes
    moneyCost: 500,
    computeRequiredCU: 1,
    rewards: { money: 0, xp: 50, rp: 125 },
    requirements: {
      minLevel: 1,
      requiredBlueprintIds: ["bp_tts_3b"],
    },
    output: { trainsBlueprintId: "bp_tts_3b" },
    category: "training",
  },
  {
    jobId: "job_train_tts_7b",
    name: "Train 7B TTS",
    description: "Train a new version of your 7B TTS model.",
    durationMs: 6 * 60 * 1000, // 6 minutes
    moneyCost: 1000,
    computeRequiredCU: 1,
    rewards: { money: 0, xp: 100, rp: 200 },
    requirements: {
      minLevel: 3,
      requiredBlueprintIds: ["bp_tts_7b"],
    },
    output: { trainsBlueprintId: "bp_tts_7b" },
    category: "training",
  },
  {
    jobId: "job_train_tts_30b",
    name: "Train 30B TTS",
    description: "Train a new version of your 30B TTS model.",
    durationMs: 15 * 60 * 1000, // 15 minutes
    moneyCost: 2500,
    computeRequiredCU: 2,
    rewards: { money: 0, xp: 200, rp: 400 },
    requirements: {
      minLevel: 5,
      requiredBlueprintIds: ["bp_tts_30b"],
    },
    output: { trainsBlueprintId: "bp_tts_30b" },
    category: "training",
  },
  {
    jobId: "job_train_tts_70b",
    name: "Train 70B TTS",
    description: "Train a new version of your 70B TTS model.",
    durationMs: 25 * 60 * 1000, // 25 minutes
    moneyCost: 5000,
    computeRequiredCU: 3,
    rewards: { money: 0, xp: 350, rp: 600 },
    requirements: {
      minLevel: 7,
      requiredBlueprintIds: ["bp_tts_70b"],
    },
    output: { trainsBlueprintId: "bp_tts_70b" },
    category: "training",
  },
  {
    jobId: "job_train_vlm_7b",
    name: "Train 7B VLM",
    description: "Train a new version of your 7B VLM model.",
    durationMs: 12 * 60 * 1000, // 12 minutes
    moneyCost: 1200,
    computeRequiredCU: 1,
    rewards: { money: 0, xp: 140, rp: 260 },
    requirements: {
      minLevel: 2,
      requiredBlueprintIds: ["bp_vlm_7b"],
    },
    output: { trainsBlueprintId: "bp_vlm_7b" },
    category: "training",
  },
  {
    jobId: "job_train_llm_3b",
    name: "Train 3B LLM",
    description: "Train a new version of your 3B LLM model.",
    durationMs: 8 * 60 * 1000, // 8 minutes
    moneyCost: 900,
    computeRequiredCU: 1,
    rewards: { money: 0, xp: 120, rp: 200 },
    requirements: {
      minLevel: 3,
      requiredBlueprintIds: ["bp_llm_3b"],
    },
    output: { trainsBlueprintId: "bp_llm_3b" },
    category: "training",
  },
  {
    jobId: "job_train_llm_17b",
    name: "Train 17B LLM",
    description: "Train a new version of your 17B LLM model.",
    durationMs: 20 * 60 * 1000, // 20 minutes
    moneyCost: 3000,
    computeRequiredCU: 2,
    rewards: { money: 0, xp: 260, rp: 480 },
    requirements: {
      minLevel: 7,
      requiredBlueprintIds: ["bp_llm_17b"],
    },
    output: { trainsBlueprintId: "bp_llm_17b" },
    category: "training",
  },

  // === CONTRACT JOBS ===
  {
    jobId: "job_contract_blog_basic",
    name: "Blog Post Batch",
    description: "Deliver basic blog posts using your best LLM.",
    durationMs: 4 * 60 * 1000, // 4 minutes
    moneyCost: 0,
    computeRequiredCU: 1,
    rewards: { money: 450, xp: 60, rp: 0 },
    requirements: {
      minLevel: 1,
      requiredResearchNodeIds: ["rn_cap_contracts_basic"],
      requiredModelType: "llm",
    },
    output: { usesBlueprintType: "llm" },
    category: "contract",
  },
  {
    jobId: "job_contract_voice_pack",
    name: "Voiceover Pack",
    description: "Generate voiceovers using your best TTS.",
    durationMs: 4 * 60 * 1000, // 4 minutes
    moneyCost: 0,
    computeRequiredCU: 1,
    rewards: { money: 520, xp: 70, rp: 0 },
    requirements: {
      minLevel: 2,
      requiredResearchNodeIds: ["rn_cap_contracts_voice"],
      requiredModelType: "tts",
    },
    output: { usesBlueprintType: "tts" },
    category: "contract",
  },
  {
    jobId: "job_contract_image_qa",
    name: "Image QA Contract",
    description: "Answer image questions using your best VLM.",
    durationMs: 6 * 60 * 1000, // 6 minutes
    moneyCost: 0,
    computeRequiredCU: 1,
    rewards: { money: 700, xp: 90, rp: 0 },
    requirements: {
      minLevel: 3,
      requiredResearchNodeIds: ["rn_cap_contracts_vision"],
      requiredModelType: "vlm",
    },
    output: { usesBlueprintType: "vlm" },
    category: "contract",
  },

  // === RESEARCH JOB (always available RP trickle) ===
  {
    jobId: "job_research_literature",
    name: "Literature Sweep",
    description: "Do foundational research to earn RP steadily.",
    durationMs: 3 * 60 * 1000, // 3 minutes
    moneyCost: 150,
    computeRequiredCU: 0,
    rewards: { money: 0, xp: 40, rp: 60 },
    requirements: {
      minLevel: 1,
    },
    output: {},
    category: "research",
  },

  // === INCOME JOBS (freelance, no GPU needed) ===
  {
    jobId: "job_income_basic_website",
    name: "Basic Website",
    description: "Build a simple website for a client. Pure freelance work.",
    durationMs: 3 * 60 * 1000, // 3 minutes
    moneyCost: 0,
    computeRequiredCU: 0,
    rewards: { money: 200, xp: 30, rp: 0 },
    requirements: {
      minLevel: 1,
      requiredResearchNodeIds: ["rn_income_basic_website"],
    },
    output: {},
    category: "revenue",
  },
  {
    jobId: "job_income_api_integration",
    name: "API Integration Gig",
    description:
      "Integrate third-party APIs for a startup. More complex freelance.",
    durationMs: 5 * 60 * 1000, // 5 minutes
    moneyCost: 0,
    computeRequiredCU: 0,
    rewards: { money: 400, xp: 50, rp: 0 },
    requirements: {
      minLevel: 3,
      requiredResearchNodeIds: ["rn_income_api_integration"],
    },
    output: {},
    category: "revenue",
  },

  // === HIRE JOBS (temporary boosts, cost money) ===
  // Each hire boosts one of the 5 lab stats while active
  {
    jobId: "job_hire_junior_researcher",
    name: "Hire Junior Researcher",
    description: "Hire a junior to help. +1 queue slot for 8 minutes.",
    durationMs: 8 * 60 * 1000, // 8 minutes
    moneyCost: 300,
    computeRequiredCU: 0,
    rewards: { money: 0, xp: 0, rp: 0 },
    requirements: {
      minLevel: 2,
      requiredResearchNodeIds: ["rn_hire_junior_researcher"],
    },
    output: { hiresRole: "junior_researcher", hireStat: "queue", hireBonus: 1 },
    category: "hire",
  },
  {
    jobId: "job_hire_optimization_specialist",
    name: "Hire Optimization Specialist",
    description: "Speed expert joins. +15% speed for 10 minutes.",
    durationMs: 10 * 60 * 1000, // 10 minutes
    moneyCost: 1000,
    computeRequiredCU: 0,
    rewards: { money: 0, xp: 0, rp: 0 },
    requirements: {
      minLevel: 3,
      requiredResearchNodeIds: ["rn_hire_optimization_specialist"],
    },
    output: { hiresRole: "optimization_specialist", hireStat: "speed", hireBonus: 15 },
    category: "hire",
  },
  {
    jobId: "job_hire_hr_manager",
    name: "Hire HR Manager",
    description: "Talent scout joins. +1 team size for 15 minutes.",
    durationMs: 15 * 60 * 1000, // 15 minutes
    moneyCost: 500,
    computeRequiredCU: 0,
    rewards: { money: 0, xp: 0, rp: 0 },
    requirements: {
      minLevel: 5,
      requiredResearchNodeIds: ["rn_hire_hr_manager"],
    },
    output: { hiresRole: "hr_manager", hireStat: "staff", hireBonus: 1 },
    category: "hire",
  },
  {
    jobId: "job_hire_business_partner",
    name: "Hire Business Partner",
    description: "Partner up for deals. +25% money multiplier for 15 minutes.",
    durationMs: 15 * 60 * 1000, // 15 minutes
    moneyCost: 900,
    computeRequiredCU: 0,
    rewards: { money: 0, xp: 0, rp: 0 },
    requirements: {
      minLevel: 6,
      requiredResearchNodeIds: ["rn_hire_business_partner"],
    },
    output: { hiresRole: "business_partner", hireStat: "moneyMultiplier", hireBonus: 25 },
    category: "hire",
  },
  {
    jobId: "job_hire_senior_engineer",
    name: "Hire Senior Engineer",
    description: "Top talent joins. +1 compute for 20 minutes.",
    durationMs: 20 * 60 * 1000, // 20 minutes
    moneyCost: 1500,
    computeRequiredCU: 0,
    rewards: { money: 0, xp: 0, rp: 0 },
    requirements: {
      minLevel: 10,
      requiredResearchNodeIds: ["rn_hire_senior_engineer"],
    },
    output: { hiresRole: "senior_engineer", hireStat: "compute", hireBonus: 1 },
    category: "hire",
  },
];

// -----------------------------------------------------------------------------
// RESEARCH NODES
// -----------------------------------------------------------------------------

export type ResearchCategory = "model" | "revenue" | "perk" | "hiring";
export type PerkType = "speed" | "money_multiplier";

export interface ResearchNodeUnlocks {
  unlocksBlueprintIds?: string[];
  unlocksJobIds?: string[];
  enablesSystemFlags?: string[];
  perkType?: PerkType;
  perkValue?: number;
}

export interface ResearchNode {
  nodeId: string;
  category: ResearchCategory;
  name: string;
  description: string;
  costRP: number;
  durationMs: number; // Time to complete research (same task system as jobs)
  minLevel: number;
  prerequisiteNodes: string[];
  unlocks: ResearchNodeUnlocks;
}

export const RESEARCH_NODES: ResearchNode[] = [
  // === INCOME (freelance work, no models needed) ===
  {
    nodeId: "rn_income_basic_website",
    category: "revenue",
    name: "Basic Website Gigs",
    description: "Unlock freelance website work to earn money.",
    costRP: 0,
    durationMs: 30 * 1000, // 30s (free starter)
    minLevel: 1,
    prerequisiteNodes: [],
    unlocks: {
      unlocksJobIds: ["job_income_basic_website"],
    },
  },
  {
    nodeId: "rn_income_api_integration",
    category: "revenue",
    name: "API Integration Gigs",
    description: "Unlock more complex freelance integration work.",
    costRP: 180,
    durationMs: 2 * 60 * 1000, // 2m
    minLevel: 3,
    prerequisiteNodes: ["rn_income_basic_website"],
    unlocks: {
      unlocksJobIds: ["job_income_api_integration"],
    },
  },

  // === MONETIZATION (ways to make money with models) ===
  {
    nodeId: "rn_cap_contracts_basic",
    category: "revenue",
    name: "Basic Contracts",
    description: "Unlock simple paid contracts in Operate.",
    costRP: 0,
    durationMs: 30 * 1000, // 30s (free starter)
    minLevel: 1,
    prerequisiteNodes: [],
    unlocks: {
      unlocksJobIds: ["job_contract_blog_basic"],
    },
  },
  {
    nodeId: "rn_bp_unlock_tts_3b",
    category: "model",
    name: "3B TTS",
    description: "Unlock training for 3B TTS.",
    costRP: 0,
    durationMs: 30 * 1000, // 30s (free starter)
    minLevel: 1,
    prerequisiteNodes: [],
    unlocks: {
      unlocksBlueprintIds: ["bp_tts_3b"],
      unlocksJobIds: ["job_train_tts_3b"],
    },
  },
  {
    nodeId: "rn_perk_speed_1",
    category: "perk",
    name: "Speed I",
    description: "Complete all tasks a bit faster.",
    costRP: 120,
    durationMs: 1 * 60 * 1000, // 1m
    minLevel: 1,
    prerequisiteNodes: [],
    unlocks: {
      perkType: "speed",
      perkValue: 10, // +10%
    },
  },

  // === EARLY PROGRESSION ===
  {
    nodeId: "rn_bp_unlock_vlm_7b",
    category: "model",
    name: "7B VLM",
    description: "Unlock training for 7B VLM.",
    costRP: 250,
    durationMs: 3 * 60 * 1000, // 3m
    minLevel: 2,
    prerequisiteNodes: [],
    unlocks: {
      unlocksBlueprintIds: ["bp_vlm_7b"],
      unlocksJobIds: ["job_train_vlm_7b"],
    },
  },
  {
    nodeId: "rn_cap_contracts_voice",
    category: "revenue",
    name: "Voice Gigs",
    description: "Unlock audio contracts that use your TTS models.",
    costRP: 200,
    durationMs: 2 * 60 * 1000, // 2m
    minLevel: 2,
    prerequisiteNodes: [],
    unlocks: {
      unlocksJobIds: ["job_contract_voice_pack"],
    },
  },
  {
    nodeId: "rn_cap_contracts_vision",
    category: "revenue",
    name: "Vision Contracts",
    description: "Unlock image QA contracts that use your VLM models.",
    costRP: 220,
    durationMs: 2.5 * 60 * 1000, // 2.5m
    minLevel: 3,
    prerequisiteNodes: [],
    unlocks: {
      unlocksJobIds: ["job_contract_image_qa"],
    },
  },
  {
    nodeId: "rn_bp_unlock_llm_3b",
    category: "model",
    name: "3B LLM",
    description: "Unlock training for 3B LLM.",
    costRP: 350,
    durationMs: 4 * 60 * 1000, // 4m
    minLevel: 3,
    prerequisiteNodes: [],
    unlocks: {
      unlocksBlueprintIds: ["bp_llm_3b"],
      unlocksJobIds: ["job_train_llm_3b"],
    },
  },
  {
    nodeId: "rn_perk_money_multiplier_1",
    category: "perk",
    name: "Payout Booster I",
    description: "Earn a bit more money from contracts.",
    costRP: 180,
    durationMs: 2 * 60 * 1000, // 2m
    minLevel: 3,
    prerequisiteNodes: [],
    unlocks: {
      perkType: "money_multiplier",
      perkValue: 0.1, // +10%
    },
  },

  // === MID-GAME HOOKS ===
  {
    nodeId: "rn_bp_unlock_llm_17b",
    category: "model",
    name: "17B LLM",
    description: "Unlock training for 17B LLM.",
    costRP: 900,
    durationMs: 12 * 60 * 1000, // 12m
    minLevel: 7,
    prerequisiteNodes: ["rn_bp_unlock_llm_3b"],
    unlocks: {
      unlocksBlueprintIds: ["bp_llm_17b"],
      unlocksJobIds: ["job_train_llm_17b"],
    },
  },
  {
    nodeId: "rn_cap_model_api_income",
    category: "revenue",
    name: "Model API Income",
    description: "Earn passive money from hosted model APIs.",
    costRP: 350,
    durationMs: 4 * 60 * 1000, // 4m
    minLevel: 5,
    prerequisiteNodes: [],
    unlocks: {
      enablesSystemFlags: ["model_api_income"],
    },
  },
  {
    nodeId: "rn_cap_model_licensing",
    category: "revenue",
    name: "Model Licensing",
    description: "License your models to enterprises for big payouts.",
    costRP: 500,
    durationMs: 6 * 60 * 1000, // 6m
    minLevel: 8,
    prerequisiteNodes: ["rn_cap_model_api_income"],
    unlocks: {
      enablesSystemFlags: ["model_licensing"],
    },
  },

  // === HIRING (unlock hire types) ===
  // Each hire unlocks temporary boosts to one of the 5 lab stats
  {
    nodeId: "rn_hire_junior_researcher",
    category: "hiring",
    name: "Junior Researcher",
    description: "Unlock hiring junior researchers for +1 queue.",
    costRP: 150,
    durationMs: 1.5 * 60 * 1000, // 1.5m
    minLevel: 2,
    prerequisiteNodes: [],
    unlocks: {
      unlocksJobIds: ["job_hire_junior_researcher"],
    },
  },
  {
    nodeId: "rn_hire_optimization_specialist",
    category: "hiring",
    name: "Optimization Specialist",
    description: "Unlock hiring optimization specialists for +15% speed.",
    costRP: 300,
    durationMs: 3 * 60 * 1000, // 3m
    minLevel: 3,
    prerequisiteNodes: ["rn_hire_junior_researcher"],
    unlocks: {
      unlocksJobIds: ["job_hire_optimization_specialist"],
    },
  },
  {
    nodeId: "rn_hire_hr_manager",
    category: "hiring",
    name: "HR Manager",
    description: "Unlock hiring HR managers for +1 team size.",
    costRP: 250,
    durationMs: 3 * 60 * 1000, // 3m
    minLevel: 5,
    prerequisiteNodes: ["rn_hire_optimization_specialist"],
    unlocks: {
      unlocksJobIds: ["job_hire_hr_manager"],
    },
  },
  {
    nodeId: "rn_hire_business_partner",
    category: "hiring",
    name: "Business Partner",
    description: "Unlock hiring business partners for +25% money multiplier.",
    costRP: 450,
    durationMs: 5 * 60 * 1000, // 5m
    minLevel: 6,
    prerequisiteNodes: ["rn_hire_hr_manager"],
    unlocks: {
      unlocksJobIds: ["job_hire_business_partner"],
    },
  },
  {
    nodeId: "rn_hire_senior_engineer",
    category: "hiring",
    name: "Senior Engineer",
    description: "Unlock hiring senior engineers for +1 compute.",
    costRP: 700,
    durationMs: 8 * 60 * 1000, // 8m
    minLevel: 10,
    prerequisiteNodes: ["rn_hire_business_partner"],
    unlocks: {
      unlocksJobIds: ["job_hire_senior_engineer"],
    },
  },
];

// -----------------------------------------------------------------------------
// INBOX EVENTS (MVP milestone notifications)
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
    message:
      "You earned UP from leveling. Spend them in Lab > Upgrades to increase your queue, staff, or compute capacity.",
    deepLink: { view: "lab", target: "upgrades" },
  },
  {
    eventId: "evt_first_research",
    trigger: "first_research",
    title: "Research Unlocked!",
    message:
      "Use Research Points to unlock new models, capabilities, and perks. Check out the Models and Capabilities tabs.",
    deepLink: { view: "research" },
  },
  {
    eventId: "evt_first_model",
    trigger: "first_model",
    title: "First Model Trained!",
    message:
      "Your model is now in Lab > Models. Train more versions to improve scores, or publish to compete on leaderboards.",
    deepLink: { view: "lab", target: "models" },
  },
  {
    eventId: "evt_level_5",
    trigger: "level_5",
    title: "Passive Income Available",
    message:
      "At level 5 you can unlock Model API Income in Research. Published models will earn passive money.",
    deepLink: { view: "research" },
  },
];

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

export function getBlueprintById(id: string): ModelBlueprint | undefined {
  return MODEL_BLUEPRINTS.find((bp) => bp.id === id);
}

export function getJobById(id: string): JobDefinition | undefined {
  return JOB_DEFS.find((job) => job.jobId === id);
}

export function getResearchNodeById(id: string): ResearchNode | undefined {
  return RESEARCH_NODES.find((node) => node.nodeId === id);
}

export function getJobsForBlueprint(blueprintId: string): JobDefinition[] {
  return JOB_DEFS.filter((job) => job.output.trainsBlueprintId === blueprintId);
}

export function getContractJobsForModelType(
  modelType: ModelType
): JobDefinition[] {
  return JOB_DEFS.filter((job) => job.output.usesBlueprintType === modelType);
}

// Calculate model score from blueprint range + randomness
export function calculateModelScore(
  blueprint: ModelBlueprint,
  bonusPercent: number = 0
): number {
  const { min, max } = blueprint.scoreRange;
  const baseScore = min + Math.random() * (max - min);
  const bonusMultiplier = 1 + bonusPercent / 100;
  return Math.round(baseScore * bonusMultiplier);
}

// Get all job IDs (for schema validation)
export const ALL_JOB_IDS = JOB_DEFS.map((j) => j.jobId);

// Get all blueprint IDs
export const ALL_BLUEPRINT_IDS = MODEL_BLUEPRINTS.map((bp) => bp.id);

// Get all research node IDs
export const ALL_RESEARCH_NODE_IDS = RESEARCH_NODES.map((n) => n.nodeId);

// -----------------------------------------------------------------------------
// ENTITY ASSETS (manga-cyberpunk icons for entities)
// -----------------------------------------------------------------------------

export type AssetCategory = "model" | "revenue" | "compute" | "research" | "hiring";

export interface EntityAsset {
  id: string;
  title: string;
  category: AssetCategory;
  slug: string;
  version: string;
  files: {
    image: string;
    depth?: string;
    model?: string; // GLB 3D model
  };
  notes?: string;
}

// Asset registry - populated as assets are generated via /asset command
export const ENTITY_ASSETS: EntityAsset[] = [
  {
    id: "model_3b_tts",
    title: "3B TTS",
    category: "model",
    slug: "3b-tts",
    version: "v007",
    files: {
      image: "/assets/entities/3b-tts/3b-tts_v007.png",
    },
    notes: "compact audio synthesis module with single speaker, entry-level device",
  },
  {
    id: "model_7b_tts",
    title: "7B TTS",
    category: "model",
    slug: "7b-tts",
    version: "v002",
    files: {
      image: "/assets/entities/7b-tts/7b-tts_v002.png",
    },
    notes: "dual-speaker audio synthesis module",
  },
  {
    id: "model_30b_tts",
    title: "30B TTS",
    category: "model",
    slug: "30b-tts",
    version: "v003",
    files: {
      image: "/assets/entities/30b-tts/30b-tts_v003.png",
    },
    notes: "stacked dual-rack audio synthesis system",
  },
  {
    id: "model_70b_tts",
    title: "70B TTS",
    category: "model",
    slug: "70b-tts",
    version: "v002",
    files: {
      image: "/assets/entities/70b-tts/70b-tts_v002.png",
    },
    notes: "massive industrial-scale audio synthesis system",
  },
];

// -----------------------------------------------------------------------------
// ASSET HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Get asset by entity slug (e.g. "3b-tts")
 */
export function getAssetBySlug(slug: string): EntityAsset | undefined {
  return ENTITY_ASSETS.find((a) => a.slug === slug);
}

/**
 * Get asset by entity ID (e.g. "model_3b_tts")
 */
export function getAssetById(id: string): EntityAsset | undefined {
  return ENTITY_ASSETS.find((a) => a.id === id);
}

/**
 * Get image URL for an entity by slug
 * Returns undefined if no asset exists
 */
export function getEntityImageUrl(slug: string): string | undefined {
  const asset = getAssetBySlug(slug);
  return asset?.files.image;
}

/**
 * Get depth map URL for an entity by slug
 * Returns undefined if no asset exists
 */
export function getEntityDepthUrl(slug: string): string | undefined {
  const asset = getAssetBySlug(slug);
  return asset?.files.depth;
}

/**
 * Get 3D model URL for an entity by slug
 * Returns undefined if no asset exists
 */
export function getEntityModelUrl(slug: string): string | undefined {
  const asset = getAssetBySlug(slug);
  return asset?.files.model;
}

/**
 * Convert entity name to slug (lowercase kebab-case)
 * "3B TTS" -> "3b-tts"
 * "Basic Website" -> "basic-website"
 */
export function toEntitySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Generate file paths for a new asset
 */
export function generateAssetPaths(
  slug: string,
  version: string = "v001"
): { image: string; depth: string } {
  return {
    image: `/assets/entities/${slug}/${slug}_${version}.png`,
    depth: `/assets/entities/${slug}/${slug}_${version}_depth.png`,
  };
}
