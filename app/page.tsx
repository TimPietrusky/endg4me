import { GlitchBackground } from "@/components/glitch-background";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-white">
      <GlitchBackground />
      <a
        href="https://x.com/endg4_me"
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 w-full max-w-4xl transition-opacity hover:opacity-80 lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl"
      >
        <Logo className="w-full drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)]" />
      </a>
      <p className="relative z-10 font-mono text-xl font-semibold uppercase tracking-[0.4em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-2xl md:text-3xl lg:text-4xl">
        race to agi
      </p>
    </main>
  );
}
