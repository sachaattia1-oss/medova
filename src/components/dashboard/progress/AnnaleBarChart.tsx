import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { getPaletteStop, getScorePaletteStop } from "./chartPalette";

export interface AnnaleDatum {
  /** Short label shown on the axis */
  name: string;
  /** Full label shown in the tooltip */
  fullName: string;
  /** Average score out of 100 */
  score: number;
  /** Average score out of 20 (one decimal) */
  score20: number;
  /** Number of annales taken */
  count: number;
  /** Stable id used for gradient defs */
  colorId: string;
}

interface Props {
  title: string;
  icon: LucideIcon;
  data: AnnaleDatum[];
  loading?: boolean;
  emptyLabel: string;
  /** horizontal layout is better for long course names */
  layout?: "vertical" | "horizontal";
  idPrefix: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as AnnaleDatum;
  const stop = getScorePaletteStop(d.score);
  return (
    <div className="bg-popover/85 backdrop-blur-md border border-border/60 rounded-xl p-3 shadow-xl min-w-[190px]">
      <p className="font-semibold text-sm mb-2">{d.fullName}</p>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-bold tabular-nums" style={{ color: stop.accent }}>
          {d.score20.toFixed(1)}
          <span className="text-sm text-muted-foreground font-medium">/20</span>
        </span>
        <span className="text-sm font-semibold text-muted-foreground tabular-nums">
          {d.score}/100
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-2">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, d.score))}%`,
            background: `linear-gradient(90deg, ${stop.accent} 0%, ${stop.mid} 55%, ${stop.tail} 100%)`,
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {d.count} annale{d.count > 1 ? "s" : ""} réalisée{d.count > 1 ? "s" : ""}
      </p>
    </div>
  );
};

const AnnaleBarChart = ({
  title,
  icon: Icon,
  data,
  loading,
  emptyLabel,
  layout = "vertical",
  idPrefix,
}: Props) => {
  const avg =
    data.length > 0 ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;
  const isHorizontal = layout === "horizontal";
  const height = isHorizontal ? Math.max(220, data.length * 46 + 60) : 320;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50 shadow-md overflow-hidden h-full">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shadow-[0_0_12px_hsl(var(--accent)/0.3)]">
              <Icon className="w-5 h-5 text-accent" />
            </div>
            <span>{title}</span>
            {data.length > 0 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full tabular-nums">
                Moyenne {avg}/100 · {(avg / 5).toFixed(1)}/20
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart
                data={data}
                layout={isHorizontal ? "vertical" : "horizontal"}
                margin={
                  isHorizontal
                    ? { top: 8, right: 48, left: 8, bottom: 8 }
                    : { top: 28, right: 12, left: -12, bottom: 8 }
                }
              >
                <defs>
                  {data.map((d, i) => {
                    const stop = getPaletteStop(i);
                    return (
                      <linearGradient
                        key={d.colorId}
                        id={`${idPrefix}-${d.colorId}`}
                        x1="0"
                        y1="0"
                        x2={isHorizontal ? "1" : "0"}
                        y2={isHorizontal ? "0" : "1"}
                      >
                        <stop offset="0%" stopColor={stop.accent} stopOpacity={1} />
                        <stop offset="55%" stopColor={stop.mid} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={stop.tail} stopOpacity={0.25} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.4}
                  horizontal={!isHorizontal}
                  vertical={isHorizontal}
                />
                {isHorizontal ? (
                  <>
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                  </>
                )}
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "hsl(var(--accent) / 0.06)" }}
                />
                <ReferenceLine
                  {...(isHorizontal ? { x: avg } : { y: avg })}
                  stroke="hsl(var(--accent))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.55}
                />
                <Bar
                  dataKey="score"
                  radius={isHorizontal ? [0, 10, 10, 0] : [10, 10, 0, 0]}
                  maxBarSize={isHorizontal ? 26 : 56}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  <LabelList
                    dataKey="score20"
                    position={isHorizontal ? "right" : "top"}
                    formatter={(v: number) => `${Number(v).toFixed(1)}/20`}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      fill: "hsl(var(--foreground))",
                    }}
                  />
                  {data.map((d, i) => (
                    <Cell key={d.colorId} fill={`url(#${idPrefix}-${d.colorId})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
              <Target className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm text-center px-4">{emptyLabel}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnnaleBarChart;
