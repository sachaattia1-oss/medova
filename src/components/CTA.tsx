import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Prêt à réussir ?</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Rejoins <span className="text-gradient">MEDOVA</span> aujourd'hui
          </h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Plus de 10 000 étudiants nous font déjà confiance. Commence dès maintenant et maximise tes chances de succès.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" className="group">
              Créer mon compte gratuit
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline">
              Voir une démo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Essai gratuit de 7 jours • Aucune carte bancaire requise
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
