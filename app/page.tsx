import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black bg-[url('/background-1.png')] bg-cover bg-center px-6 text-white">
      <a
        href="https://x.com/endg4_me"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-4xl transition-opacity hover:opacity-80"
      >
        <Logo className="w-full drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)]" />
      </a>
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
        race to agi
      </p>
    </main>
  );
}
