#!/usr/bin/env node

/**
 * Reset game state for development testing
 * 
 * Usage:
 *   node scripts/reset-game.mjs                    # Reset by email prompt
 *   node scripts/reset-game.mjs --email=you@example.com
 *   node scripts/reset-game.mjs --all              # Nuclear: reset ALL users' game data
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import readline from 'readline';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env
config({ path: resolve(process.cwd(), '.env.local') });

const args = process.argv.slice(2);

// Get deployment URL from env
const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!deploymentUrl) {
  console.error('Error: NEXT_PUBLIC_CONVEX_URL not found in .env.local');
  process.exit(1);
}

const client = new ConvexHttpClient(deploymentUrl);

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  // Check for --all flag (nuclear option)
  if (args.includes('--all')) {
    const confirm = await prompt('This will delete ALL game data for ALL users. Type "yes" to confirm: ');
    if (confirm !== 'yes') {
      console.log('Aborted.');
      process.exit(0);
    }
    
    console.log('\nResetting ALL game data...');
    console.log('Note: Use Convex dashboard for this operation (internal mutation).');
    console.log('Run: npx convex run dev:resetAllGameData');
    return;
  }

  // Get email from args or prompt
  let email = args.find(a => a.startsWith('--email='))?.split('=')[1];
  
  if (!email) {
    email = await prompt('Enter your email to reset game state: ');
  }

  if (!email) {
    console.error('Email required');
    process.exit(1);
  }

  console.log(`\nResetting game state for: ${email}`);
  
  try {
    const result = await client.mutation(api.dev.resetGameStateByEmail, { email });
    
    console.log('\n--- Reset Complete ---');
    console.log(`User ID: ${result.userId}`);
    console.log(`Labs deleted: ${result.deletedLabs}`);
    console.log(`Tasks deleted: ${result.deletedTasks}`);
    console.log(`Models deleted: ${result.deletedModels}`);
    console.log(`Research deleted: ${result.deletedPlayerResearch}`);
    console.log(`Notifications deleted: ${result.deletedNotifications}`);
    console.log('\nRefresh your browser to start fresh!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
