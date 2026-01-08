#!/usr/bin/env node
/**
 * create-composition-template.mjs - Generate composition guide templates
 *
 * Creates a neutral gray background with a visible rectangle border
 * marking the "safe zone" where generated objects should be placed.
 *
 * Usage:
 *   node scripts/create-composition-template.mjs [options]
 *
 * Options:
 *   --width, -w       Image width (default: 1920)
 *   --height, -h      Image height (default: 1080)
 *   --padding, -p     Padding percentage from edges (default: 15)
 *   --output, -o      Output filename (default: composition-template.png)
 *   --color, -c       Guide line color (default: #FF00FF - magenta for easy removal)
 */

import sharp from "sharp";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

function parseArgs(args) {
  const result = {
    width: 1920,
    height: 1080,
    padding: 15, // percentage
    output: "composition-template.png",
    color: "#FF00FF", // magenta - easy to detect and remove
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--width":
      case "-w":
        result.width = parseInt(next, 10);
        i++;
        break;
      case "--height":
      case "-h":
        result.height = parseInt(next, 10);
        i++;
        break;
      case "--padding":
      case "-p":
        result.padding = parseInt(next, 10);
        i++;
        break;
      case "--output":
      case "-o":
        result.output = next;
        i++;
        break;
      case "--color":
      case "-c":
        result.color = next;
        i++;
        break;
    }
  }

  return result;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 0, b: 255 };
}

async function createTemplate(options) {
  const { width, height, padding, output, color } = options;

  // Calculate safe zone bounds
  const padX = Math.floor(width * (padding / 100));
  const padY = Math.floor(height * (padding / 100));

  const safeX = padX;
  const safeY = padY;
  const safeWidth = width - 2 * padX;
  const safeHeight = height - 2 * padY;

  const rgb = hexToRgb(color);
  const lineWidth = 4;

  // Create neutral gray background
  const bgGray = 180; // #B4B4B4 - neutral gray
  const background = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    background[i * 4] = bgGray; // R
    background[i * 4 + 1] = bgGray; // G
    background[i * 4 + 2] = bgGray; // B
    background[i * 4 + 3] = 255; // A
  }

  // Draw rectangle border
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isTopBorder =
        y >= safeY - lineWidth && y < safeY && x >= safeX && x < safeX + safeWidth;
      const isBottomBorder =
        y >= safeY + safeHeight &&
        y < safeY + safeHeight + lineWidth &&
        x >= safeX &&
        x < safeX + safeWidth;
      const isLeftBorder =
        x >= safeX - lineWidth && x < safeX && y >= safeY && y < safeY + safeHeight;
      const isRightBorder =
        x >= safeX + safeWidth &&
        x < safeX + safeWidth + lineWidth &&
        y >= safeY &&
        y < safeY + safeHeight;

      if (isTopBorder || isBottomBorder || isLeftBorder || isRightBorder) {
        const idx = (y * width + x) * 4;
        background[idx] = rgb.r;
        background[idx + 1] = rgb.g;
        background[idx + 2] = rgb.b;
        background[idx + 3] = 255;
      }
    }
  }

  // Draw corner markers (thicker for visibility)
  const cornerSize = 30;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Top-left corner
      const isTL =
        (x >= safeX - lineWidth &&
          x < safeX + cornerSize &&
          y >= safeY - lineWidth &&
          y < safeY + lineWidth) ||
        (y >= safeY - lineWidth &&
          y < safeY + cornerSize &&
          x >= safeX - lineWidth &&
          x < safeX + lineWidth);

      // Top-right corner
      const isTR =
        (x >= safeX + safeWidth - cornerSize &&
          x < safeX + safeWidth + lineWidth &&
          y >= safeY - lineWidth &&
          y < safeY + lineWidth) ||
        (y >= safeY - lineWidth &&
          y < safeY + cornerSize &&
          x >= safeX + safeWidth &&
          x < safeX + safeWidth + lineWidth);

      // Bottom-left corner
      const isBL =
        (x >= safeX - lineWidth &&
          x < safeX + cornerSize &&
          y >= safeY + safeHeight &&
          y < safeY + safeHeight + lineWidth) ||
        (y >= safeY + safeHeight - cornerSize &&
          y < safeY + safeHeight + lineWidth &&
          x >= safeX - lineWidth &&
          x < safeX + lineWidth);

      // Bottom-right corner
      const isBR =
        (x >= safeX + safeWidth - cornerSize &&
          x < safeX + safeWidth + lineWidth &&
          y >= safeY + safeHeight &&
          y < safeY + safeHeight + lineWidth) ||
        (y >= safeY + safeHeight - cornerSize &&
          y < safeY + safeHeight + lineWidth &&
          x >= safeX + safeWidth &&
          x < safeX + safeWidth + lineWidth);

      if (isTL || isTR || isBL || isBR) {
        const idx = (y * width + x) * 4;
        background[idx] = rgb.r;
        background[idx + 1] = rgb.g;
        background[idx + 2] = rgb.b;
        background[idx + 3] = 255;
      }
    }
  }

  // Save template
  const outputPath = join(projectRoot, "public", "assets", "templates", output);
  const outputDir = dirname(outputPath);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  await sharp(background, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toFile(outputPath);

  console.log(`Template created: ${outputPath}`);
  console.log(`  Dimensions: ${width}x${height}`);
  console.log(`  Safe zone: ${safeWidth}x${safeHeight} (${100 - 2 * padding}%)`);
  console.log(`  Bounds: x=${safeX}, y=${safeY}`);
  console.log(`  Guide color: ${color}`);

  // Return bounds for reference
  return { safeX, safeY, safeWidth, safeHeight };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await createTemplate(args);
}

main().catch(console.error);


