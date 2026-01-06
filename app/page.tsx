import { withAuth, getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { LandingHeroWrapper } from "@/components/landing/landing-hero-wrapper";
import { LandingContent } from "@/components/landing/landing-content";
import { generateRandomSeed, MAX_SEED } from "@/lib/seeded-random";

interface HomePageProps {
  searchParams: Promise<{ error?: string; message?: string; from?: string; seed?: string }>;
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
  
  // Parse seed from URL or generate a new one
  let seed: number;
  if (params.seed) {
    const parsed = parseInt(params.seed, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= MAX_SEED) {
      seed = parsed;
    } else {
      seed = generateRandomSeed();
    }
  } else {
    seed = generateRandomSeed();
  }

  return (
    <main>
      <LandingHeroWrapper
        isLoggedIn={isLoggedIn}
        signInUrl={signInUrl}
        hasError={hasError}
        errorMessage={params.message}
        seed={seed}
      />
      
      <LandingContent isLoggedIn={isLoggedIn} signInUrl={signInUrl} />
    </main>
  );
}
