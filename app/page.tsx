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
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <Logo className="w-[600px] max-w-[90vw] h-auto text-white drop-shadow-2xl" />

        {/* Sign In Button */}
        <a
          href={signInUrl}
          className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold text-lg text-white hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
        >
          Start Playing
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}
