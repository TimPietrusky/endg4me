import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCash(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format time remaining
export function formatTimeRemaining(completesAt: number): string {
  const remaining = completesAt - Date.now();
  if (remaining <= 0) return "Complete";

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Format duration in minutes
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}

// Calculate XP progress percentage
export function calculateXPProgress(
  currentXP: number,
  xpRequired: number
): number {
  return Math.min((currentXP / xpRequired) * 100, 100);
}

// Format large numbers into compact form (1200 → 1.2k, 1500000 → 1.5M)
export function formatCompact(value: number | string | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  
  if (absNum >= 1_000_000_000) {
    const formatted = (absNum / 1_000_000_000).toFixed(1);
    return sign + (formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted) + "B";
  }
  if (absNum >= 1_000_000) {
    const formatted = (absNum / 1_000_000).toFixed(1);
    return sign + (formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted) + "M";
  }
  if (absNum >= 1_000) {
    const formatted = (absNum / 1_000).toFixed(1);
    return sign + (formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted) + "k";
  }
  
  return sign + String(absNum);
}

// Format time in seconds to compact form (300 → 5m, 7200 → 2h, 90000 → 1d 1h)
export function formatTimeCompact(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

