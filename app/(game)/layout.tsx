import { redirect } from "next/navigation";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await withAuth();

  if (!user) {
    redirect("/");
  }

  return (
    <div className={`${jetbrainsMono.variable} font-mono`}>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </div>
  );
}
