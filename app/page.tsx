import { withAuth, getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { GlitchBackground } from "@/components/glitch-background";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default async function HomePage() {
  const { user } = await withAuth();
  const signInUrl = await getSignInUrl();

  // If user is logged in, redirect to play
  if (user) {
    redirect("/play");
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Glitch Background */}
      <GlitchBackground />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 w-full px-4">
        {/* Logo - super large, responsive */}
        <Logo className="w-[95vw] max-w-[1400px] h-auto text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)]" />

        {/* Slogan - adapts to stay on one line */}
        <p className="font-mono font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] text-[3.5vw] sm:text-[2.5vw] md:text-[2vw] lg:text-[1.8vw] max-w-[1400px] whitespace-nowrap">
          race to singularity
        </p>

        {/* Sign In Button */}
        <a
          href={signInUrl}
          className="mt-6 group px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold text-lg text-white hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
        >
          Start Playing
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}
