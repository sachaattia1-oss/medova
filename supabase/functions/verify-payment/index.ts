import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_PLANS: Record<string, { type: string; durationMonths: number }> = {
  "prod_UEuo9hTuMJjeQA": { type: "terminale", durationMonths: 12 },
  "prod_UEupGWXiojjgGP": { type: "premier_semestre", durationMonths: 6 },
  "prod_UEuqHOh5ZvQ9Km": { type: "annuel", durationMonths: 12 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, message: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get product info
    const lineItem = session.line_items?.data[0];
    const price = lineItem?.price;
    const productId = typeof price?.product === "string" ? price.product : (price?.product as any)?.id;
    const plan = productId ? PRODUCT_PLANS[productId] : null;

    const subscriptionType = plan?.type || "unknown";
    const durationMonths = plan?.durationMonths || 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // Update user profile
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        is_subscribed: true,
        subscription_type: subscriptionType,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", userData.user.id);

    if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`);

    return new Response(JSON.stringify({ 
      success: true, 
      subscription_type: subscriptionType,
      expires_at: expiresAt.toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error verifying payment:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
