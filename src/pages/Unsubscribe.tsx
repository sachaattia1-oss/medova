import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, AlertCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) {
          setState("invalid");
          return;
        }
        if (data.already_unsubscribed) {
          setEmail(data.email || "");
          setState("already");
        } else {
          setEmail(data.email || "");
          setState("valid");
        }
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setState(error ? "error" : "done");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          MED<span className="text-accent">OVA</span>
        </h1>

        {state === "loading" && (
          <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
        )}

        {state === "valid" && (
          <>
            <h2 className="text-lg font-semibold">Se désabonner</h2>
            <p className="text-muted-foreground text-sm">
              Confirmer la désinscription de {email} des emails MEDOVA ?
            </p>
            <Button onClick={confirm} className="w-full">Confirmer la désinscription</Button>
          </>
        )}

        {state === "submitting" && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}

        {state === "done" && (
          <>
            <Check className="w-12 h-12 mx-auto text-accent" />
            <h2 className="text-lg font-semibold">Désinscription confirmée</h2>
            <p className="text-muted-foreground text-sm">
              Vous ne recevrez plus d'emails de notre part à cette adresse.
            </p>
          </>
        )}

        {state === "already" && (
          <>
            <Check className="w-12 h-12 mx-auto text-accent" />
            <h2 className="text-lg font-semibold">Déjà désinscrit</h2>
            <p className="text-muted-foreground text-sm">{email} est déjà désabonné.</p>
          </>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">Lien invalide</h2>
            <p className="text-muted-foreground text-sm">
              Ce lien de désinscription est invalide ou a expiré.
            </p>
          </>
        )}
      </Card>
    </main>
  );
};

export default Unsubscribe;
