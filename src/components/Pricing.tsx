import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    name: "Terminale",
    description: "Prépare ta PASS dès le lycée",
    price: "149",
    period: "",
    features: [
      "Accès aux cours du premier semestre",
      "Accès aux QCM corrigés et détaillés",
      "Suivi de progression",
    ],
    cta: "S'abonner",
    popular: false,
  },
  {
    name: "Premier semestre",
    description: "Tout pour réussir ton S1",
    price: "279",
    period: "",
    features: [
      "Accès à tous les cours mis à jour",
      "QCM illimités",
      "Annales corrigées et détaillées",
      "Suivi de progression précis",
    ],
    cta: "S'abonner",
    popular: false,
  },
  {
    name: "Annuel (S1 et S2)",
    description: "Le meilleur rapport qualité-prix",
    price: "500",
    period: "/an",
    originalPrice: "558",
    features: [
      "Économise 10%",
      "Accès aux cours de S1 et S2 mis à jour",
      "QCM illimités",
      "Annales corrigées et détaillées",
      "Suivi de progression précis",
    ],
    cta: "Économiser maintenant",
    popular: true,
  },
];

const Pricing = () => {
  return (
    <section id="tarifs" className="py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Tarifs transparents</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choisis ton <span className="text-gradient">plan</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Des formules adaptées à ton parcours, sans engagement caché
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-b from-accent/10 to-card border-accent/50 shadow-glow"
                  : "bg-card border-border/50 hover:border-accent/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                    <Zap className="w-3 h-3" />
                    Plus populaire
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}€</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "hero" : "outline"}
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
