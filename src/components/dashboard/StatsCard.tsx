import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { ResponsiveContainer, Area, AreaChart } from "recharts";
import { getPaletteStop } from "./progress/chartPalette";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
  /** Optional sparkline data; when not provided, mock data is generated from value */
  sparklineData?: number[];
  /** Index into the unified chart palette (defaults to 0 = teal accent). */
  paletteIndex?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const useAnimatedNumber = (target: number, duration = 1200) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (Number.isNaN(target)) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * easeOutCubic(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
};

const StatsCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  onClick,
  sparklineData,
  paletteIndex = 0,
}: StatsCardProps) => {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^\d.-]/g, "")) || 0;
  const animated = useAnimatedNumber(numericValue);
  const displayValue = typeof value === "number" ? animated : value;
  const stop = getPaletteStop(paletteIndex);

  // Generate a smooth, organic sparkline that ends at the actual value.
  // Uses an ease-out base trend with small deterministic oscillations so
  // the curve looks lively instead of a flat monotonic ramp.
  const data = useMemo(() => {
    if (sparklineData && sparklineData.length) {
      return sparklineData.map((v, i) => ({ i, v }));
    }
    const points = 16;
    const target = Math.max(numericValue, 0);
    // Deterministic seed derived from the value so each card stays stable
    const seed = (numericValue * 9301 + 49297) % 233280 || 1;
    const rand = (i: number) => {
      const x = Math.sin(seed + i * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: points }).map((_, i) => {
      const t = i / (points - 1);
      const eased = 1 - Math.pow(1 - t, 2.4);
      // Gentle wave + tiny noise, dampened near the end so we land on target
      const wave = Math.sin(t * Math.PI * 2.2) * 0.08;
      const noise = (rand(i) - 0.5) * 0.06;
      const damp = 1 - Math.pow(t, 3);
      const factor = i === points - 1 ? 1 : eased + (wave + noise) * damp;
      return { i, v: Math.max(0, target * factor) };
    });
  }, [sparklineData, numericValue]);

  const gradientId = useMemo(
    () => `spark-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden p-6 rounded-2xl bg-card/60 backdrop-blur-sm",
        "border border-white/10 transition-all duration-300",
        "hover:border-accent/30 hover:shadow-[0_8px_32px_-12px_hsl(var(--accent)/0.25)]",
        onClick && "cursor-pointer hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      {/* Radial accent glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, hsl(var(--accent) / 0.12), transparent 60%)",
        }}
      />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2 tabular-nums tracking-tight">
            {displayValue}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    trend.isPositive ? "bg-emerald-400" : "bg-red-400"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    trend.isPositive ? "bg-emerald-500" : "bg-red-500"
                  )}
                />
              </span>
              <p
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-emerald-500" : "text-red-500"
                )}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}% cette semaine
              </p>
            </div>
          )}
        </div>

        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0",
            "shadow-[0_0_12px_hsl(var(--accent)/0.3)] ring-1 ring-accent/20"
          )}
        >
          <Icon className="w-6 h-6 text-accent" />
        </div>
      </div>

      {/* Sparkline */}
      <div className="relative mt-4 h-16 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 2, left: 6 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stop.accent} stopOpacity={0.5} />
                <stop offset="55%" stopColor={stop.mid} stopOpacity={0.22} />
                <stop offset="100%" stopColor={stop.tail} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={stop.mid} stopOpacity={0.9} />
                <stop offset="100%" stopColor={stop.accent} stopOpacity={1} />
              </linearGradient>
              <filter id={`${gradientId}-glow`} x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Area
              type="basis"
              dataKey="v"
              stroke={`url(#${gradientId}-stroke)`}
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={`url(#${gradientId})`}
              filter={`url(#${gradientId}-glow)`}
              isAnimationActive
              animationDuration={1100}
              animationEasing="ease-out"
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsCard;
