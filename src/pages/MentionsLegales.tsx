import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MentionsLegales = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 md:px-6 pt-32 pb-20 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Mentions légales</h1>
        <p className="text-muted-foreground mb-10">Site : medova-med.fr</p>

        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-foreground/90">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Éditeur du site</h2>
            <p>
              Conformément à l'article 6 de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie
              numérique (LCEN), les informations relatives à l'éditeur de ce site sont les suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li><strong>Statut</strong> : Auto-entrepreneur / Micro-entreprise</li>
              <li><strong>SIRET</strong> : 104 377 148</li>
              <li><strong>TVA intracommunautaire</strong> : Non assujetti à la TVA (article 293 B du CGI)</li>
              <li><strong>Site web</strong> : https://medova-med.fr</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Directeur de la publication</h2>
            <p>Le directeur de la publication du site medova-med.fr est [Votre Nom].</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Hébergeur du site</h2>
            <p>Le site medova-med.fr est hébergé par :</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li><strong>Société</strong> : IONOS SE</li>
              <li><strong>Adresse</strong> : 7, Place de la Gare - BP 70109, 57200 Sarreguemines, France</li>
              <li><strong>Site web</strong> : https://www.ionos.fr</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, cours, annales, QCM, images, logos, etc.) est la propriété
              exclusive, sauf mention contraire.
            </p>
            <p className="mt-3">
              Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même
              partielle, de ces différents éléments est strictement interdite sans l'accord.
            </p>
            <p className="mt-3">
              Cette représentation ou reproduction, par quelque procédé que ce soit, constitue une contrefaçon
              sanctionnée par les articles L.335-2 et suivants du Code de la Propriété Intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Vente de contenus numériques</h2>
            <p>
              Le site propose à la vente des contenus numériques (cours, annales, QCM). En tant que contenus
              dématérialisés, ces produits ne sont pas soumis au droit de rétractation de 14 jours dès lors que
              leur téléchargement ou accès a débuté avec votre accord préalable, conformément à l'article L.221-28
              du Code de la consommation.
            </p>
            <p className="mt-3">
              Les prix indiqués sur le site sont en euros, toutes taxes comprises (le vendeur n'est pas assujetti
              à la TVA).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Données personnelles et cookies</h2>
            <p>
              Ce site est susceptible de collecter des données à caractère personnel lors de vos achats (nom,
              prénom, adresse e-mail, adresse de livraison). Ces données sont utilisées uniquement dans le cadre
              du traitement de votre commande.
            </p>
            <p className="mt-3">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et
              Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux
              données vous concernant.
            </p>
            <p className="mt-3">
              Pour exercer ces droits, vous pouvez contacter le responsable du traitement à l'adresse postale
              indiquée à l'article 1.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Limitation de responsabilité</h2>
            <p>
              [Votre Nom] s'efforce d'assurer au mieux de ses possibilités l'exactitude et la mise à jour des
              informations diffusées sur ce site. Cependant, ne peut garantir l'exactitude, la précision ou
              l'exhaustivité des informations mises à disposition sur ce site.
            </p>
            <p className="mt-3">
              En conséquence, décline toute responsabilité pour tout préjudice résultant d'une information
              inexacte ou incomplète.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Droit applicable et juridiction compétente</h2>
            <p>
              Les présentes mentions légales sont soumises au droit français. En cas de litige, et après tentative
              de résolution amiable, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <p className="text-sm text-muted-foreground pt-6 border-t border-border/50">
            Dernière mise à jour : 04/05/2026
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default MentionsLegales;
