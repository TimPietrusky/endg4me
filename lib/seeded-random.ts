/**
 * Seeded pseudo-random number generator using Mulberry32 algorithm.
 * Given the same seed, produces the same sequence of random numbers.
 */

// Maximum safe integer in JavaScript: 2^53 - 1
export const MAX_SEED = Number.MAX_SAFE_INTEGER;

/**
 * Mulberry32 PRNG - fast and good quality for our use case.
 * Returns a function that generates random numbers in [0, 1).
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0; // Convert to 32-bit unsigned int
  
  return function(): number {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a random seed for a new session.
 * Uses crypto API for true randomness when available.
 */
export function generateRandomSeed(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Use crypto for better randomness - combine two 32-bit values
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    // Combine into a number smaller than MAX_SAFE_INTEGER
    return (arr[0] * 0x100000000 + arr[1]) % MAX_SEED;
  }
  // Fallback to Math.random
  return Math.floor(Math.random() * MAX_SEED);
}

/**
 * Parse seed from URL parameter.
 * Returns null if not present or invalid.
 */
export function parseSeedFromUrl(searchParams: URLSearchParams): number | null {
  const seedParam = searchParams.get("seed");
  if (!seedParam) return null;
  
  const parsed = parseInt(seedParam, 10);
  if (isNaN(parsed) || parsed < 0 || parsed > MAX_SEED) return null;
  
  return parsed;
}

