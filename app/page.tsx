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
      
      {/* Test content for scroll testing */}
      <section className="min-h-screen bg-[#0a0a15] flex items-center justify-center">
        <div className="text-center text-white/60 font-mono">
          <h2 className="text-2xl mb-4">Scroll Test Section</h2>
          <p>If you can see this, scrolling works!</p>
        </div>
      </section>
    </main>
  );
}
