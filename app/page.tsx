import { withAuth, getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { LandingHeroWrapper } from "@/components/landing/landing-hero-wrapper";
import { LandingContent } from "@/components/landing/landing-content";

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
      
      <LandingContent isLoggedIn={isLoggedIn} signInUrl={signInUrl} />
    </main>
  );
}
