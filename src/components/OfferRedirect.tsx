import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export const OFFER_FLAG = "medova_go_offer";

/**
 * After a new student confirms their email (or signs in with Google),
 * send them straight to the offer so they can pay.
 */
const OfferRedirect = () => {
  const { user, loading } = useAuth();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("offre") === "1") localStorage.setItem(OFFER_FLAG, "1");
  }, [location.search]);

  useEffect(() => {
    if (loading || subLoading || !user) return;
    if (localStorage.getItem(OFFER_FLAG) !== "1") return;
    localStorage.removeItem(OFFER_FLAG);
    if (isSubscribed) return;
    navigate("/#tarifs", { replace: true });
    setTimeout(() => document.getElementById("tarifs")?.scrollIntoView({ behavior: "smooth" }), 400);
  }, [user, loading, subLoading, isSubscribed, navigate]);

  return null;
};

export default OfferRedirect;
