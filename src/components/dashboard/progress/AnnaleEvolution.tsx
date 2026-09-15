import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart as LineChartIcon, Target } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";

export interface EvolutionDatum {
  label: string;
  score: number;
  score20: number;
  title: string;
}

interface Props {
  data: EvolutionDatum[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as EvolutionDatum;
  return (
    <div className="bg-popover/85 backdrop-blur-md border border-border/60 rounded-xl p-3 shadow-xl">
      <p className="font-semibold text-sm mb-1">{d.title}</p>
      <p className="text-xs text-muted-foreground mb-1.5">{d.label}</p>
      <p className="text-lg font-bold text-accent tabular-nums">
        {d.score20.toFixed(1)}
        <span className="text-xs text-muted-foreground font-medium">/20</span>
        <span className="text-sm text-muted-foreground font-medium ml-2">
          {d.score}/100
        </span>
      </p>
    </div>
  );
};

const AnnaleEvolution = ({ data, loading }: Props) => {
  const avg =
    data.length > 0 ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50 shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shadow-[0_0_12px_hsl(var(--accent)/0.3)]">
              <LineChartIcon className="w-5 h-5 text-accent" />
            </div>
            <span>Évolution de tes notes</span>
            {data.length > 0 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full tabular-nums">
                Moyenne {avg}/100 · {(avg / 5).toFixed(1)}/20
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data} margin={{ top: 16, right: 12, left: -12, bottom: 8 }}>
                <defs>
                  <linearGradient id="annale-evolution" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.4}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={avg}
                  stroke="hsl(var(--accent))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2.5}
                  fill="url(#annale-evolution)"
                  dot={{
                    r: 3.5,
                    fill: "hsl(var(--accent))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 6 }}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
              <Target className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">Réalise des annales pour suivre ton évolution</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnnaleEvolution;
