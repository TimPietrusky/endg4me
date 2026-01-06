import { withAuth, getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { LandingHeroWrapper } from "@/components/landing/landing-hero-wrapper";

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
    <main>
      <LandingHeroWrapper
        isLoggedIn={isLoggedIn}
        signInUrl={signInUrl}
        hasError={hasError}
        errorMessage={params.message}
      />
      
      {/* Features Section */}
      <section className="min-h-screen bg-gradient-to-b from-[#05050a] to-[#0a0a18] flex items-center justify-center py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-white mb-4 tracking-tight">
            Build Your AI Empire
          </h2>
          <p className="text-center text-white/50 font-mono mb-16 text-lg">
            Train models. Generate revenue. Race to singularity.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-cyan-400 text-2xl">⚡</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Train Models</h3>
              <p className="text-white/50 text-sm">
                Build and train AI models from scratch. Each model has unique capabilities and revenue potential.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-12 h-12 bg-magenta-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-pink-400 text-2xl">💰</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Generate Revenue</h3>
              <p className="text-white/50 text-sm">
                Deploy your models on contracts. Earn credits to expand your lab and unlock new research.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-400 text-2xl">🏆</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Compete</h3>
              <p className="text-white/50 text-sm">
                Race against other players on the leaderboard. Be the first to achieve singularity.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-[#0a0a18]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to begin?
          </h2>
          <p className="text-white/50 mb-8">
            Start your journey to singularity. Train your first model today.
          </p>
          <a 
            href={isLoggedIn ? "/operate" : signInUrl}
            className="inline-block px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors"
          >
            {isLoggedIn ? "Continue Playing" : "Start Now"}
          </a>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-[#05050a] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-white/30 text-sm font-mono">
            endg4me — race to singularity
          </p>
        </div>
      </footer>
    </main>
  );
}
