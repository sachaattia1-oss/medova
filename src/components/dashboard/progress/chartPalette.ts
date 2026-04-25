/**
 * Unified dashboard gradient palette.
 * Each entry defines a triple-stop gradient (accent → mid → transparent)
 * shared across StatsCard sparklines, ProgressChart bars and tooltip bars.
 *
 * Colors are HSL strings so they can be composed into linear/radial gradients.
 */

export interface ChartPaletteStop {
  /** Vivid accent color, used at 0% */
  accent: string;
  /** Mid tone, used around 55% */
  mid: string;
  /** Soft tail, used near 100% (rendered with low opacity) */
  tail: string;
}

export const CHART_PALETTE: ChartPaletteStop[] = [
  // Teal (brand accent)
  { accent: "hsl(172 70% 45%)", mid: "hsl(172 60% 55%)", tail: "hsl(172 50% 70%)" },
  // Emerald
  { accent: "hsl(160 70% 42%)", mid: "hsl(160 60% 52%)", tail: "hsl(160 50% 68%)" },
  // Sky
  { accent: "hsl(200 80% 50%)", mid: "hsl(200 70% 60%)", tail: "hsl(200 60% 75%)" },
  // Indigo
  { accent: "hsl(245 70% 60%)", mid: "hsl(245 60% 68%)", tail: "hsl(245 50% 80%)" },
  // Violet
  { accent: "hsl(270 65% 60%)", mid: "hsl(270 55% 68%)", tail: "hsl(270 45% 80%)" },
  // Rose
  { accent: "hsl(340 75% 58%)", mid: "hsl(340 65% 66%)", tail: "hsl(340 55% 78%)" },
  // Amber
  { accent: "hsl(38 92% 55%)", mid: "hsl(38 85% 62%)", tail: "hsl(38 75% 75%)" },
  // Cyan
  { accent: "hsl(190 75% 48%)", mid: "hsl(190 65% 58%)", tail: "hsl(190 55% 72%)" },
];

/** Convenience: just the accent colors, in palette order. */
export const CHART_ACCENT_COLORS = CHART_PALETTE.map((p) => p.accent);

/** Pick a palette stop by index (wraps around). */
export const getPaletteStop = (i: number): ChartPaletteStop =>
  CHART_PALETTE[i % CHART_PALETTE.length];

/**
 * Score-based palette stop, used by tooltip and rank bars across the dashboard.
 * Keeps semantic meaning (red/orange/green) consistent everywhere.
 */
export const getScorePaletteStop = (score: number): ChartPaletteStop => {
  if (score >= 80) return CHART_PALETTE[1]; // emerald
  if (score >= 50) return CHART_PALETTE[6]; // amber
  return { accent: "hsl(0 70% 55%)", mid: "hsl(0 65% 62%)", tail: "hsl(0 55% 75%)" };
};
