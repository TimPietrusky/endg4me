"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { CurrencyDollar, Clock } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { ActionButton } from "@/components/game/dashboard/action-button";

interface FounderSelectionProps {
  userId: string;
}

type FounderType = "technical" | "business";

const FOUNDER_OPTIONS = [
  {
    type: "technical" as FounderType,
    name: "technical founder",
    icon: Clock,
    description: "deep expertise in ai/ml research",
    baseValue: "0%",
    bonusValue: "+25%",
    bonusLabel: "speed",
    bonusDescription: "all jobs complete faster",
    color: "from-pink-500 to-fuchsia-600",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    hoverBorder: "hover:border-pink-400",
    bonusColor: "text-pink-400",
    iconBgColor: "bg-pink-500/20",
  },
  {
    type: "business" as FounderType,
    name: "business founder",
    icon: CurrencyDollar,
    description: "strong connections and business acumen",
    baseValue: "1x",
    bonusValue: "+0.5x",
    bonusLabel: "money multiplier",
    bonusDescription: "earn more revenue, pay less for costs",
    color: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-400",
    bonusColor: "text-emerald-400",
    iconBgColor: "bg-emerald-500/20",
  },
];

export function FounderSelection({ userId }: FounderSelectionProps) {
  const router = useRouter();
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
      // Redirect to operate page after successful creation
      router.replace("/operate");
    } catch (err: any) {
      setError(err.message || "Failed to create lab");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col justify-center">
      <div className="container mx-auto px-6 py-12 max-w-5xl flex flex-col gap-12">
        {/* main header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent lowercase">
            new lab
          </h1>
          <p className="text-zinc-500 text-base mt-3 lowercase">
            create your own ai lab to reasearch, train and compete against other
            labs on a global leaderboard
          </p>
        </div>

        {/* name your lab */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-3 text-center">
            <h2 className="text-xl font-bold text-white mb-1 lowercase">
              name your lab
            </h2>
            <p className="text-zinc-500 text-sm mb-4 lowercase">
              this is how others will know you
            </p>
            <div className="w-full md:max-w-[50%] mx-auto">
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="enter your lab name..."
                maxLength={32}
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all lowercase text-center"
              />
            </div>
          </CardContent>
        </Card>

        {/* choose your path */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-3">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-1 lowercase">
                choose your path
              </h2>
              <p className="text-zinc-500 text-sm lowercase">
                your founder type shapes your lab&apos;s strengths
              </p>
              <p className="text-zinc-600 text-xs lowercase mt-1">
                this decision is permanent
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {FOUNDER_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedType === option.type;

                return (
                  <button
                    key={option.type}
                    onClick={() => setSelectedType(option.type)}
                    className={cn(
                      "relative p-8 rounded-2xl border-2 transition-all duration-300 text-left group",
                      option.bgColor,
                      isSelected
                        ? `${
                            option.borderColor
                          } ring-2 ring-offset-2 ring-offset-zinc-950 ${option.borderColor.replace(
                            "border-",
                            "ring-"
                          )}`
                        : `border-zinc-800 ${option.hoverBorder}`
                    )}
                  >
                    {/* glow effect */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity",
                        option.color,
                        isSelected ? "opacity-10" : "group-hover:opacity-5"
                      )}
                    />

                    <div className="relative z-10">
                      {/* header */}
                      <h3 className="text-xl font-bold mb-1">{option.name}</h3>
                      <p className="text-zinc-500 text-sm mb-8">
                        {option.description}
                      </p>

                      {/* stat name header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            option.iconBgColor
                          )}
                        >
                          <Icon
                            className={cn("w-5 h-5", option.bonusColor)}
                            weight="bold"
                          />
                        </div>
                        <span
                          className={cn("text-lg font-bold", option.bonusColor)}
                        >
                          {option.bonusLabel}
                        </span>
                      </div>

                      {/* two-column base vs bonus display */}
                      <div
                        className={cn(
                          "rounded-xl border-2 overflow-hidden",
                          option.iconBgColor,
                          option.borderColor
                        )}
                      >
                        <div className="grid grid-cols-2 gap-3 p-4">
                          {/* base column */}
                          <div className="text-center">
                            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                              base
                            </div>
                            <div className="text-2xl font-mono text-white/50">
                              {option.baseValue}
                            </div>
                          </div>
                          {/* bonus column */}
                          <div className="text-center">
                            <div
                              className={cn(
                                "text-[10px] uppercase tracking-wider mb-1",
                                option.bonusColor
                              )}
                            >
                              bonus
                            </div>
                            <div
                              className={cn(
                                "text-2xl font-black",
                                option.bonusColor
                              )}
                            >
                              {option.bonusValue}
                            </div>
                          </div>
                        </div>
                        {/* description */}
                        <div className="px-4 py-2 bg-black/30 border-t border-white/10">
                          <p className="text-xs text-white/60 text-center">
                            {option.bonusDescription}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* selected indicator */}
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
          </CardContent>
        </Card>

        {/* initialize button */}
        <div>
          {error && (
            <p className="mb-2 text-sm text-red-400 lowercase text-center">
              {error}
            </p>
          )}
          <ActionButton
            label="initialize lab"
            onClick={handleCreate}
            disabled={!selectedType || !labName.trim()}
            missingItems={[
              ...(!labName.trim() ? ["lab name"] : []),
              ...(!selectedType ? ["founder type"] : []),
            ]}
            isLoading={isCreating}
            loadingLabel="initializing lab..."
            size="large"
          />
        </div>
      </div>
    </div>
  );
}
