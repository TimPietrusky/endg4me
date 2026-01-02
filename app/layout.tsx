import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://endg4.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "endg4me",
  description:
    "browser based game to build your ai company and compete with everyone else on the race to singularity.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "endg4me",
    description:
      "browser based game to build your ai company and compete with everyone else on the race to singularity.",
    images: [
      {
        url: "/banner.jpg",
        width: 1500,
        height: 500,
        alt: "endg4me",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "endg4me",
    description:
      "browser based game to build your ai company and compete with everyone else on the race to singularity.",
    images: ["/banner.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
