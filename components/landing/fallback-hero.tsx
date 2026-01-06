import { Logo } from "@/components/logo";

interface FallbackHeroProps {
  isLoggedIn: boolean;
  signInUrl: string;
  hasError?: boolean;
  errorMessage?: string;
}

export function FallbackHero({
  isLoggedIn,
  signInUrl,
  hasError,
  errorMessage,
}: FallbackHeroProps) {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e]">
      {/* Static CRT-like background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url(/background-1.jpg)" }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 w-full px-4">
        {/* Logo */}
        <Logo className="w-[80vw] max-w-[800px] h-auto text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)]" />

        {/* Slogan */}
        <p className="font-mono font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] text-[3vw] sm:text-[2vw] md:text-[1.5vw] whitespace-nowrap">
          race to singularity
        </p>

        {/* Error Message */}
        {hasError && (
          <div className="mt-4 px-6 py-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 max-w-md">
            <div className="text-sm text-red-200">
              <p className="font-semibold">Sign in failed</p>
              <p className="text-red-300/80 text-xs mt-1">
                {errorMessage ||
                  "Please try again. If the problem persists, check your network connection."}
              </p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <a
          href={isLoggedIn ? "/operate" : signInUrl}
          className="mt-6 px-12 py-6 rounded-2xl bg-white font-semibold text-lg text-black hover:bg-white/90 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        >
          {isLoggedIn ? "continue" : "start"}
        </a>
      </div>

      {/* Footer with credits link */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <a
          href="/credits"
          className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          credits
        </a>
      </div>
    </div>
  );
}

