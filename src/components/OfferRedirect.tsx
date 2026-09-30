import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";

export const OFFER_FLAG = "medova_go_offer";
const PRICE_ID = "price_1UFxuKFUlmGFMx8wUciwnrRR";

/**
 * After a new student confirms their email (or signs in with Google),
 * send them straight to the Stripe checkout page so they can pay.
 * If the checkout session can't be created, fall back to the offer section.
 */
const OfferRedirect = () => {
  const { user, loading } = useAuth();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const { isAdmin, isTutor } = useUserRole();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);
  const triedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("offre") === "1") localStorage.setItem(OFFER_FLAG, "1");
  }, [location.search]);

  useEffect(() => {
    if (loading || subLoading || !user) return;
    if (isAdmin || isTutor || isSubscribed) return;
    if (localStorage.getItem(OFFER_FLAG) !== "1") return;
    if (triedRef.current || redirecting) return;
    triedRef.current = true;

    localStorage.removeItem(OFFER_FLAG);
    setRedirecting(true);

    supabase.functions
      .invoke("create-checkout", { body: { priceId: PRICE_ID } })
      .then(({ data, error }) => {
        if (!error && data?.url) {
          window.location.href = data.url;
        } else {
          window.location.href = "/#tarifs";
        }
      })
      .catch(() => {
        window.location.href = "/#tarifs";
      });
  }, [user, loading, subLoading, isSubscribed, isAdmin, isTutor, redirecting]);

  return null;
};

export default OfferRedirect;
