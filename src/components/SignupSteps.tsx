import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Création du compte", "Paiement", "Accès complet"];

/** current: 1, 2 or 3. Steps before `current` are done; 4 = all done. */
const SignupSteps = ({ current, className }: { current: number; className?: string }) => (
  <div className={cn("w-full max-w-xl mx-auto", className)}>
    <ol className="flex items-start">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <span
                className={cn(
                  "absolute top-4 right-1/2 w-full h-0.5 -z-0",
                  n <= current ? "bg-accent" : "bg-border"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                done && "bg-accent border-accent text-accent-foreground",
                active && "bg-background border-accent text-accent",
                !done && !active && "bg-background border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="w-4 h-4" /> : n}
            </span>
            <span
              className={cn(
                "mt-2 text-xs sm:text-sm text-center font-medium",
                done || active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Étape {n}</span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  </div>
);

export default SignupSteps;
