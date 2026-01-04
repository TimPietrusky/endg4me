import { withAuth, getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { GlitchBackground } from "@/components/glitch-background";
import { Button } from "@/components/ui/button";
import { Warning } from "@phosphor-icons/react/dist/ssr";

interface HomePageProps {
  searchParams: Promise<{ error?: string; message?: string; from?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { user } = await withAuth();
  const signInUrl = await getSignInUrl();
  const params = await searchParams;

  // If user is logged in and not coming from game, redirect to operate
  if (user && params.from !== "game") {
    redirect("/operate");
  }

  const hasError = params.error === "auth_failed";
  const isLoggedIn = !!user;

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

        {/* Error Message */}
        {hasError && (
          <div className="mt-4 px-6 py-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 max-w-md">
            <Warning className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="text-sm text-red-200">
              <p className="font-semibold">Sign in failed</p>
              <p className="text-red-300/80 text-xs mt-1">
                {params.message || "Please try again. If the problem persists, check your network connection."}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          render={<a href={isLoggedIn ? "/operate" : signInUrl} />}
          nativeButton={false}
          className="mt-6 p-12 rounded-2xl bg-white font-semibold text-lg text-black hover:bg-white/90 transition-all shadow-lg"
        >
          {isLoggedIn ? "continue" : "start"}
        </Button>
      </div>
    </div>
  );
}
