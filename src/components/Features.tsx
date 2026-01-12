import { BookOpen, Brain, FileText, GraduationCap, Target, Users } from "lucide-react";
const features = [{
  icon: BookOpen,
  title: "Cours Structurés",
  description: "Des cours complets couvrant tout le programme médical, organisés par modules et niveaux."
}, {
  icon: FileText,
  title: "QCM Commentés",
  description: "Des questions à choix multiples avec corrections détaillées pour maîtriser le raisonnement clinique."
}, {
  icon: Brain,
  title: "QCM Interactifs",
  description: "Des milliers de questions pour tester tes connaissances avec explications approfondies."
}, {
  icon: Target,
  title: "Suivi de Progression",
  description: "Visualise ton avancement et identifie tes points forts et axes d'amélioration."
}, {
  icon: Users,
  title: "Communauté Active",
  description: "Rejoins une communauté d'étudiants motivés et partage tes expériences."
}, {
  icon: GraduationCap,
  title: "Préparation Concours",
  description: "Des ressources ciblées pour te préparer efficacement aux concours et examens."
}];
const Features = () => {
  return <section className="py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tout ce qu'il te faut pour <span className="text-gradient">réussir</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Une plateforme complète pensée par et pour les étudiants en médecine
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-accent/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>;
};
export default Features;