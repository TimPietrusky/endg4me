// Game constants
// NOTE: Core progression (XP, levels, UP, upgrades) in ./gameConfig.ts

import { BASE_STATS } from "./gameConfig";

// Initial lab state
export const INITIAL_LAB_STATE = {
  cash: BASE_STATS.cash,
  researchPoints: BASE_STATS.researchPoints,
  juniorResearchers: 0,
};

// Initial player state
export const INITIAL_PLAYER_STATE = {
  level: 1,
  experience: 0,
  upgradePoints: 0,
  queueRank: 0,
  staffRank: 0,
  computeRank: 0,
};

// Level rewards and unlocks
export const LEVEL_REWARDS = {
  globalEfficiencyPerLevel: 0.01, // +1% per level
  clanUnlockLevel: 3,
};

// Clan bonuses
export const CLAN_BONUS = {
  xpGain: 1.05, // +5% XP
};
