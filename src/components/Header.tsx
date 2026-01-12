import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              GO<span className="text-accent">PASS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#cours" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cours
            </a>
            <a href="#qcm" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              QCM
            </a>
            <a href="#tarifs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/dashboard">Mon espace</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Se connecter</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth">S'inscrire</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-4">
              <a href="#cours" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Cours
              </a>
              <a href="#qcm" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                QCM
              </a>
              <a href="#tarifs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Tarifs
              </a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <Button variant="hero" size="sm" asChild>
                      <Link to="/dashboard">Mon espace</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => signOut()}>
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <Link to="/auth">Se connecter</Link>
                    </Button>
                    <Button variant="hero" size="sm" asChild>
                      <Link to="/auth">S'inscrire</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
