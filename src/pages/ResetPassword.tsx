import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session || window.location.hash.includes("type=recovery")) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Au moins 6 caractères");
    if (password !== confirm) return toast.error("Les mots de passe ne correspondent pas");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error("Lien expiré ou invalide. Redemande un email.");
    toast.success("Mot de passe modifié !");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground">Nouveau mot de passe</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground">Vérification du lien…</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="pw">Nouveau mot de passe</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <p className="text-xs text-muted-foreground">Au moins 6 caractères</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirmer</Label>
              <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        )}
      </form>
    </div>
  );
};

export default ResetPassword;
