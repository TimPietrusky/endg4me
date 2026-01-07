#!/usr/bin/env node
/**
 * generate-3d.mjs - CLI tool for generating 3D models from images using fal.ai
 *
 * Usage:
 *   node scripts/generate-3d.mjs --input image.png --output model.glb
 *
 * Options:
 *   --input, -i       Input image path (required)
 *   --output, -o      Output GLB filename (default: auto-generated)
 *   --help, -h        Show this help message
 *
 * Environment:
 *   FAL_API_KEY
 */

import dotenv from "dotenv";
import { fal } from "@fal-ai/client";
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

function showHelp() {
  console.log(`
generate-3d.mjs - Generate 3D models from images using fal.ai Trellis-2

USAGE:
  node scripts/generate-3d.mjs --input image.png [options]

OPTIONS:
  --input, -i       Input image path (required)
  --output, -o      Output GLB filename (default: auto-generated)
  --help, -h        Show this help message

EXAMPLES:
  node scripts/generate-3d.mjs -i public/assets/entities/3b-tts/3b-tts_v001.png
  node scripts/generate-3d.mjs -i image.png -o assets/entities/3b-tts/3b-tts_v001.glb

OUTPUT:
  GLB files are saved to public/ folder.

ENVIRONMENT:
  FAL_API_KEY - Required for fal.ai API access
`);
  process.exit(0);
}

function parseArgs(args) {
  const result = {
    input: null,
    output: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--help":
      case "-h":
        showHelp();
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
    }
  }

  return result;
}

function validateArgs(args) {
  if (!args.input) {
    console.error("ERROR: --input is required\n");
    console.error("Run with --help for usage information");
    process.exit(1);
  }

  if (!existsSync(args.input)) {
    console.error(`ERROR: Input image not found: ${args.input}`);
    process.exit(1);
  }

  if (!process.env.FAL_API_KEY) {
    console.error("ERROR: FAL_API_KEY not found in environment");
    console.error("Add it to your .env.local file");
    process.exit(1);
  }
}

function generateFilename(output, inputPath) {
  if (output) {
    if (!output.endsWith(".glb")) {
      return output + ".glb";
    }
    return output;
  }

  // Generate from input filename
  const inputName = inputPath.split("/").pop().replace(/\.[^.]+$/, "");
  return `${inputName}.glb`;
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

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  writeFileSync(outputPath, Buffer.from(buffer));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (process.argv.length <= 2) {
    showHelp();
  }

  validateArgs(args);

  // Configure fal client
  fal.config({
    credentials: process.env.FAL_API_KEY,
  });

  const filename = generateFilename(args.output, args.input);
  const outputPath = join(projectRoot, "public", filename);

  const publicDir = dirname(outputPath);
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  console.log("Generating 3D model...");
  console.log(`  Model: fal-ai/trellis-2`);
  console.log(`  Input: ${args.input}`);

  try {
    const imageDataUrl = imageToDataUrl(args.input);

    const result = await fal.subscribe("fal-ai/trellis-2", {
      input: {
        image_url: imageDataUrl,
        resolution: 512,
        texture_size: 1024,
        decimation_target: 100000, // Minimum value (reduced from 500000 default)
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) => console.log(`  ${log.message}`));
        }
      },
    });

    console.log("\nResult received, downloading GLB...");

    // Download the GLB file (API returns model_glb)
    const glbUrl = result.data?.model_glb?.url || result.data?.model_mesh?.url;
    if (glbUrl) {
      await downloadFile(glbUrl, outputPath);
      const fileSize = result.data?.model_glb?.file_size || 0;
      console.log(`\nSaved: ${filename}`);
      console.log(`Path: public/${filename}`);
      console.log(`Size: ${(fileSize / 1024 / 1024).toFixed(1)}MB`);
    } else {
      console.error("No model GLB URL in response");
      console.log("Response:", JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (err) {
    console.error("\nERROR:", err?.message || err);
    if (err?.body) {
      console.error("Details:", JSON.stringify(err.body, null, 2));
    }
    process.exit(1);
  }
}

main();

