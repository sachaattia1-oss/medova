import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient + blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-background" />

      <div className="container relative z-10 px-4 md:px-6">
        <Reveal className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>Prêt à réussir ?</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Rejoins{" "}
            <span className="bg-[linear-gradient(110deg,hsl(var(--accent)),hsl(var(--accent-hover)),hsl(var(--primary)),hsl(var(--accent)))] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-shift">
              MEDOVA
            </span>{" "}
            aujourd'hui
          </h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
             Commence dès maintenant et maximise tes chances de succès.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="hero"
              className="group animate-pulse-glow"
              onClick={() => document.getElementById("tarifs")?.scrollIntoView({ behavior: "smooth" })}
            >
              Créer mon compte gratuit
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="backdrop-blur-sm"
              onClick={() => document.getElementById("tarifs")?.scrollIntoView({ behavior: "smooth" })}
            >
              Voir les offres
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            {" "}
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default CTA;
