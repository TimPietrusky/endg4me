"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Flask, 
  Brain, 
  Cpu, 
  Trophy, 
  CurrencyDollar,
  Lightning,
  Clock,
  CaretDoubleUp,
  UserPlus,
  Rocket,
  ChartLineUp,
} from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { ActionCard } from "@/components/game/dashboard/action-card";
import type { Action } from "@/lib/game-types";
import { CONTENT_CATALOG, type ContentEntry } from "@/convex/lib/contentCatalog";

// Get all model content for display
const MODEL_ENTRIES = CONTENT_CATALOG.filter((c) => c.contentType === "model");

interface LandingContentProps {
  isLoggedIn: boolean;
  signInUrl: string;
}

// Game steps data
const GAME_STEPS = [
  {
    icon: Flask,
    title: "Create Your Lab",
    description: "Start your AI research facility with basic resources and a single compute unit.",
    color: "cyan",
  },
  {
    icon: Brain,
    title: "Research Models",
    description: "Spend Research Points to unlock new model blueprints and capabilities.",
    color: "purple",
  },
  {
    icon: Cpu,
    title: "Train Models",
    description: "Train TTS, VLM, and LLM models. Each training creates a scored version.",
    color: "cyan",
  },
  {
    icon: Trophy,
    title: "Compete on Leaderboards",
    description: "Your best model scores compete globally. Climb the ranks to prove your lab's worth.",
    color: "amber",
  },
  {
    icon: CurrencyDollar,
    title: "Generate Revenue",
    description: "Complete contracts, do freelance work, and deploy models for income.",
    color: "green",
  },
  {
    icon: CaretDoubleUp,
    title: "Level Up",
    description: "Earn XP to level up, unlock upgrades, and expand your lab's capabilities.",
    color: "purple",
  },
];

// Staff examples
const STAFF_EXAMPLES = [
  {
    name: "Junior Researcher",
    effect: "+1 Queue Slot",
    duration: "8 min",
    cost: 300,
    level: 2,
  },
  {
    name: "Optimization Specialist", 
    effect: "+15% Speed",
    duration: "10 min",
    cost: 1000,
    level: 3,
  },
  {
    name: "Business Partner",
    effect: "+25% Money",
    duration: "15 min",
    cost: 900,
    level: 6,
  },
  {
    name: "Senior Engineer",
    effect: "+1 Compute",
    duration: "20 min",
    cost: 1500,
    level: 10,
  },
];

const COLOR_CLASSES: Record<string, string> = {
  cyan: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
  purple: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  amber: "text-amber-400 bg-amber-500/20 border-amber-500/30",
  green: "text-green-400 bg-green-500/20 border-green-500/30",
};

export function LandingContent({ isLoggedIn, signInUrl }: LandingContentProps) {
  // Demo action state with localStorage persistence
  const [demoAction, setDemoAction] = useState<Action>({
    id: "demo-llm",
    category: "TRAINING",
    name: "LLM",
    description: "Train a large language model for maximum research output",
    size: "7B",
    cost: 1200,
    duration: 8, // 8 seconds for demo
    rpReward: 260,
    xpReward: 60,
    disabled: false,
    image: "/advanced-ai-training-purple-cyber.jpg",
    isActive: false,
    remainingTime: 0,
    latestVersion: undefined,
  });

  // Load version from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("demo_llm_version");
    if (stored) {
      setDemoAction(prev => ({ ...prev, latestVersion: parseInt(stored, 10) }));
    }
  }, []);

  // Handle training completion
  useEffect(() => {
    if (!demoAction.isActive) return;

    const interval = setInterval(() => {
      setDemoAction(prev => {
        const newRemaining = Math.max(0, (prev.remainingTime || 0) - 1);
        
        if (newRemaining <= 0) {
          // Training complete - increment version
          const newVersion = (prev.latestVersion || 0) + 1;
          localStorage.setItem("demo_llm_version", String(newVersion));
          return {
            ...prev,
            isActive: false,
            remainingTime: 0,
            latestVersion: newVersion,
          };
        }
        
        return { ...prev, remainingTime: newRemaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [demoAction.isActive]);

  const handleStartAction = useCallback(() => {
    setDemoAction(prev => ({
      ...prev,
      isActive: true,
      remainingTime: prev.duration,
    }));
  }, []);

  return (
    <>
      {/* How It Works Section */}
      <section className="min-h-screen bg-gradient-to-b from-[#05050a] to-[#0a0a18] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-white mb-4 tracking-tight">
            Build Your AI Lab
          </h2>
          <p className="text-center text-white/50 font-mono mb-16 text-lg max-w-2xl mx-auto">
            From a single compute unit to a research empire. Here&apos;s how the game works.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAME_STEPS.map((step, index) => {
              const Icon = step.icon;
              const colorClass = COLOR_CLASSES[step.color];
              return (
                <Card key={index} className="bg-white/5 border-white/10 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${colorClass}`}>
                        <Icon weight="bold" className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white/30 font-mono text-sm">{String(index + 1).padStart(2, '0')}</span>
                          <h3 className="text-white font-semibold text-lg">{step.title}</h3>
                        </div>
                        <p className="text-white/50 text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-24 bg-[#0a0a18]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Try Training a Model
          </h2>
          <p className="text-center text-white/50 mb-12 max-w-xl mx-auto">
            This is the actual game component. Click to see it in action.
          </p>
          
          <div className="max-w-xs mx-auto">
            <ActionCard
              action={demoAction}
              onStartAction={handleStartAction}
            />
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-24 bg-gradient-to-b from-[#0a0a18] to-[#05050a]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Model Blueprints
          </h2>
          <p className="text-center text-white/50 mb-12 max-w-xl mx-auto">
            Unlock and train different types of AI models. Each has unique applications and score potential.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODEL_ENTRIES.map((model) => {
              const typeColors: Record<string, string> = {
                tts: "from-cyan-500/30 to-cyan-600/10 border-cyan-500/40",
                vlm: "from-emerald-500/30 to-teal-600/10 border-emerald-500/40",
                llm: "from-purple-500/30 to-violet-600/10 border-purple-500/40",
              };
              return (
                <Card key={model.id} className={`overflow-hidden bg-gradient-to-br ${typeColors[model.modelType!]} border`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Brain weight="bold" className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{model.name}</h4>
                        <span className="text-xs font-mono text-white/50 uppercase">{model.modelType}</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/60 mb-4">{model.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-white/40">
                        <ChartLineUp weight="bold" className="w-4 h-4" />
                        <span>Score: {model.scoreRange!.min}-{model.scoreRange!.max}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/40">
                        <Rocket weight="bold" className="w-4 h-4" />
                        <span>Lvl {model.minLevel ?? 1}+</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Staff Section */}
      <section className="py-24 bg-[#05050a]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Hire Staff
          </h2>
          <p className="text-center text-white/50 mb-12 max-w-xl mx-auto">
            Temporarily boost your lab with specialized staff. Each hire provides unique benefits.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAFF_EXAMPLES.map((staff, index) => (
              <Card key={index} className="bg-white/5 border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center border border-pink-500/30">
                      <UserPlus weight="bold" className="w-5 h-5 text-pink-400" />
                    </div>
                    <h4 className="font-semibold text-white text-sm">{staff.name}</h4>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Effect</span>
                      <span className="text-green-400 font-mono">{staff.effect}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Duration</span>
                      <span className="text-white/70 font-mono flex items-center gap-1">
                        <Clock weight="bold" className="w-3 h-3" />
                        {staff.duration}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Cost</span>
                      <span className="text-amber-400 font-mono flex items-center gap-1">
                        <CurrencyDollar weight="bold" className="w-3 h-3" />
                        ${staff.cost}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Unlock</span>
                      <span className="text-white/50 font-mono text-xs">Level {staff.level}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-[#0a0a18] to-[#05050a]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
            <Rocket weight="bold" className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start?
          </h2>
          <p className="text-white/50 mb-8">
            Create your lab and begin the race to singularity.
          </p>
          <a 
            href={isLoggedIn ? "/operate" : signInUrl}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors"
          >
            {isLoggedIn ? "Continue Playing" : "Start Now"}
            <Lightning weight="bold" className="w-5 h-5" />
          </a>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-[#05050a] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-white/30 text-sm font-mono">
            endg4me — race to singularity
          </p>
        </div>
      </footer>
    </>
  );
}

