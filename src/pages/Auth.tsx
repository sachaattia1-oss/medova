import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Sparkles, GraduationCap, Users, BookOpen } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().trim().email("Adresse email invalide").max(255),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email("Adresse email invalide").max(255),
  password: z.string().min(1, "Mot de passe requis").max(72),
});

type SignUpChoice = "user" | "terminale" | "tutor";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<SignUpChoice>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn, deviceBlocked } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const validation = signUpSchema.safeParse({ fullName, email, password });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const role = selectedChoice === "tutor" ? "tutor" : "user";
        const studentType = selectedChoice === "terminale" ? "terminale" : selectedChoice === "user" ? "pass" : null;
        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          toast.error(error.message);
        } else {
          // Store student type in profile
          if (studentType) {
            const { data: { user: newUser } } = await supabase.auth.getUser();
            if (newUser) {
              await supabase.from("profiles").update({ student_type: studentType }).eq("user_id", newUser.id);
            }
          }
          if (selectedChoice === "tutor") {
            toast.success("Compte tuteur créé ! Votre demande est en attente de validation par un administrateur.");
          } else {
            toast.success("Compte créé avec succès ! Bienvenue sur MEDOVA.");
          }
          navigate(selectedChoice === "tutor" ? "/tutor" : "/dashboard");
        }
      } else {
        const validation = signInSchema.safeParse({ email, password });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast.error("Email ou mot de passe incorrect");
        } else {
          // Small delay to let device check run
          await new Promise(r => setTimeout(r, 1500));
          toast.success("Connexion réussie !");
          navigate("/dashboard");
        }
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setSelectedChoice("user");
  };

  if (deviceBlocked) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Limite d'appareils atteinte</h1>
          <p className="text-muted-foreground">
            Votre compte est déjà connecté sur 2 appareils. Déconnectez-vous d'un autre appareil pour pouvoir vous connecter ici.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Plateforme médicale</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isSignUp ? "Créer un compte" : "Connexion"}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp
                ? "Rejoins la communauté MEDOVA"
                : "Bon retour parmi nous !"}
            </p>
          </div>

          {/* Auth Form */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection - only for signup */}
              {isSignUp && (
                <div className="space-y-3">
                  <Label>Je suis...</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedChoice("terminale")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        selectedChoice === "terminale"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border hover:border-accent/50 hover:bg-muted/50"
                      )}
                    >
                      <BookOpen className="w-8 h-8" />
                      <div className="text-center">
                        <div className="font-medium text-sm">Terminale</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Préparer la PASS
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedChoice("user")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        selectedChoice === "user"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border hover:border-accent/50 hover:bg-muted/50"
                      )}
                    >
                      <GraduationCap className="w-8 h-8" />
                      <div className="text-center">
                        <div className="font-medium text-sm">Étudiant PASS</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Accès aux cours et QCM
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedChoice("tutor")}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        selectedChoice === "tutor"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border hover:border-accent/50 hover:bg-muted/50"
                      )}
                    >
                      <Users className="w-8 h-8" />
                      <div className="text-center">
                        <div className="font-medium text-sm">Tuteur</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Accompagner les étudiants
                        </div>
                      </div>
                    </button>
                  </div>
                  {selectedChoice === "tutor" && (
                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-2 rounded-lg">
                      ⚠️ Les comptes tuteurs nécessitent une validation par un administrateur avant d'être activés.
                    </p>
                  )}
                </div>
              )}

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Jean Dupont"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {isSignUp && (
                  <p className="text-xs text-muted-foreground">
                    Au moins 6 caractères
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? "Chargement..."
                  : isSignUp
                  ? selectedChoice === "tutor"
                    ? "Demander un compte tuteur"
                    : "Créer mon compte"
                  : "Se connecter"}
              </Button>
            </form>

            {/* Toggle auth mode */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    resetForm();
                  }}
                  className="ml-1 text-accent hover:underline font-medium"
                >
                  {isSignUp ? "Se connecter" : "Créer un compte"}
                </button>
              </p>
            </div>
          </div>

          {/* Features list for signup */}
          {isSignUp && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                {selectedChoice === "tutor" 
                  ? "En tant que tuteur, tu pourras :"
                  : "En créant un compte, tu accèdes à :"}
              </p>
              <ul className="space-y-2 text-sm">
                {selectedChoice === "tutor" ? (
                  <>
                    {[
                      "Suivre la progression des étudiants",
                      "Créer et gérer des cours et QCM",
                      "Échanger avec les étudiants via la messagerie",
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {feature}
                      </li>
                    ))}
                  </>
                ) : (
                  <>
                    {(selectedChoice === "terminale" ? [
                      "Anticipe ton année PASS",
                      "QCM interactifs pour t'entraîner",
                      "Suivi de progression personnalisé",
                    ] : [
                      "500+ QCM commentés",
                      "QCM interactifs illimités",
                      "Suivi de progression personnalisé",
                    ]).map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {feature}
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Auth;
