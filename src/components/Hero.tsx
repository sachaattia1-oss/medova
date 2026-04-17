import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Stethoscope, GraduationCap, FileQuestion, Trophy } from "lucide-react";
import { useMemo } from "react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Reveal } from "@/components/Reveal";

const Hero = () => {
  // Generate floating particles
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => {
        const size = 4 + Math.random() * 10;
        return {
          left: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          duration: `${10 + Math.random() * 14}s`,
          delay: `${Math.random() * 8}s`,
          opacity: 0.2 + Math.random() * 0.4,
          key: i,
        };
      }),
    []
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-accent/5">
      {/* Animated background blobs */}
      {/* Soft radial backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-accent/5 to-transparent rounded-full" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <span
            key={p.key}
            className="particle"
            style={{
              left: p.left,
              width: p.width,
              height: p.height,
              opacity: p.opacity,
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8 animate-fade-in animate-pulse-soft backdrop-blur-sm">
            <Stethoscope className="w-4 h-4" />
            <span>Plateforme #1 pour les étudiants en médecine</span>
          </div>

          {/* Main heading with typewriter effect on "concours" */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
            <span className="text-foreground">Réussis ton </span>
            <span className="text-gradient">concours</span>
            <br />
            <span className="text-foreground">avec </span>
            <span className="bg-[linear-gradient(110deg,hsl(var(--accent)),hsl(var(--accent-hover)),hsl(var(--primary)),hsl(var(--accent)))] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-shift drop-shadow-sm">
              MEDOVA
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-in-up animation-delay-200">
            Accède à des cours complets, des QCM détaillés et des ressources pédagogiques conçues par des professionnels pour maximiser tes chances de succès.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
            <a href="#tarifs">
              <Button size="lg" variant="hero" className="group animate-pulse-glow">
                Commencer maintenant
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <a href="#tarifs">
              <Button size="lg" variant="outline" className="border-border/50 hover:bg-muted/50 backdrop-blur-sm">
                <BookOpen className="mr-2 w-4 h-4" />
                Voir les cours
              </Button>
            </a>
          </div>

          {/* Stats with animated counters + staggered reveal */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-16 pt-16 border-t border-border/30 w-full">
            {[
              { icon: GraduationCap, value: 250, suffix: "+", label: "Cours disponibles" },
              { icon: FileQuestion, value: 1000, suffix: "+", label: "QCM corrigés" },
              { icon: Trophy, value: 95, suffix: "%", label: "Taux de réussite" },
            ].map((stat, idx) => (
              <Reveal key={stat.label} delay={idx * 150}>
                <div className="group icon-hover-bounce h-full flex flex-col items-center text-center p-4 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm lift-hover gradient-border">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 transition-all group-hover:bg-accent/20 group-hover:scale-110">
                    <stat.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gradient">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
