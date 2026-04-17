import { BookOpen, Brain, FileText, GraduationCap, Target, Users } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const features = [
  { icon: BookOpen, title: "Cours Structurés", description: "Des cours complets couvrant tout le programme médical, organisés par modules et niveaux." },
  { icon: FileText, title: "QCM Commentés", description: "Des questions à choix multiples avec corrections détaillées pour maîtriser le raisonnement clinique." },
  { icon: Brain, title: "QCM Interactifs", description: "Des milliers de questions pour tester tes connaissances avec explications approfondies." },
  { icon: Target, title: "Suivi de Progression", description: "Visualise ton avancement et identifie tes points forts et axes d'amélioration." },
  { icon: Users, title: "Communauté Active", description: "Rejoins une communauté d'étudiants motivés et partage tes expériences." },
  { icon: GraduationCap, title: "Préparation Concours", description: "Des ressources ciblées pour te préparer efficacement aux concours et examens." },
];

const Features = () => {
  return (
    <section className="relative py-24 bg-muted/30 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
      </div>

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
              <div className="group icon-hover-bounce relative h-full p-6 rounded-2xl bg-card border border-border/50 lift-hover gradient-border overflow-hidden">
                {/* Subtle radial glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />

                <div className="relative w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2 relative">{feature.title}</h3>
                <p className="text-muted-foreground relative">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
