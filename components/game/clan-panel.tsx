"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { cn, formatCompact } from "@/lib/utils";
import {
  X,
  Users,
  Trophy,
  Plus,
  SignIn,
  SignOut,
  Crown,
} from "@phosphor-icons/react";

interface ClanPanelProps {
  userId: string;
  playerState: Doc<"playerState">;
  onClose: () => void;
}

export function ClanPanel({ userId, playerState, onClose }: ClanPanelProps) {
  const [view, setView] = useState<"list" | "create">("list");
  const [clanName, setClanName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userClan = useQuery(api.clans.getUserClan, {
    userId: userId as Id<"users">,
  });
  const allClans = useQuery(api.clans.getAllClans, {});

  const createClan = useMutation(api.clans.createClan);
  const joinClan = useMutation(api.clans.joinClan);
  const leaveClan = useMutation(api.clans.leaveClan);

  const handleCreateClan = async () => {
    if (!clanName.trim()) return;
    setIsCreating(true);
    setError(null);

    try {
      await createClan({
        userId: userId as Id<"users">,
        name: clanName.trim(),
      });
      setView("list");
      setClanName("");
    } catch (err: any) {
      setError(err.message || "Failed to create clan");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinClan = async (clanId: Id<"clans">) => {
    try {
      await joinClan({
        userId: userId as Id<"users">,
        clanId,
      });
    } catch (err: any) {
      setError(err.message || "Failed to join clan");
    }
  };

  const handleLeaveClan = async () => {
    try {
      await leaveClan({ userId: userId as Id<"users"> });
    } catch (err: any) {
      setError(err.message || "Failed to leave clan");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-400" weight="fill" />
            <h2 className="font-semibold">Clans</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {/* User's Clan */}
          {userClan && (
            <div className="p-4 border-b border-zinc-800 bg-emerald-500/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" weight="fill" />
                  </div>
                  <div>
                    <p className="font-semibold">{userClan.name}</p>
                    <p className="text-sm text-zinc-500">
                      {userClan.memberCount} member
                      {userClan.memberCount !== 1 && "s"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLeaveClan}
                  className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <SignOut className="w-4 h-4" />
                  Leave
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <Trophy className="w-4 h-4" />
                +5% XP Gain Active
              </div>
            </div>
          )}

          {/* Create or List View */}
          {!userClan && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-zinc-800">
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                    view === "list"
                      ? "text-white border-b-2 border-emerald-500"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  Browse Clans
                </button>
                <button
                  onClick={() => setView("create")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                    view === "create"
                      ? "text-white border-b-2 border-emerald-500"
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  Create Clan
                </button>
              </div>

              {error && (
                <div className="p-3 mx-4 mt-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              {view === "create" ? (
                <div className="p-4">
                  <label className="block text-sm text-zinc-400 mb-2">
                    Clan Name
                  </label>
                  <input
                    type="text"
                    value={clanName}
                    onChange={(e) => setClanName(e.target.value)}
                    placeholder="Enter clan name..."
                    maxLength={24}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    onClick={handleCreateClan}
                    disabled={!clanName.trim() || isCreating}
                    className={cn(
                      "w-full mt-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                      clanName.trim() && !isCreating
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    )}
                  >
                    {isCreating ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Create Clan
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  {!allClans || allClans.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                      <p className="text-zinc-500">No clans yet</p>
                      <p className="text-sm text-zinc-600">
                        Be the first to create one!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allClans.map((clan) => (
                        <div
                          key={clan._id}
                          className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                              <Users
                                className="w-5 h-5 text-white"
                                weight="bold"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{clan.name}</p>
                              <p className="text-xs text-zinc-500">
                                {clan.memberCount} member
                                {clan.memberCount !== 1 && "s"} ·{" "}
                                {formatCompact(clan.totalResearchPoints)} RP
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleJoinClan(clan._id)}
                            className="px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <SignIn className="w-4 h-4" />
                            Join
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

