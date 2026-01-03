"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn, formatCompact } from "@/lib/utils";
import {
  X,
  Brain,
  Trophy,
  Lightning,
  Sparkle,
  Medal,
} from "@phosphor-icons/react";

interface ModelCollectionProps {
  labId: string;
  onClose: () => void;
}

export function ModelCollection({ labId, onClose }: ModelCollectionProps) {
  const models = useQuery(api.tasks.getTrainedModels, {
    labId: labId as Id<"labs">,
    limit: 50,
  });
  const stats = useQuery(api.tasks.getModelStats, {
    labId: labId as Id<"labs">,
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" weight="bold" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Model Collection</h2>
              <p className="text-sm text-zinc-500">Your trained AI models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 p-4 bg-zinc-800/30 border-b border-zinc-800/50">
            <StatMini
              icon={Brain}
              label="Total Models"
              value={stats.totalModels.toString()}
              color="text-violet-400"
            />
            <StatMini
              icon={Lightning}
              label="Total Score"
              value={formatCompact(stats.totalScore)}
              color="text-cyan-400"
            />
            <StatMini
              icon={Sparkle}
              label="Avg Score"
              value={formatCompact(stats.averageScore)}
              color="text-amber-400"
            />
            <StatMini
              icon={Trophy}
              label="Best Score"
              value={stats.bestModel?.score ? formatCompact(stats.bestModel.score) : "—"}
              color="text-emerald-400"
            />
          </div>
        )}

        {/* Model List */}
        <div className="max-h-[50vh] overflow-y-auto p-4">
          {!models || models.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg">No models trained yet</p>
              <p className="text-sm text-zinc-600 mt-2">
                Start training models to build your collection!
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {models.map((model, index) => {
                const isBest = stats?.bestModel?._id === model._id;
                const isSmall = model.modelType === "small_3b";

                return (
                  <div
                    key={model._id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all",
                      isBest
                        ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30"
                        : "bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-600/50"
                    )}
                  >
                    {/* Model Icon */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center relative",
                        isSmall
                          ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                          : "bg-gradient-to-br from-violet-500 to-purple-600"
                      )}
                    >
                      <Brain className="w-6 h-6 text-white" weight="bold" />
                      {isBest && (
                        <div className="absolute -top-1 -right-1">
                          <Medal
                            className="w-5 h-5 text-amber-400"
                            weight="fill"
                          />
                        </div>
                      )}
                    </div>

                    {/* Model Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{model.name}</p>
                        {isBest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                            Best
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500">
                        {isSmall ? "3B Parameters" : "7B Parameters"} ·{" "}
                        {formatDate(model.trainedAt)}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="font-bold text-lg text-emerald-400">
                        {formatCompact(model.score)}
                      </p>
                      <p className="text-xs text-zinc-500">Score</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-xs text-zinc-600 text-center">
            Train more models to increase your total score
          </p>
        </div>
      </div>
    </div>
  );
}

function StatMini({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; weight?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} weight="bold" />
      <p className="font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

