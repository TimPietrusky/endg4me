"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FounderSelection } from "@/components/game/founder-selection";
import { LabDashboard } from "@/components/game/lab-dashboard";

interface PlayPageProps {
  searchParams: Promise<{ workosUserId?: string; email?: string; name?: string }>;
}

export default function PlayPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // We'll get the user info from a hook that fetches from the server
  useEffect(() => {
    async function initUser() {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setUserId(data.convexUserId);
        }
      } catch (error) {
        console.error("Failed to get user:", error);
      } finally {
        setIsLoading(false);
      }
    }
    initUser();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!userId) {
    return <LoadingScreen message="Connecting..." />;
  }

  return <GameContent userId={userId} />;
}

function GameContent({ userId }: { userId: string }) {
  const labData = useQuery(api.labs.getFullLabData, {
    userId: userId as any,
  });

  if (labData === undefined) {
    return <LoadingScreen message="Loading lab..." />;
  }

  // No lab yet - show founder selection
  if (!labData || !labData.lab) {
    return <FounderSelection userId={userId} />;
  }

  return (
    <LabDashboard
      user={labData.user!}
      lab={labData.lab}
      labState={labData.labState!}
      playerState={labData.playerState!}
      userId={userId}
    />
  );
}

function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

