"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  X,
  Bell,
  Trophy,
  Sparkle,
  CheckCircle,
  UserPlus,
} from "@phosphor-icons/react";

interface NotificationPanelProps {
  userId: string;
  onClose: () => void;
}

export function NotificationPanel({ userId, onClose }: NotificationPanelProps) {
  const notifications = useQuery(api.notifications.getAllNotifications, {
    userId: userId as Id<"users">,
    limit: 30,
  });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkAllRead = async () => {
    await markAllAsRead({ userId: userId as Id<"users"> });
  };

  const getIcon = (type: string) => {
    switch (type) {
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

  const getIconColor = (type: string) => {
    switch (type) {
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
            <Bell className="w-5 h-5 text-zinc-400" weight="fill" />
            <h2 className="font-semibold">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            {notifications && notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const iconColor = getIconColor(notification.type);

                return (
                  <div
                    key={notification._id}
                    className={cn(
                      "p-4 transition-colors",
                      !notification.read && "bg-zinc-800/30"
                    )}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead({ notificationId: notification._id });
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                          iconColor
                        )}
                      >
                        <Icon className="w-5 h-5 text-white" weight="bold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {notification.message}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

