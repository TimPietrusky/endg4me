/**
 * Shared constants for the cyber monitor/hero scene.
 */

// Floating sci-fi screen dimensions
export const SCREEN_WIDTH = 4.5;
export const SCREEN_HEIGHT = 2.8;
export const SCREEN_DEPTH = 0.25; // Thicker for visible depth

// Glitch timing constraints (in seconds)
// Total glitch duration including freeze - hard capped
export const GLITCH_MIN_DURATION = 0.1;
export const GLITCH_MAX_DURATION = 0.3;

// Interval between glitches (in milliseconds)
export const GLITCH_INTERVAL_MIN = 3000; // 3 seconds
export const GLITCH_INTERVAL_MAX = 7000; // 7 seconds

// Freeze behavior - freeze ALWAYS happens within each glitch
// Freeze point is random within this progress range
export const FREEZE_PROGRESS_MIN = 0.2; // Freeze after at least 20% progress
export const FREEZE_PROGRESS_MAX = 0.8; // Freeze before 80% progress

