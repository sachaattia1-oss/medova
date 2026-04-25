import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface Props {
  completed: number;
  averageScore: number;
}

const getBadge = (pct: number) => {
  if (pct >= 80) return { label: "Excellent", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" };
  if (pct >= 50) return { label: "En cours", className: "bg-orange-500/15 text-orange-600 border-orange-500/30" };
  return { label: "À améliorer", className: "bg-red-500/15 text-red-600 border-red-500/30" };
};

const GradientBar = ({ value }: { value: number }) => {
  const pct = Math.min(value, 100);
  return (
    <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-accent"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
};

const WeeklyGoal = ({ completed, averageScore }: Props) => {
  const qcmPct = Math.min((completed / 10) * 100, 100);
  const scorePct = Math.min((averageScore / 80) * 100, 100);
  const qcmBadge = getBadge(qcmPct);
  const scoreBadge = getBadge(scorePct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card rounded-2xl border border-border/50 p-6 mb-8 shadow-md"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          Objectif de la semaine
        </h3>
      </div>

      <div className="space-y-5">
        {/* QCM completed */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">QCM complétés</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${qcmBadge.className}`}>
                {qcmBadge.label}
              </span>
            </div>
            <span className="font-medium">{completed}/10 <span className="text-muted-foreground ml-1">({Math.round(qcmPct)}%)</span></span>
          </div>
          <GradientBar value={qcmPct} />
        </div>

        {/* Score */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Score cible (80%)</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${scoreBadge.className}`}>
                {scoreBadge.label}
              </span>
            </div>
            <span className="font-medium">{averageScore}% <span className="text-muted-foreground ml-1">({Math.round(scorePct)}%)</span></span>
          </div>
          <GradientBar value={scorePct} />
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklyGoal;
