#!/usr/bin/env node
/**
 * generate-image.mjs - CLI tool for generating game assets using AI
 *
 * Usage:
 *   node scripts/generate-image.mjs --prompt "description" [options]
 *
 * Options:
 *   --prompt, -p      Image description (required)
 *   --model, -m       Model to use: flux2, p-image (default: flux2)
 *   --input, -i       Input image path for editing (optional, enables edit mode)
 *   --output, -o      Output filename (default: auto-generated timestamp)
 *   --aspect, -a      Aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4 (default: 16:9)
 *   --seed, -s        Seed for reproducibility (default: random)
 *   --help, -h        Show this help message
 *
 * Models:
 *   flux2    - fal.ai Flux 2 Turbo (default)
 *              t2i: fal-ai/flux-2/turbo
 *              edit: fal-ai/flux-2/turbo/edit
 *   p-image  - RunPod p-image
 *              t2i: pruna/p-image-t2i
 *              edit: pruna/p-image-edit
 *
 * Examples:
 *   node scripts/generate-image.mjs --prompt "cyberpunk AI datacenter"
 *   node scripts/generate-image.mjs -p "futuristic lab" -m p-image
 *   node scripts/generate-image.mjs -p "add neon glow" -i source.jpg
 *
 * Environment:
 *   FAL_API_KEY (for flux2)
 *   RUNPOD_API_KEY (for p-image)
 */

import dotenv from "dotenv";
import { fal } from "@ai-sdk/fal";
import { runpod } from "@runpod/ai-sdk-provider";
import { generateImage } from "ai";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join, resolve, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Load env from project root
const envLocalPath = join(projectRoot, ".env.local");
const envPath = join(projectRoot, ".env");
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, quiet: true });
} else {
  dotenv.config({ path: envPath, quiet: true });
}

const VALID_ASPECTS = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const VALID_MODELS = ["flux2", "p-image"];

const MODEL_CONFIG = {
  flux2: {
    provider: "fal",
    t2i: "fal-ai/flux-2/turbo",
    edit: "fal-ai/flux-2/turbo/edit",
    envKey: "FAL_API_KEY",
    supportsEdit: true,
  },
  "p-image": {
    provider: "runpod",
    t2i: "pruna/p-image-t2i",
    edit: "pruna/p-image-edit",
    envKey: "RUNPOD_API_KEY",
    supportsEdit: true,
  },
};

function showHelp() {
  console.log(`
generate-image.mjs - Generate game assets using AI

USAGE:
  node scripts/generate-image.mjs --prompt "description" [options]

OPTIONS:
  --prompt, -p      Image description (required)
  --model, -m       Model: ${VALID_MODELS.join(", ")} (default: flux2)
  --input, -i       Input image for editing (flux2 only)
  --output, -o      Output filename (default: auto-generated)
  --aspect, -a      Aspect ratio: ${VALID_ASPECTS.join(", ")} (default: 16:9)
  --seed, -s        Seed for reproducibility (default: random)
  --help, -h        Show this help message

MODELS:
  flux2     fal.ai Flux 2 Turbo (FAL_API_KEY)
            - t2i: fal-ai/flux-2/turbo
            - edit: fal-ai/flux-2/turbo/edit
  p-image   RunPod p-image (RUNPOD_API_KEY)
            - t2i: pruna/p-image-t2i
            - edit: pruna/p-image-edit

EXAMPLES:
  node scripts/generate-image.mjs --prompt "cyberpunk AI datacenter"
  node scripts/generate-image.mjs -p "futuristic lab" -m p-image
  node scripts/generate-image.mjs -p "futuristic lab" -m flux2
  node scripts/generate-image.mjs -p "add neon effects" -i source.jpg -m flux2
  node scripts/generate-image.mjs -p "add neon effects" -i source.jpg -m p-image

OUTPUT:
  Images are saved to public/ folder.
`);
  process.exit(0);
}

function parseArgs(args) {
  const result = {
    prompt: null,
    model: "flux2",
    input: null,
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
      case "--model":
      case "-m":
        result.model = next;
        i++;
        break;
      case "--input":
      case "-i":
        result.input = next;
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

  if (!VALID_MODELS.includes(args.model)) {
    console.error(`ERROR: Invalid model "${args.model}"`);
    console.error(`Valid options: ${VALID_MODELS.join(", ")}`);
    process.exit(1);
  }

  if (!VALID_ASPECTS.includes(args.aspect)) {
    console.error(`ERROR: Invalid aspect ratio "${args.aspect}"`);
    console.error(`Valid options: ${VALID_ASPECTS.join(", ")}`);
    process.exit(1);
  }

  const config = MODEL_CONFIG[args.model];

  if (!process.env[config.envKey]) {
    console.error(`ERROR: ${config.envKey} not found in environment`);
    console.error("Add it to your .env file");
    process.exit(1);
  }

  if (args.input && !existsSync(args.input)) {
    console.error(`ERROR: Input image not found: ${args.input}`);
    process.exit(1);
  }
}

function generateFilename(output, modelName) {
  if (output) {
    if (!output.endsWith(".jpg") && !output.endsWith(".png")) {
      return output + ".jpg";
    }
    return output;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${modelName}-${timestamp}.jpg`;
}

function imageToDataUrl(imagePath) {
  const ext = extname(imagePath).toLowerCase();
  const mimeType =
    ext === ".png"
      ? "image/png"
      : ext === ".gif"
        ? "image/gif"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

  const imageBuffer = readFileSync(imagePath);
  const base64 = imageBuffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function getModel(config, isEditMode) {
  const modelId = isEditMode ? config.edit : config.t2i;

  if (config.provider === "fal") {
    return fal.image(modelId);
  } else if (config.provider === "runpod") {
    return runpod.image(modelId);
  }

  throw new Error(`Unknown provider: ${config.provider}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (process.argv.length <= 2) {
    showHelp();
  }

  validateArgs(args);

  const config = MODEL_CONFIG[args.model];
  const isEditMode = !!args.input && config.supportsEdit;
  const modelId = isEditMode ? config.edit : config.t2i;

  const filename = generateFilename(args.output, args.model);
  const outputPath = join(projectRoot, "public", filename);

  const publicDir = dirname(outputPath);
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  console.log("Generating image...");
  console.log(`  Provider: ${config.provider}`);
  console.log(`  Model: ${modelId}`);
  console.log(`  Mode: ${isEditMode ? "edit" : "text-to-image"}`);
  console.log(`  Prompt: "${args.prompt}"`);
  console.log(`  Aspect: ${args.aspect}`);
  if (args.input) {
    console.log(`  Input: ${args.input}`);
  }
  if (args.seed !== null) {
    console.log(`  Seed: ${args.seed}`);
  }

  try {
    const options = {
      model: getModel(config, isEditMode),
      prompt: args.prompt,
      aspectRatio: args.aspect,
    };

    if (args.seed !== null) {
      options.seed = args.seed;
    }

    if (isEditMode) {
      options.image = imageToDataUrl(args.input);
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
