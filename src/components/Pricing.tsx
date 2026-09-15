import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Accès Annales",
    description: "Toutes les annales de PASS Marseille",
    price: "45",
    period: "",
    expiresAt: "15 décembre 2026",
    priceId: "price_1UFxuKFUlmGFMx8wUciwnrRR",
    features: [
      "Accès à l'ensemble des annales du concours",
      "Corrections certifiées et détaillées",
      "Annales triées par année et par cours",
      "Explications avec les tuteurs",
      "Suivi de progression",
    ],
    cta: "S'abonner",
    popular: true,
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, _planName: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour souscrire à un plan.",
        variant: "destructive",
      });
      window.location.href = "/auth?mode=signup";
      return;
    }

    setLoadingPlan(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="tarifs" className="relative py-24 overflow-hidden">

      <div className="container relative z-10 px-4 md:px-6">
        <Reveal className="text-center max-w-3xl mx-auto mb-16">
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
        </Reveal>

        <div className="grid gap-6 max-w-md mx-auto">
          {plans.map((plan, idx) => (
            <Reveal key={plan.name} delay={idx * 120}>
              <div
                className={cn(
                  "tilt-card relative h-full p-6 rounded-2xl border transition-colors duration-300",
                  plan.popular
                    ? "popular-rotating-border bg-gradient-to-b from-accent/15 to-card border-transparent animate-glow-ring md:scale-[1.05]"
                    : "bg-card border-border/50 hover:border-accent/30 lift-hover"
                )}
              >
                {plan.popular && (
                  <>
                    {/* Shimmer overlay */}
                    <span className="shimmer-overlay absolute inset-0 rounded-2xl overflow-hidden" />
                  </>
                )}

                <div className="relative mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="relative mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.expiresAt && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-accent font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Accès jusqu'au {plan.expiresAt}</span>
                    </div>
                  )}
                </div>

                <ul className="relative space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="relative">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "hero" : "outline"}
                    size="lg"
                    disabled={loadingPlan === plan.priceId}
                    onClick={() => handleCheckout(plan.priceId, plan.name)}
                  >
                    {loadingPlan === plan.priceId ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
