#!/usr/bin/env node
/**
 * generate-image.mjs - CLI tool for generating game assets using RunPod AI
 * 
 * Usage:
 *   node scripts/generate-image.mjs --prompt "description" [options]
 * 
 * Options:
 *   --prompt, -p      Image description (required)
 *   --output, -o      Output filename (default: auto-generated timestamp)
 *   --aspect, -a      Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4 (default: 16:9)
 *   --seed, -s        Seed for reproducibility (default: random)
 *   --help, -h        Show this help message
 * 
 * Examples:
 *   node scripts/generate-image.mjs --prompt "cyberpunk AI datacenter with neon lights"
 *   node scripts/generate-image.mjs -p "futuristic lab" -a 1:1 -o lab-background.jpg
 *   node scripts/generate-image.mjs -p "neural network" --seed 42
 * 
 * Environment:
 *   Requires RUNPOD_API_KEY in .env file
 */

import dotenv from "dotenv";
import { runpod } from "@runpod/ai-sdk-provider";
import { generateImage } from "ai";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Load env from project root - check .env.local first (Next.js convention), fallback to .env
const envLocalPath = join(projectRoot, ".env.local");
const envPath = join(projectRoot, ".env");
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, quiet: true });
} else {
  dotenv.config({ path: envPath, quiet: true });
}

const VALID_ASPECTS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

function showHelp() {
  console.log(`
generate-image.mjs - Generate game assets using RunPod AI

USAGE:
  node scripts/generate-image.mjs --prompt "description" [options]

OPTIONS:
  --prompt, -p      Image description (required)
  --output, -o      Output filename (default: auto-generated)
  --aspect, -a      Aspect ratio: ${VALID_ASPECTS.join(", ")} (default: 16:9)
  --seed, -s        Seed for reproducibility (default: random)
  --help, -h        Show this help message

EXAMPLES:
  node scripts/generate-image.mjs --prompt "cyberpunk AI datacenter"
  node scripts/generate-image.mjs -p "futuristic lab" -a 1:1 -o lab.jpg
  node scripts/generate-image.mjs -p "neural network" --seed 42

OUTPUT:
  Images are saved to public/ folder by default.
  Supported formats: .jpg, .png (based on output filename)

ENVIRONMENT:
  Requires RUNPOD_API_KEY in .env file
`);
  process.exit(0);
}

function parseArgs(args) {
  const result = {
    prompt: null,
    output: null,
    aspect: "16:9",
    seed: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--help":
      case "-h":
        showHelp();
        break;
      case "--prompt":
      case "-p":
        result.prompt = next;
        i++;
        break;
      case "--output":
      case "-o":
        result.output = next;
        i++;
        break;
      case "--aspect":
      case "-a":
        result.aspect = next;
        i++;
        break;
      case "--seed":
      case "-s":
        result.seed = parseInt(next, 10);
        i++;
        break;
    }
  }

  return result;
}

function validateArgs(args) {
  if (!args.prompt) {
    console.error("ERROR: --prompt is required\n");
    console.error("Run with --help for usage information");
    process.exit(1);
  }

  if (!VALID_ASPECTS.includes(args.aspect)) {
    console.error(`ERROR: Invalid aspect ratio "${args.aspect}"`);
    console.error(`Valid options: ${VALID_ASPECTS.join(", ")}`);
    process.exit(1);
  }

  if (!process.env.RUNPOD_API_KEY) {
    console.error("ERROR: RUNPOD_API_KEY not found in environment");
    console.error("Add it to your .env file");
    process.exit(1);
  }
}

function generateFilename(output) {
  if (output) {
    // Ensure it ends with .jpg or .png
    if (!output.endsWith(".jpg") && !output.endsWith(".png")) {
      return output + ".jpg";
    }
    return output;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `generated-${timestamp}.jpg`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Show help if no args
  if (process.argv.length <= 2) {
    showHelp();
  }

  validateArgs(args);

  const filename = generateFilename(args.output);
  const outputPath = join(projectRoot, "public", filename);

  // Ensure public directory exists
  const publicDir = dirname(outputPath);
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  console.log("Generating image...");
  console.log(`  Prompt: "${args.prompt}"`);
  console.log(`  Aspect: ${args.aspect}`);
  if (args.seed !== null) {
    console.log(`  Seed: ${args.seed}`);
  }

  try {
    const options = {
      model: runpod.image("pruna/p-image-t2i"),
      prompt: args.prompt,
      aspectRatio: args.aspect,
    };

    if (args.seed !== null) {
      options.seed = args.seed;
    }

    const { image } = await generateImage(options);

    writeFileSync(outputPath, image.uint8Array);

    console.log(`\nSaved: ${filename}`);
    console.log(`Path: public/${filename}`);
    console.log(`Size: ${(image.uint8Array.length / 1024).toFixed(1)}KB`);
  } catch (err) {
    console.error("\nERROR:", err?.message || err);
    process.exit(1);
  }
}

main();

