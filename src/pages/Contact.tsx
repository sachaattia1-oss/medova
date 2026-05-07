import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, AlertCircle } from "lucide-react";

const Contact = () => {
  useEffect(() => {
    document.title = "Contact | MEDOVA";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 md:px-6 pt-32 pb-20 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Contact</h1>
        <p className="text-muted-foreground mb-10">Besoin d'aide ? Nous sommes là pour vous.</p>

        <div className="space-y-8 text-foreground/90">
          <section className="bg-muted/30 rounded-2xl p-6 border border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Problème avec le site ?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Si vous rencontrez un problème technique avec la plateforme MEDOVA, n'hésitez pas à nous contacter à l'adresse suivante :
                </p>
                <a
                  href="mailto:medova.pass@gmail.com"
                  className="inline-flex items-center gap-2 mt-3 text-accent hover:underline font-medium"
                >
                  <Mail className="w-4 h-4" />
                  medova.pass@gmail.com
                </a>
              </div>
            </div>
          </section>

          <section className="bg-muted/30 rounded-2xl p-6 border border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Contact général</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute autre question concernant nos cours, nos forfaits ou nos services, vous pouvez également nous écrire à :
                </p>
                <a
                  href="mailto:medova.pass@gmail.com"
                  className="inline-flex items-center gap-2 mt-3 text-primary hover:underline font-medium"
                >
                  <Mail className="w-4 h-4" />
                  medova.pass@gmail.com
                </a>
              </div>
            </div>
          </section>

          <p className="text-sm text-muted-foreground pt-4 border-t border-border/50">
            Nous vous répondrons dans les plus brefs délais, généralement sous 24 à 48 heures ouvrées.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
