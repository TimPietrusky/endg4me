import { redirect } from "next/navigation";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-provider";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await withAuth();

  if (!user) {
    redirect("/");
  }

  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}

