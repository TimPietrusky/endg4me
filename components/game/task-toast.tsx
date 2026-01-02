"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Trophy,
  Sparkle,
  UserPlus,
  Brain,
  Briefcase,
  X,
  Confetti,
} from "@phosphor-icons/react";
import { TASKS, type TaskConfig } from "@/convex/lib/gameConstants";

interface TaskToastProps {
  userId: string;
}

interface ToastItem {
  id: string;
  notification: Doc<"notifications">;
  isExiting: boolean;
}

export function TaskToastContainer({ userId }: TaskToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [mountTime] = useState(() => Date.now());

  // Get recent notifications (since component mounted - for initial load)
  // This prevents the infinite re-render loop from Date.now() changing
  const notifications = useQuery(api.notifications.getRecentNotifications, {
    userId: userId as Id<"users">,
    since: mountTime - 5000, // Just last 5 seconds at mount to catch recent completions
  });

  // Watch for new notifications
  useEffect(() => {
    if (!notifications) return;

    notifications.forEach((notification) => {
      // Only show toasts for task completions and level ups
      const shouldToast = [
        "task_complete",
        "hire_complete", 
        "level_up",
        "unlock",
      ].includes(notification.type);

      if (shouldToast && !seenIds.has(notification._id)) {
        // Mark as seen
        setSeenIds((prev) => new Set([...prev, notification._id]));

        // Add toast
        const toastId = `${notification._id}-${Date.now()}`;
        setToasts((prev) => [
          ...prev,
          { id: toastId, notification, isExiting: false },
        ]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) =>
              t.id === toastId ? { ...t, isExiting: true } : t
            )
          );
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastId));
          }, 300);
        }, 5000);
      }
    });
  }, [notifications, seenIds]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === toastId ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 300);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <TaskToast
          key={toast.id}
          notification={toast.notification}
          isExiting={toast.isExiting}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}

function TaskToast({
  notification,
  isExiting,
  onDismiss,
}: {
  notification: Doc<"notifications">;
  isExiting: boolean;
  onDismiss: () => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "level_up":
        return Trophy;
      case "unlock":
        return Sparkle;
      case "hire_complete":
        return UserPlus;
      default:
        return CheckCircle;
    }
  };

  const getGradient = () => {
    switch (notification.type) {
      case "level_up":
        return "from-violet-500 to-purple-600";
      case "unlock":
        return "from-amber-500 to-orange-600";
      case "hire_complete":
        return "from-blue-500 to-cyan-600";
      default:
        return "from-emerald-500 to-cyan-600";
    }
  };

  const getBorderGlow = () => {
    switch (notification.type) {
      case "level_up":
        return "shadow-violet-500/20";
      case "unlock":
        return "shadow-amber-500/20";
      case "hire_complete":
        return "shadow-blue-500/20";
      default:
        return "shadow-emerald-500/20";
    }
  };

  const Icon = getIcon();
  const isSpecial = notification.type === "level_up" || notification.type === "unlock";

  return (
    <div
      className={cn(
        "pointer-events-auto w-80 bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-zinc-700/50 p-4 shadow-2xl transition-all duration-300",
        getBorderGlow(),
        isExiting
          ? "opacity-0 translate-x-full"
          : "opacity-100 translate-x-0 animate-in slide-in-from-right-full"
      )}
    >
      {/* Celebration particles for level up */}
      {isSpecial && (
        <div className="absolute -top-2 -right-2">
          <Confetti className="w-8 h-8 text-amber-400 animate-bounce" weight="fill" />
        </div>
      )}

      <div className="flex gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
            getGradient(),
            isSpecial && "animate-pulse"
          )}
        >
          <Icon className="w-6 h-6 text-white" weight="bold" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-white">{notification.title}</p>
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-zinc-800 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
          <p className="text-sm text-emerald-400 font-medium">
            {notification.message}
          </p>
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full bg-gradient-to-r rounded-full",
            getGradient(),
            "animate-shrink-width"
          )}
          style={{ animationDuration: "5s" }}
        />
      </div>
    </div>
  );
}

