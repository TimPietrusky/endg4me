"use client";

import { Logo } from "@/components/logo";

interface TerminalScreenUIProps {
  isLoggedIn: boolean;
  signInUrl: string;
}

export function TerminalScreenUI({
  isLoggedIn,
  signInUrl,
}: TerminalScreenUIProps) {
  return (
    <div className="terminal-screen w-full h-full flex flex-col items-center justify-center gap-3 p-4 bg-black/90 relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="scanlines absolute inset-0 pointer-events-none" />

      {/* CRT curve vignette */}
      <div className="absolute inset-0 pointer-events-none crt-vignette" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {/* Logo */}
        <Logo className="w-48 h-auto text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />

        {/* Slogan */}
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
          race to singularity
        </p>

        {/* CTA Button */}
        <a
          href={isLoggedIn ? "/operate" : signInUrl}
          className="mt-2 px-6 py-2 bg-white text-black font-mono font-bold text-sm uppercase tracking-wider hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        >
          {isLoggedIn ? "continue" : "start"}
        </a>
      </div>

      <style jsx>{`
        .scanlines {
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          animation: scanline-flicker 0.1s infinite;
        }

        @keyframes scanline-flicker {
          0%,
          100% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.9;
          }
        }

        .crt-vignette {
          background: radial-gradient(
            ellipse at center,
            transparent 50%,
            rgba(0, 0, 0, 0.4) 100%
          );
        }

        .terminal-screen {
          border-radius: 8px;
          box-shadow: inset 0 0 30px rgba(0, 255, 0, 0.05),
            inset 0 0 10px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}

