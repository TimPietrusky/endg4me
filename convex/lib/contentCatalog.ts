// =============================================================================
// CONTENT CATALOG - Single source of truth for all game content
// Location: convex/lib/ so both Convex functions and frontend can import
// =============================================================================

// -----------------------------------------------------------------------------
// MODEL BLUEPRINTS
// -----------------------------------------------------------------------------

export type ModelType = "llm" | "tts" | "vlm"

export interface ModelBlueprint {
  id: string
  name: string
  type: ModelType
  description: string
  minLevelToTrain: number
  trainingJobId: string
  scoreRange: { min: number; max: number }
  tags?: string[]
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
]

// -----------------------------------------------------------------------------
// JOB DEFINITIONS
// -----------------------------------------------------------------------------

export interface JobRewards {
  money: number
  xp: number
  rp: number
}

export interface JobRequirements {
  minLevel: number
  requiredResearchNodeIds?: string[]
  requiredBlueprintIds?: string[]
  requiredModelType?: ModelType // For contracts that need a trained model
}

export interface JobOutput {
  trainsBlueprintId?: string
  usesBlueprintType?: ModelType
}

export interface JobDefinition {
  jobId: string
  name: string
  description: string
  durationMs: number
  moneyCost: number
  computeRequiredCU: number
  rewards: JobRewards
  requirements: JobRequirements
  output: JobOutput
  category: "training" | "contract" | "research"
}

export const JOB_DEFS: JobDefinition[] = [
  // === TRAINING JOBS ===
  {
    jobId: "job_train_tts_3b",
    name: "Train 3B TTS",
    description: "Train a new version of your 3B TTS model.",
    durationMs: 5 * 60 * 1000, // 5 minutes
    moneyCost: 500,
    computeRequiredCU: 1,
    rewards: { money: 0, xp: 80, rp: 120 },
    requirements: {
      minLevel: 1,
      requiredBlueprintIds: ["bp_tts_3b"],
    },
    output: { trainsBlueprintId: "bp_tts_3b" },
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
]

// -----------------------------------------------------------------------------
// RESEARCH NODES
// -----------------------------------------------------------------------------

export type ResearchCategory = "model" | "capability" | "perk"
export type PerkType = "research_speed" | "money_multiplier"

export interface ResearchNodeUnlocks {
  unlocksBlueprintIds?: string[]
  unlocksJobIds?: string[]
  enablesSystemFlags?: string[]
  perkType?: PerkType
  perkValue?: number
}

export interface ResearchNode {
  nodeId: string
  category: ResearchCategory
  name: string
  description: string
  costRP: number
  minLevel: number
  prerequisiteNodes: string[]
  unlocks: ResearchNodeUnlocks
}

export const RESEARCH_NODES: ResearchNode[] = [
  // === STARTER (so Research is never dead) ===
  {
    nodeId: "rn_cap_contracts_basic",
    category: "capability",
    name: "Basic Contracts",
    description: "Unlock simple paid contracts in Operate.",
    costRP: 0,
    minLevel: 1,
    prerequisiteNodes: [],
    unlocks: {
      unlocksJobIds: ["job_contract_blog_basic"],
    },
  },
  {
    nodeId: "rn_bp_unlock_tts_3b",
    category: "model",
    name: "3B TTS Blueprint",
    description: "Unlock training for 3B TTS.",
    costRP: 0,
    minLevel: 1,
    prerequisiteNodes: [],
    unlocks: {
      unlocksBlueprintIds: ["bp_tts_3b"],
      unlocksJobIds: ["job_train_tts_3b"],
    },
  },
  {
    nodeId: "rn_perk_research_speed_1",
    category: "perk",
    name: "Research Speed I",
    description: "Earn research points a bit faster.",
    costRP: 120,
    minLevel: 1,
    prerequisiteNodes: [],
    unlocks: {
      perkType: "research_speed",
      perkValue: 10, // +10%
    },
  },

  // === EARLY PROGRESSION ===
  {
    nodeId: "rn_bp_unlock_vlm_7b",
    category: "model",
    name: "7B VLM Blueprint",
    description: "Unlock training for 7B VLM.",
    costRP: 250,
    minLevel: 2,
    prerequisiteNodes: [],
    unlocks: {
      unlocksBlueprintIds: ["bp_vlm_7b"],
      unlocksJobIds: ["job_train_vlm_7b"],
    },
  },
  {
    nodeId: "rn_cap_contracts_voice",
    category: "capability",
    name: "Voice Gigs",
    description: "Unlock audio contracts that use your TTS models.",
    costRP: 200,
    minLevel: 2,
    prerequisiteNodes: [],
    unlocks: {
      unlocksJobIds: ["job_contract_voice_pack"],
    },
  },
  {
    nodeId: "rn_cap_contracts_vision",
    category: "capability",
    name: "Vision Contracts",
    description: "Unlock image QA contracts that use your VLM models.",
    costRP: 220,
    minLevel: 3,
    prerequisiteNodes: [],
    unlocks: {
      unlocksJobIds: ["job_contract_image_qa"],
    },
  },
  {
    nodeId: "rn_bp_unlock_llm_3b",
    category: "model",
    name: "3B LLM Blueprint",
    description: "Unlock training for 3B LLM.",
    costRP: 350,
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
    name: "17B LLM Blueprint",
    description: "Unlock training for 17B LLM.",
    costRP: 900,
    minLevel: 7,
    prerequisiteNodes: ["rn_bp_unlock_llm_3b"],
    unlocks: {
      unlocksBlueprintIds: ["bp_llm_17b"],
      unlocksJobIds: ["job_train_llm_17b"],
    },
  },
  {
    nodeId: "rn_cap_model_publishing",
    category: "capability",
    name: "Model Publishing",
    description: "Publish models to the public lab and world rankings.",
    costRP: 250,
    minLevel: 4,
    prerequisiteNodes: [],
    unlocks: {
      enablesSystemFlags: ["publishing"],
    },
  },
  {
    nodeId: "rn_cap_model_api_income",
    category: "capability",
    name: "Model API Income",
    description: "Earn passive money from hosted model APIs.",
    costRP: 350,
    minLevel: 5,
    prerequisiteNodes: [],
    unlocks: {
      enablesSystemFlags: ["model_api_income"],
    },
  },
]

// -----------------------------------------------------------------------------
// INBOX EVENTS (MVP milestone notifications)
// -----------------------------------------------------------------------------

export interface InboxEventDef {
  eventId: string
  trigger: "first_level_up" | "first_research" | "first_model" | "publishing_unlocked" | "level_5"
  title: string
  message: string
  deepLink?: { view: "operate" | "research" | "lab" | "inbox" | "world"; target?: string }
}

export const INBOX_EVENTS: InboxEventDef[] = [
  {
    eventId: "evt_first_level_up",
    trigger: "first_level_up",
    title: "Level Up! Upgrade Points Unlocked",
    message: "You earned UP from leveling. Spend them in Lab > Upgrades to increase your queue, staff, or compute capacity.",
    deepLink: { view: "lab", target: "upgrades" },
  },
  {
    eventId: "evt_first_research",
    trigger: "first_research",
    title: "Research Unlocked!",
    message: "Use Research Points to unlock new models, capabilities, and perks. Check out the Models and Capabilities tabs.",
    deepLink: { view: "research" },
  },
  {
    eventId: "evt_first_model",
    trigger: "first_model",
    title: "First Model Trained!",
    message: "Your model is now in Lab > Models. Train more versions to improve scores, or use it for contracts.",
    deepLink: { view: "lab", target: "models" },
  },
  {
    eventId: "evt_publishing_unlocked",
    trigger: "publishing_unlocked",
    title: "Publishing Unlocked!",
    message: "You can now publish models to compete on the World leaderboards. Toggle visibility in Lab > Models.",
    deepLink: { view: "lab", target: "models" },
  },
  {
    eventId: "evt_level_5",
    trigger: "level_5",
    title: "Passive Income Available",
    message: "At level 5 you can unlock Model API Income in Research. Published models will earn passive money.",
    deepLink: { view: "research" },
  },
]

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

export function getBlueprintById(id: string): ModelBlueprint | undefined {
  return MODEL_BLUEPRINTS.find((bp) => bp.id === id)
}

export function getJobById(id: string): JobDefinition | undefined {
  return JOB_DEFS.find((job) => job.jobId === id)
}

export function getResearchNodeById(id: string): ResearchNode | undefined {
  return RESEARCH_NODES.find((node) => node.nodeId === id)
}

export function getJobsForBlueprint(blueprintId: string): JobDefinition[] {
  return JOB_DEFS.filter((job) => job.output.trainsBlueprintId === blueprintId)
}

export function getContractJobsForModelType(modelType: ModelType): JobDefinition[] {
  return JOB_DEFS.filter((job) => job.output.usesBlueprintType === modelType)
}

// Calculate model score from blueprint range + randomness
export function calculateModelScore(blueprint: ModelBlueprint, bonusPercent: number = 0): number {
  const { min, max } = blueprint.scoreRange
  const baseScore = min + Math.random() * (max - min)
  const bonusMultiplier = 1 + bonusPercent / 100
  return Math.round(baseScore * bonusMultiplier)
}

// Get all job IDs (for schema validation)
export const ALL_JOB_IDS = JOB_DEFS.map((j) => j.jobId)

// Get all blueprint IDs
export const ALL_BLUEPRINT_IDS = MODEL_BLUEPRINTS.map((bp) => bp.id)

// Get all research node IDs
export const ALL_RESEARCH_NODE_IDS = RESEARCH_NODES.map((n) => n.nodeId)

