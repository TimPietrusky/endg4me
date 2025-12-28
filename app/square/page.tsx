"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createLogoSvg, LOGO_ASPECT_RATIO } from "@/lib/logo-svg";

const CANVAS_SIZE = 1080;

const BLEND_MODES: GlobalCompositeOperation[] = [
  "source-over",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
];

interface Settings {
  blend: number;
  rotation: number;
  scale: number;
  copies: number;
  spacing: number;
  logoColor: string;
  logoOpacity: number;
  logoBlendMode: GlobalCompositeOperation;
}

const DEFAULT_SETTINGS: Settings = {
  blend: 30,
  rotation: 0,
  scale: 120,
  copies: 1,
  spacing: 355,
  logoColor: "#ffffff",
  logoOpacity: 100,
  logoBlendMode: "overlay",
};

export default function SquarePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const bg1Ref = useRef<HTMLImageElement | null>(null);
  const bg2Ref = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const logoColorRef = useRef<string>(settings.logoColor);

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Load background images on mount
  useEffect(() => {
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded === 2) setImagesLoaded(true);
    };

    const bg1 = new Image();
    bg1.onload = checkLoaded;
    bg1.src = "/background-1.jpg";
    bg1Ref.current = bg1;

    const bg2 = new Image();
    bg2.onload = checkLoaded;
    bg2.src = "/background-2.jpg";
    bg2Ref.current = bg2;
  }, []);

  // Update logo image when color changes
  useEffect(() => {
    if (logoColorRef.current === settings.logoColor && logoRef.current) return;
    logoColorRef.current = settings.logoColor;

    const logo = new Image();
    const svgBlob = new Blob([createLogoSvg(settings.logoColor)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(svgBlob);
    logo.onload = () => {
      if (logoRef.current) URL.revokeObjectURL(logoRef.current.src);
      logoRef.current = logo;
      setLogoVersion((v) => v + 1);
    };
    logo.src = url;
  }, [settings.logoColor]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imagesLoaded) return;

    const bg1 = bg1Ref.current;
    const bg2 = bg2Ref.current;
    const logo = logoRef.current;
    if (!bg1 || !bg2 || !logo) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw background 1
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = (100 - settings.blend) / 100;
    drawCoverImage(ctx, bg1, CANVAS_SIZE, CANVAS_SIZE);

    // Draw background 2
    ctx.globalAlpha = settings.blend / 100;
    drawCoverImage(ctx, bg2, CANVAS_SIZE, CANVAS_SIZE);

    // Draw logos
    ctx.globalAlpha = settings.logoOpacity / 100;
    ctx.globalCompositeOperation = settings.logoBlendMode;

    const logoWidth = CANVAS_SIZE * 0.7;
    const logoHeight = logoWidth * LOGO_ASPECT_RATIO;
    const totalLogos = settings.copies * 2 - 1;

    for (let i = 0; i < totalLogos; i++) {
      const offsetIndex = i - (settings.copies - 1);
      const yOffset = offsetIndex * settings.spacing;

      ctx.save();
      ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + yOffset);
      ctx.rotate((settings.rotation * Math.PI) / 180);
      ctx.scale(settings.scale / 100, settings.scale / 100);
      ctx.drawImage(
        logo,
        -logoWidth / 2,
        -logoHeight / 2,
        logoWidth,
        logoHeight
      );
      ctx.restore();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }, [settings, imagesLoaded, logoVersion]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `endg4me-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopySettings = () => {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex min-h-screen bg-zinc-950 p-4">
      {/* Preview */}
      <div className="flex flex-1 items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="h-auto max-h-[80vh] w-auto max-w-full rounded-sm"
        />
      </div>

      {/* Controls */}
      <div className="flex w-80 flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="font-mono text-sm font-semibold text-zinc-300">
          Controls
        </h2>

        {/* Background Blend */}
        <Control
          label="Background Blend"
          value={`BG1 ${100 - settings.blend}% / BG2 ${settings.blend}%`}
        >
          <input
            type="range"
            min="0"
            max="100"
            value={settings.blend}
            onChange={(e) => updateSetting("blend", Number(e.target.value))}
            className="slider"
          />
        </Control>

        <hr className="border-zinc-800" />

        {/* Logo Color */}
        <Control label="Logo Color" value={settings.logoColor}>
          <input
            type="color"
            value={settings.logoColor}
            onChange={(e) => updateSetting("logoColor", e.target.value)}
            className="h-8 w-full cursor-pointer rounded border-0 bg-transparent"
          />
        </Control>

        {/* Logo Opacity */}
        <Control label="Logo Opacity" value={`${settings.logoOpacity}%`}>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.logoOpacity}
            onChange={(e) =>
              updateSetting("logoOpacity", Number(e.target.value))
            }
            className="slider"
          />
        </Control>

        {/* Logo Blend Mode */}
        <Control label="Logo Blend Mode" value={settings.logoBlendMode}>
          <select
            value={settings.logoBlendMode}
            onChange={(e) =>
              updateSetting(
                "logoBlendMode",
                e.target.value as GlobalCompositeOperation
              )
            }
            className="w-full rounded bg-zinc-800 px-2 py-1 font-mono text-sm text-zinc-300"
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </Control>

        <hr className="border-zinc-800" />

        {/* Rotation */}
        <Control label="Rotation" value={`${settings.rotation}°`}>
          <input
            type="range"
            min="-180"
            max="180"
            value={settings.rotation}
            onChange={(e) => updateSetting("rotation", Number(e.target.value))}
            className="slider"
          />
        </Control>

        {/* Scale */}
        <Control label="Scale" value={`${settings.scale}%`}>
          <input
            type="range"
            min="10"
            max="400"
            value={settings.scale}
            onChange={(e) => updateSetting("scale", Number(e.target.value))}
            className="slider"
          />
        </Control>

        <hr className="border-zinc-800" />

        {/* Copies */}
        <Control
          label="Copies (vertical)"
          value={`${settings.copies * 2 - 1} logo${
            settings.copies * 2 - 1 !== 1 ? "s" : ""
          }`}
        >
          <input
            type="range"
            min="1"
            max="10"
            value={settings.copies}
            onChange={(e) => updateSetting("copies", Number(e.target.value))}
            className="slider"
          />
        </Control>

        {/* Spacing */}
        <Control label="Spacing" value={`${settings.spacing}px`}>
          <input
            type="range"
            min="20"
            max="400"
            value={settings.spacing}
            onChange={(e) => updateSetting("spacing", Number(e.target.value))}
            className="slider"
          />
        </Control>

        <hr className="border-zinc-800" />

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDownload}
            className="rounded-lg bg-white px-4 py-2 font-mono text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Download PNG
          </button>
          <button
            onClick={handleCopySettings}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            {copied ? "Copied!" : "Copy Settings JSON"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider {
          height: 0.5rem;
          width: 100%;
          cursor: pointer;
          appearance: none;
          border-radius: 0.5rem;
          background: #27272a;
          accent-color: white;
        }
      `}</style>
    </main>
  );
}

function Control({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-zinc-400">{label}</span>
        <span className="font-mono text-xs text-zinc-500">{value}</span>
      </div>
      {children}
    </div>
  );
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasW / canvasH;

  let drawW: number, drawH: number, offsetX: number, offsetY: number;

  if (imgRatio > canvasRatio) {
    drawH = canvasH;
    drawW = img.width * (canvasH / img.height);
    offsetX = (canvasW - drawW) / 2;
    offsetY = 0;
  } else {
    drawW = canvasW;
    drawH = img.height * (canvasW / img.width);
    offsetX = 0;
    offsetY = (canvasH - drawH) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}
