import { Archive, CalendarRange, CheckCircle2, MessagesSquare, Target, Layers } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { TiltCard } from "@/components/TiltCard";

const features = [
  { icon: Archive, title: "Toutes les annales", description: "L'ensemble des annales du concours de PASS Marseille, réunies en un seul endroit." },
  { icon: CheckCircle2, title: "Corrections certifiées", description: "Chaque question corrigée et justifiée en détail, proposition par proposition." },
  { icon: CalendarRange, title: "Triées par année", description: "Retrouve les annales année par année et entraîne-toi comme le jour du concours." },
  { icon: Layers, title: "Triées par cours", description: "Travaille une matière ou un cours précis avec les annales qui s'y rapportent." },
  { icon: MessagesSquare, title: "Explications avec les tuteurs", description: "Pose tes questions sous chaque annale : les tuteurs te répondent directement." },
  { icon: Target, title: "Suivi de Progression", description: "Visualise ton score moyen sur 20 et identifie les cours à retravailler." },
];


const Features = () => {
  return (
    <section className="relative py-24 bg-muted/30 overflow-hidden">

      <div className="container relative z-10 px-4 md:px-6">
        <Reveal className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tout ce qu'il te faut pour <span className="text-gradient">réussir</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Une plateforme complète pensée par et pour les étudiants en médecine
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 100}>
              <TiltCard maxTilt={6} lift={8}>
                <div className="group icon-hover-bounce relative h-full p-6 rounded-2xl bg-card border border-border/50 rotating-border overflow-hidden shadow-card transition-shadow duration-300 hover:shadow-card-hover">
                  {/* Subtle radial glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />

                  <div className="relative w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 relative">{feature.title}</h3>
                  <p className="text-muted-foreground relative">{feature.description}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
