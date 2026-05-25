import type { Accent } from "@/types/ui";

export interface AccentClasses {
  /** Solid foreground (text + icon) */
  text: string;
  /** Solid background */
  bg: string;
  /** Subtle ~8% tinted background */
  tint: string;
  /** Border tinted to ~30% */
  border: string;
  /** ring-1 + tint, for focus / unread highlight */
  ring: string;
  /** Soft icon chip backdrop, ~16% alpha */
  chipBg: string;
}

export const ACCENT: Record<Accent, AccentClasses> = {
  yellow: {
    text: "text-yellow-500",
    bg: "bg-yellow-500",
    tint: "bg-yellow-500/[0.08]",
    border: "border-yellow-500/30",
    ring: "ring-yellow-500/30",
    chipBg: "bg-yellow-500/[0.16]",
  },
  sky: {
    text: "text-sky-500",
    bg: "bg-sky-500",
    tint: "bg-sky-500/[0.08]",
    border: "border-sky-500/30",
    ring: "ring-sky-500/30",
    chipBg: "bg-sky-500/[0.16]",
  },
  orange: {
    text: "text-orange-500",
    bg: "bg-orange-500",
    tint: "bg-orange-500/[0.08]",
    border: "border-orange-500/30",
    ring: "ring-orange-500/30",
    chipBg: "bg-orange-500/[0.16]",
  },
  rose: {
    text: "text-rose-500",
    bg: "bg-rose-500",
    tint: "bg-rose-500/[0.08]",
    border: "border-rose-500/30",
    ring: "ring-rose-500/30",
    chipBg: "bg-rose-500/[0.16]",
  },
  emerald: {
    text: "text-emerald-500",
    bg: "bg-emerald-500",
    tint: "bg-emerald-500/[0.08]",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/30",
    chipBg: "bg-emerald-500/[0.16]",
  },
  lime: {
    text: "text-lime-500",
    bg: "bg-lime-500",
    tint: "bg-lime-500/[0.08]",
    border: "border-lime-500/30",
    ring: "ring-lime-500/30",
    chipBg: "bg-lime-500/[0.16]",
  },
  blue: {
    text: "text-blue-500",
    bg: "bg-blue-500",
    tint: "bg-blue-500/[0.08]",
    border: "border-blue-500/30",
    ring: "ring-blue-500/30",
    chipBg: "bg-blue-500/[0.16]",
  },
  violet: {
    text: "text-violet-500",
    bg: "bg-violet-500",
    tint: "bg-violet-500/[0.08]",
    border: "border-violet-500/30",
    ring: "ring-violet-500/30",
    chipBg: "bg-violet-500/[0.16]",
  },
};
