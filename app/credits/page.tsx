import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono text-sm">back</span>
        </Link>

        <h1 className="font-mono text-3xl font-bold mb-8">Credits</h1>

        {/* 3D Assets */}
        <section className="mb-8">
          <h2 className="font-mono text-xl font-semibold mb-4 text-white/80">
            3D Assets
          </h2>
          <ul className="space-y-4">
            <li className="border border-white/10 rounded-lg p-4 bg-white/5">
              <h3 className="font-mono font-semibold">CRT Monitor</h3>
              <p className="text-white/60 text-sm mt-1">
                CC0 asset from Poly Haven
              </p>
              <a
                href="https://polyhaven.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-2 inline-block"
              >
                polyhaven.com
              </a>
            </li>
          </ul>
        </section>

        {/* License note */}
        <section className="border-t border-white/10 pt-8">
          <p className="text-white/40 text-sm font-mono">
            CC0 assets require no attribution, but we appreciate the creators.
          </p>
        </section>
      </div>
    </div>
  );
}

