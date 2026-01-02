"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  CurrencyDollar,
  Rocket,
  Flask,
} from "@phosphor-icons/react";

interface FounderSelectionProps {
  userId: string;
}

type FounderType = "technical" | "business";

const FOUNDER_OPTIONS = [
  {
    type: "technical" as FounderType,
    name: "Technical Founder",
    icon: Flask,
    description: "Deep expertise in AI/ML research",
    bonuses: ["+25% Research Speed", "+10% Model Score"],
    penalties: ["-20% Money Rewards"],
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    hoverBorder: "hover:border-cyan-400",
  },
  {
    type: "business" as FounderType,
    name: "Business Founder",
    icon: CurrencyDollar,
    description: "Strong connections and business acumen",
    bonuses: ["+30% Money Rewards", "+20% Hiring Speed"],
    penalties: ["-20% Research Speed"],
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    hoverBorder: "hover:border-amber-400",
  },
];

export function FounderSelection({ userId }: FounderSelectionProps) {
  const [selectedType, setSelectedType] = useState<FounderType | null>(null);
  const [labName, setLabName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLab = useMutation(api.labs.createLab);

  const handleCreate = async () => {
    if (!selectedType || !labName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      await createLab({
        userId: userId as Id<"users">,
        name: labName.trim(),
        founderType: selectedType,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create lab");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

      <div className="relative z-10 container mx-auto px-6 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-6">
            <Rocket className="w-4 h-4 text-emerald-400" weight="fill" />
            <span className="text-sm text-zinc-400">New Lab Initialization</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Choose Your Path
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Your founder type shapes your lab&apos;s strengths. Choose wisely — this
            decision is permanent.
          </p>
        </div>

        {/* Founder Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {FOUNDER_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.type;

            return (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={cn(
                  "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group",
                  option.bgColor,
                  isSelected
                    ? `${option.borderColor} ring-2 ring-offset-2 ring-offset-zinc-950 ${option.borderColor.replace("border-", "ring-")}`
                    : `border-zinc-800 ${option.hoverBorder}`
                )}
              >
                {/* Glow effect */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity",
                    option.color,
                    isSelected ? "opacity-5" : "group-hover:opacity-5"
                  )}
                />

                <div className="relative z-10">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                      option.color
                    )}
                  >
                    <Icon className="w-7 h-7 text-white" weight="bold" />
                  </div>

                  <h2 className="text-2xl font-bold mb-2">{option.name}</h2>
                  <p className="text-zinc-500 mb-6">{option.description}</p>

                  <div className="space-y-3">
                    {option.bonuses.map((bonus) => (
                      <div
                        key={bonus}
                        className="flex items-center gap-2 text-emerald-400"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-sm font-medium">{bonus}</span>
                      </div>
                    ))}
                    {option.penalties.map((penalty) => (
                      <div
                        key={penalty}
                        className="flex items-center gap-2 text-red-400"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-sm font-medium">{penalty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center",
                        option.color
                      )}
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Lab Name Input */}
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Lab Name
          </label>
          <input
            type="text"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            placeholder="Enter your lab name..."
            maxLength={32}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
          />

          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={!selectedType || !labName.trim() || isCreating}
            className={cn(
              "w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
              selectedType && labName.trim() && !isCreating
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/25"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing Lab...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lightbulb className="w-5 h-5" weight="fill" />
                Initialize Lab
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

