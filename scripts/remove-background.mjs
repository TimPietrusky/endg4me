#!/usr/bin/env node
/**
 * remove-background.mjs - CLI tool for removing backgrounds from images using fal.ai
 *
 * Usage:
 *   node scripts/remove-background.mjs --input image.png [options]
 *
 * Options:
 *   --input, -i       Input image path (required)
 *   --output, -o      Output directory or filename (default: same as input with _transparent suffix)
 *   --keep-original   Keep original file unchanged (default: true)
 *   --help, -h        Show this help message
 *
 * Output:
 *   Creates a PNG with transparent background alongside the original.
 *   Original: <name>_v001.png
 *   Transparent: <name>_v001_transparent.png
 *
 * Environment:
 *   FAL_API_KEY
 */

import dotenv from "dotenv";
import { fal } from "@fal-ai/client";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join, resolve, extname, basename } from "path";
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
remove-background.mjs - Remove backgrounds from images using fal.ai BiRefNet

USAGE:
  node scripts/remove-background.mjs --input image.png [options]

OPTIONS:
  --input, -i       Input image path (required)
  --output, -o      Output path for transparent PNG (default: auto-generated)
  --help, -h        Show this help message

MODEL:
  Uses fal-ai/birefnet/v2 for high-quality background removal

EXAMPLES:
  node scripts/remove-background.mjs -i public/assets/entities/3b-tts/3b-tts_v001.png
  node scripts/remove-background.mjs -i image.png -o image_transparent.png

OUTPUT:
  Creates <filename>_transparent.png in the same directory as input.
  Original file is preserved.

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

function generateOutputPath(inputPath, customOutput) {
  if (customOutput) {
    if (!customOutput.endsWith(".png")) {
      return customOutput + ".png";
    }
    return customOutput;
  }

  // Generate from input filename: name_v001.png -> name_v001_transparent.png
  const dir = dirname(inputPath);
  const ext = extname(inputPath);
  const name = basename(inputPath, ext);
  return join(dir, `${name}_transparent.png`);
}

async function uploadToFal(imagePath) {
  const imageBuffer = readFileSync(imagePath);
  const ext = extname(imagePath).toLowerCase();
  const mimeType =
    ext === ".png"
      ? "image/png"
      : ext === ".gif"
        ? "image/gif"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

  // Create a File object from buffer
  const blob = new Blob([imageBuffer], { type: mimeType });
  const file = new File([blob], basename(imagePath), { type: mimeType });

  console.log("  Uploading image to fal.ai storage...");
  const url = await fal.storage.upload(file);
  console.log("  Upload complete");
  return url;
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

  const outputPath = generateOutputPath(args.input, args.output);
  const outputDir = dirname(outputPath);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log("Removing background...");
  console.log(`  Model: fal-ai/birefnet/v2 (Dynamic @ 2048x2048)`);
  console.log(`  Input: ${args.input}`);

  try {
    // Upload image to fal.ai storage to get a URL
    const imageUrl = await uploadToFal(args.input);

    const result = await fal.subscribe("fal-ai/birefnet/v2", {
      input: {
        image_url: imageUrl,
        model: "General Use (Dynamic)",
        operating_resolution: "2048x2048",
        refine_foreground: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) => console.log(`  ${log.message}`));
        }
      },
    });

    console.log("\nResult received, downloading transparent PNG...");

    // Download the result image
    const resultUrl = result.data?.image?.url;
    if (resultUrl) {
      await downloadFile(resultUrl, outputPath);
      const fileSize = result.data?.image?.file_size || 0;
      console.log(`\nSaved: ${basename(outputPath)}`);
      console.log(`Path: ${outputPath}`);
      if (fileSize > 0) {
        console.log(`Size: ${(fileSize / 1024).toFixed(1)}KB`);
      }
    } else {
      console.error("No result image URL in response");
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

