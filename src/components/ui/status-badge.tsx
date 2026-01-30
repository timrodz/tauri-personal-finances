import { cn } from "@/lib/utils";

type StatusLevel = "info" | "warning" | "error";

interface StatusBadgeProps {
  level?: StatusLevel;
  text: string;
  pulse?: boolean;
  className?: string;
}

const levelStyles: Record<StatusLevel, string> = {
  info: "bg-emerald-500/50 text-foreground border-emerald-500/30",
  warning: "bg-amber-500/50 text-foreground border-amber-500/30",
  error: "bg-red-500/30 text-foreground border-red-500/c30",
};

export function StatusBadge({
  level = "info",
  text,
  pulse = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        levelStyles[level],
        pulse && level === "error" && "animate-badge-pulse-error",
        className,
      )}
    >
      {text}
    </span>
  );
}
