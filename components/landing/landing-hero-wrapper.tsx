"use client";

import dynamic from "next/dynamic";
import { FallbackHero } from "./fallback-hero";

// Dynamic import to avoid SSR issues with Three.js
const TerminalHero = dynamic(
  () =>
    import("@/components/landing/terminal-hero").then(
      (mod) => mod.TerminalHero
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e]" />
    ),
  }
);

interface LandingHeroWrapperProps {
  isLoggedIn: boolean;
  signInUrl: string;
  hasError?: boolean;
  errorMessage?: string;
  seed: number;
}

export function LandingHeroWrapper({
  isLoggedIn,
  signInUrl,
  hasError,
  errorMessage,
  seed,
}: LandingHeroWrapperProps) {
  return (
    <TerminalHero
      isLoggedIn={isLoggedIn}
      signInUrl={signInUrl}
      hasError={hasError}
      errorMessage={errorMessage}
      seed={seed}
    />
  );
}

