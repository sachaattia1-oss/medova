import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { ParticlesBackground } from "@/components/ParticlesBackground";
import { FloatingShapes } from "@/components/FloatingShapes";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background">
      <FloatingShapes />
      <ParticlesBackground count={35} />
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Features />
          <Pricing />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
