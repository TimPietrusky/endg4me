"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { cn, formatCash, formatTimeRemaining, calculateXPProgress } from "@/lib/utils";
import { TASKS, XP_CURVE, LEVEL_REWARDS, type TaskConfig } from "@/convex/lib/gameConstants";
import { useState, useEffect } from "react";
import {
  Brain,
  CurrencyDollar,
  Lightning,
  Star,
  Trophy,
  Users,
  Clock,
  Play,
  Queue,
  Bell,
  SignOut,
  Cpu,
  UserPlus,
  Briefcase,
  ChartLine,
  CaretRight,
  X,
} from "@phosphor-icons/react";
import { NotificationPanel } from "./notification-panel";
import { ClanPanel } from "./clan-panel";
import { TaskToastContainer } from "./task-toast";
import { ModelCollection } from "./model-collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";

interface LabDashboardProps {
  lab: Doc<"labs">;
  labState: Doc<"labState">;
  playerState: Doc<"playerState">;
  userId: string;
}

export function LabDashboard({
  lab,
  labState,
  playerState,
  userId,
}: LabDashboardProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showClans, setShowClans] = useState(false);
  const [showModels, setShowModels] = useState(false);

  const activeTasks = useQuery(api.tasks.getActiveTasks, { labId: lab._id });
  const freelanceCooldown = useQuery(api.tasks.getFreelanceCooldown, { labId: lab._id });
  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    userId: userId as Id<"users">,
  });
  const recentActivity = useQuery(api.notifications.getRecentActivity, {
    userId: userId as Id<"users">,
    limit: 5,
  });
  const queueStatus = useQuery(api.tasks.getQueueStatus, {
    userId: userId as Id<"users">,
  });
  const modelStats = useQuery(api.tasks.getModelStats, { labId: lab._id });

  const startTask = useMutation(api.tasks.startTask);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTask = async (
    taskType: "train_small_model" | "train_medium_model" | "freelance_contract" | "hire_junior_researcher"
  ) => {
    try {
      await startTask({ labId: lab._id, taskType });
    } catch (error: any) {
      console.error("Failed to start task:", error.message);
    }
  };

  const xpRequired = XP_CURVE[playerState.level] || 100;
  const xpProgress = calculateXPProgress(playerState.experience, xpRequired);
  const canJoinClans = playerState.level >= LEVEL_REWARDS.clanUnlockLevel;

  // Progressive disclosure: show features based on state
  const hasTrainedModel = labState.researchPoints > 0;
  const hasHiredStaff = labState.juniorResearchers > 0;
  const showParallelTasks = hasHiredStaff || labState.parallelTasks > 1;

  // Check task affordability
  const canAffordSmall = labState.cash >= TASKS.train_small_model.cost;
  const canAffordMedium = labState.cash >= TASKS.train_medium_model.cost;
  const canAffordHire =
    labState.cash >= TASKS.hire_junior_researcher.cost &&
    labState.juniorResearchers < labState.staffCapacity;
  const isFreelanceOnCooldown = freelanceCooldown && freelanceCooldown > Date.now();

  // Count in-progress tasks
  const inProgressTasks = activeTasks?.filter((t) => t.status === "in_progress") || [];
  const queuedTasks = activeTasks?.filter((t) => t.status === "queued") || [];
  const computeInUse = inProgressTasks.filter(
    (t) => t.type === "train_small_model" || t.type === "train_medium_model"
  ).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black" />

      {/* Header */}
      <header className="relative z-20 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" weight="bold" />
              </div>
              <div>
                <h1 className="font-bold text-lg">{lab.name}</h1>
                <p className="text-sm text-zinc-500 capitalize">
                  {lab.founderType} Founder
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount && unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Clans */}
              {canJoinClans && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowClans(!showClans)}
                >
                  <Users className="w-5 h-5" />
                </Button>
              )}

              {/* Sign out */}
              <a href="/api/auth/signout">
                <Button variant="ghost" size="icon">
                  <SignOut className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={CurrencyDollar}
            label="Cash"
            value={formatCash(labState.cash)}
            color="text-emerald-400"
          />
          {hasTrainedModel && (
            <StatCard
              icon={Lightning}
              label="Research Points"
              value={labState.researchPoints.toLocaleString()}
              color="text-cyan-400"
            />
          )}
          <StatCard
            icon={Star}
            label="Reputation"
            value={labState.reputation.toLocaleString()}
            color="text-amber-400"
          />
          <StatCard
            icon={Cpu}
            label="Compute"
            value={`${computeInUse}/${labState.computeUnits}`}
            color="text-purple-400"
          />
        </div>

        {/* Model Collection Button - shown after first model */}
        {modelStats && modelStats.totalModels > 0 && (
          <button
            onClick={() => setShowModels(true)}
            className="w-full mb-8 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-400/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" weight="bold" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Model Collection</p>
                  <p className="text-sm text-zinc-500">
                    {modelStats.totalModels} model{modelStats.totalModels !== 1 ? "s" : ""} trained · Best score: {modelStats.bestModel?.score.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              <CaretRight className="w-5 h-5 text-zinc-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        )}

        {/* Player Level */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" weight="fill" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Player Level</p>
                <p className="font-bold text-xl">Level {playerState.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">
                {playerState.experience} / {xpRequired} XP
              </p>
              {playerState.level < 10 && (
                <p className="text-xs text-zinc-600">
                  +{(playerState.level * LEVEL_REWARDS.globalEfficiencyPerLevel * 100).toFixed(0)}% efficiency
                </p>
              )}
            </div>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          {!canJoinClans && (
            <p className="mt-2 text-xs text-zinc-600">
              Reach level {LEVEL_REWARDS.clanUnlockLevel} to unlock Clans
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Actions Panel */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ChartLine className="w-5 h-5 text-emerald-400" />
              Actions
            </h2>

            {/* Training Actions */}
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wide">
                AI Training
              </h3>
              <div className="space-y-3">
                <ActionButton
                  icon={Brain}
                  title="Train Small Model (3B)"
                  subtitle={`${formatCash(TASKS.train_small_model.cost)} · 5 min`}
                  rewards="+120 RP, +5 Rep, +25 XP"
                  onClick={() => handleStartTask("train_small_model")}
                  disabled={!canAffordSmall || computeInUse >= labState.computeUnits}
                  color="cyan"
                />
                <ActionButton
                  icon={Brain}
                  title="Train Medium Model (7B)"
                  subtitle={`${formatCash(TASKS.train_medium_model.cost)} · 12 min`}
                  rewards="+260 RP, +12 Rep, +60 XP"
                  onClick={() => handleStartTask("train_medium_model")}
                  disabled={!canAffordMedium || computeInUse >= labState.computeUnits}
                  color="blue"
                />
              </div>
            </div>

            {/* Income Actions */}
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wide">
                Income
              </h3>
              <ActionButton
                icon={Briefcase}
                title="Freelance AI Contract"
                subtitle={isFreelanceOnCooldown ? `Cooldown: ${formatTimeRemaining(freelanceCooldown!)}` : "Free · 3 min"}
                rewards="+$400, +2 Rep, +10 XP"
                onClick={() => handleStartTask("freelance_contract")}
                disabled={!!isFreelanceOnCooldown}
                color="amber"
              />
            </div>

            {/* Hiring Actions */}
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wide">
                Hiring ({labState.juniorResearchers}/{labState.staffCapacity} Staff)
              </h3>
              <ActionButton
                icon={UserPlus}
                title="Hire Junior Researcher"
                subtitle={`${formatCash(TASKS.hire_junior_researcher.cost)} · 2 min`}
                rewards="+10% Research Speed, +1 Parallel Task"
                onClick={() => handleStartTask("hire_junior_researcher")}
                disabled={!canAffordHire}
                color="violet"
              />
            </div>
          </div>

          {/* Tasks Panel */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Active Tasks
              {showParallelTasks && (
                <span className="text-sm font-normal text-zinc-500">
                  ({inProgressTasks.length}/{labState.parallelTasks} slots)
                </span>
              )}
            </h2>

            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
              {inProgressTasks.length === 0 && queuedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No active tasks</p>
                  <p className="text-sm text-zinc-600">Start an action to begin!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgressTasks.map((task) => (
                    <TaskCard key={task._id} task={task} status="in_progress" />
                  ))}
                  {/* Only show queued section if queue is unlocked */}
                  {queueStatus?.unlocked && queuedTasks.length > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm text-zinc-500 pt-2">
                        <div className="flex items-center gap-2">
                          <Queue className="w-4 h-4" />
                          Queued
                        </div>
                        <span className="text-xs">
                          {queuedTasks.length}/{queueStatus.slots} slots
                        </span>
                      </div>
                      {queuedTasks.map((task) => (
                        <TaskCard key={task._id} task={task} status="queued" />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Queue Unlock Progress */}
            {queueStatus && !queueStatus.unlocked && (
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                    <Queue className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Task Queue Locked</p>
                    <p className="text-xs text-zinc-600">
                      Reach level {queueStatus.nextUnlockLevel} to unlock {queueStatus.nextUnlockSlots} queue slot{queueStatus.nextUnlockSlots !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Queue Upgrade Info */}
            {queueStatus?.unlocked && queueStatus.nextUnlockLevel && (
              <div className="text-xs text-zinc-600 text-center">
                Level {queueStatus.nextUnlockLevel}: +{(queueStatus.nextUnlockSlots || 0) - queueStatus.slots} queue slot
              </div>
            )}

            {/* Recent Activity Feed */}
            {recentActivity && recentActivity.length > 0 && (
              <>
                <h2 className="text-xl font-bold flex items-center gap-2 mt-8">
                  <ChartLine className="w-5 h-5 text-emerald-400" />
                  Recent Activity
                </h2>
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-4">
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <ActivityItem key={activity._id} activity={activity} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel
          userId={userId}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Clan Panel */}
      {showClans && (
        <ClanPanel
          userId={userId}
          playerState={playerState}
          onClose={() => setShowClans(false)}
        />
      )}

      {/* Toast notifications for task completions */}
      <TaskToastContainer userId={userId} />

      {/* Model Collection Panel */}
      {showModels && (
        <ModelCollection
          labId={lab._id}
          onClose={() => setShowModels(false)}
        />
      )}
    </div>
  );
}

function StatCard({
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
    <Card size="sm" className="bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("w-4 h-4", color)} weight="bold" />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ActionButton({
  icon: Icon,
  title,
  subtitle,
  rewards,
  onClick,
  disabled,
  color,
}: {
  icon: React.ComponentType<{ className?: string; weight?: string }>;
  title: string;
  subtitle: string;
  rewards: string;
  onClick: () => void;
  disabled: boolean;
  color: "cyan" | "blue" | "amber" | "violet";
}) {
  const colorClasses = {
    cyan: "from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500",
    blue: "from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500",
    amber: "from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500",
    violet: "from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500",
  };

  return (
    <Card
      size="sm"
      className={cn(
        "cursor-pointer transition-all group",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:ring-2 hover:ring-primary/20"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
            disabled ? "from-muted to-muted/80" : colorClasses[color]
          )}
        >
          <Icon className="w-6 h-6 text-white" weight="bold" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold truncate">{title}</p>
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          <Badge variant="secondary" className="mt-1 text-emerald-400 bg-emerald-500/10">
            {rewards}
          </Badge>
        </div>
        {!disabled && (
          <CaretRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
        )}
      </CardContent>
    </Card>
  );
}

function TaskCard({
  task,
  status,
}: {
  task: Doc<"tasks">;
  status: "in_progress" | "queued";
}) {
  const taskConfig = TASKS[task.type] as TaskConfig;
  const isInProgress = status === "in_progress";

  const progress = isInProgress && task.completesAt
    ? Math.min(
        ((Date.now() - (task.startedAt || 0)) /
          (task.completesAt - (task.startedAt || 0))) *
          100,
        100
      )
    : 0;

  return (
    <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm">{taskConfig.name}</p>
        {isInProgress && task.completesAt && (
          <span className="text-xs text-emerald-400">
            {formatTimeRemaining(task.completesAt)}
          </span>
        )}
        {!isInProgress && (
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Queue className="w-3 h-3" /> Waiting
          </span>
        )}
      </div>
      {isInProgress && (
        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Doc<"notifications"> }) {
  const getIcon = () => {
    switch (activity.type) {
      case "level_up":
        return Trophy;
      case "unlock":
        return Star;
      case "hire_complete":
        return UserPlus;
      default:
        return Lightning;
    }
  };

  const getColor = () => {
    switch (activity.type) {
      case "level_up":
        return "text-violet-400";
      case "unlock":
        return "text-amber-400";
      case "hire_complete":
        return "text-blue-400";
      default:
        return "text-emerald-400";
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const Icon = getIcon();

  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className={cn("w-4 h-4 flex-shrink-0", getColor())} weight="bold" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate">{activity.title}</p>
        <p className="text-xs text-emerald-400">{activity.message}</p>
      </div>
      <span className="text-xs text-zinc-600 flex-shrink-0">
        {formatTimeAgo(activity.createdAt)}
      </span>
    </div>
  );
}

