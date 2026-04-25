import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Target } from "lucide-react";
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
} from "recharts";
import { motion } from "framer-motion";

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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm">{data.fullName}</p>
        <p className="text-sm text-muted-foreground">
          Score moyen : <span className="font-bold text-foreground">{data.score}%</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {data.qcm} QCM complété{data.qcm > 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return null;
};

const ProgressChart = ({ data, loading, colors }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="mb-8 bg-gradient-to-br from-card to-muted/30 border-border/50 shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            Résultats des QCM par UE
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
                <BarChart data={data} margin={{ top: 30, right: 10, left: -10, bottom: 50 }}>
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
                          <stop offset="100%" stopColor={c} stopOpacity={0.55} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
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
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent) / 0.06)" }} />
                  <Bar
                    dataKey="score"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={56}
                    animationDuration={1100}
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
                    {data.map((d, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#grad-${d.colorId})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4 pt-4 border-t border-border/50">
                {data.map((d, i) => (
                  <div key={d.colorId} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="text-xs text-muted-foreground">{d.fullName}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Target className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">Complète des QCM pour voir ta progression par matière</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProgressChart;
