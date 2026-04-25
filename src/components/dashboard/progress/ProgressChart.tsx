import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Target, TrendingUp } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
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


export interface ChartDatum {
  name: string;
  fullName: string;
  score: number;
  qcm: number;
  colorId: string;
}

interface Props {
  data: ChartDatum[];
  loading: boolean;
  colors: string[];
}

// Compute simple 3-point moving average
const withMovingAverage = (data: ChartDatum[]) => {
  return data.map((d, i, arr) => {
    const window = arr.slice(Math.max(0, i - 1), i + 2);
    const avg = Math.round(
      window.reduce((s, x) => s + x.score, 0) / window.length
    );
    return { ...d, avg };
  });
};

const rankLabel = (score: number) => {
  if (score >= 90) return "Top 5%";
  if (score >= 80) return "Top 15%";
  if (score >= 70) return "Top 30%";
  if (score >= 50) return "Top 50%";
  return "À améliorer";
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const stop = getScorePaletteStop(data.score);
    const accentTint = stop.accent.replace("hsl(", "hsla(").replace(")", " / 0.15)");
    return (
      <div className="bg-popover/85 backdrop-blur-md border border-border/60 rounded-xl p-3 shadow-xl min-w-[180px]">
        <p className="font-semibold text-sm mb-1">{data.fullName}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Score moyen</span>
          <span className="font-bold text-foreground tabular-nums">
            {data.score}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, data.score))}%`,
              background: `linear-gradient(90deg, ${stop.accent} 0%, ${stop.mid} 55%, ${stop.tail} 100%)`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {data.qcm} QCM complété{data.qcm > 1 ? "s" : ""}
          </span>
          <span
            className="font-semibold px-1.5 py-0.5 rounded-md"
            style={{ color: stop.accent, background: accentTint }}
          >
            {rankLabel(data.score)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const ProgressChart = ({ data, loading, colors }: Props) => {
  const enriched = withMovingAverage(data);
  const overallAvg =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="mb-8 bg-gradient-to-br from-card to-muted/30 border-border/50 shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shadow-[0_0_12px_hsl(var(--accent)/0.3)]">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <span>Résultats des QCM par UE</span>
            {data.length > 0 && (
              <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                Moyenne {overallAvg}%
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
            <>
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart
                  data={enriched}
                  margin={{ top: 30, right: 10, left: -10, bottom: 50 }}
                >
                  <defs>
                    {data.map((d, i) => {
                      const c = colors[i % colors.length];
                      return (
                        <linearGradient
                          key={d.colorId}
                          id={`grad-${d.colorId}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={c} stopOpacity={1} />
                          <stop offset="55%" stopColor={c} stopOpacity={0.65} />
                          <stop offset="100%" stopColor={c} stopOpacity={0.1} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "hsl(var(--accent) / 0.06)" }}
                  />
                  <ReferenceLine
                    y={overallAvg}
                    stroke="hsl(var(--accent))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.55}
                    label={{
                      value: `Moyenne ${overallAvg}%`,
                      position: "insideTopRight",
                      fill: "hsl(var(--accent))",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="score"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={56}
                    animationDuration={1100}
                    animationBegin={0}
                    animationEasing="ease-out"
                  >
                    <LabelList
                      dataKey="score"
                      position="top"
                      formatter={(v: number) => `${v}%`}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        fill: "hsl(var(--foreground))",
                      }}
                    />
                    {enriched.map((d, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#grad-${d.colorId})`}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2.5}
                    dot={{
                      r: 4,
                      fill: "hsl(var(--accent))",
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6 }}
                    animationDuration={1400}
                    animationBegin={400}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4 pt-4 border-t border-border/50">
                {data.map((d, i) => (
                  <div key={d.colorId} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {d.fullName}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-accent rounded-full" />
                  <span className="text-xs text-muted-foreground">
                    Moyenne mobile
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Target className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">
                Complète des QCM pour voir ta progression par matière
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProgressChart;
