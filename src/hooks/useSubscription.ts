import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SubscriptionData {
  isSubscribed: boolean;
  subscriptionType: string | null;
  expiresAt: string | null;
  loading: boolean;
}

export const useSubscription = (): SubscriptionData => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setIsSubscribed(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_subscribed, subscription_type, subscription_expires_at")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          const now = new Date();
          const expired = data.subscription_expires_at
            ? new Date(data.subscription_expires_at) < now
            : false;

          setIsSubscribed(data.is_subscribed === true && !expired);
          setSubscriptionType(data.subscription_type);
          setExpiresAt(data.subscription_expires_at);
        }
      } catch (err) {
        console.error("Error fetching subscription:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  return { isSubscribed, subscriptionType, expiresAt, loading };
};
