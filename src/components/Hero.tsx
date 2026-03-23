import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Stethoscope } from "lucide-react";
const Hero = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-accent/5 to-transparent rounded-full" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8 animate-fade-in">
            <Stethoscope className="w-4 h-4" />
            <span>Plateforme #1 pour les étudiants en médecine</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
            <span className="text-foreground">Réussis ton </span>
            <span className="text-gradient">concours</span>
            <br />
            <span className="text-foreground">avec </span>
            <span className="text-gradient">MEDOVA</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-in-up animation-delay-200">Accède à des cours complets, des QCM détaillés et des ressources pédagogiques conçues par des professionnels pour maximiser tes chances de succès.</p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
            <a href="#tarifs">
              <Button size="lg" variant="hero" className="group">
                Commencer maintenant
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-border/50 hover:bg-muted/50">
              <BookOpen className="mr-2 w-4 h-4" />
              Voir les cours
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-border/30 animate-fade-in-up animation-delay-600">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">250+</div>
              <div className="text-sm text-muted-foreground mt-1">Cours disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">1000+</div>
              <div className="text-sm text-muted-foreground mt-1">QCM corrigés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">95%</div>
              <div className="text-sm text-muted-foreground mt-1">Taux de réussite</div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;