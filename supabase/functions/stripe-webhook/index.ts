import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PRODUCT_PLANS: Record<string, { type: string; durationMonths: number }> = {
  "prod_UEuo9hTuMJjeQA": { type: "terminale", durationMonths: 12 },
  "prod_UEupGWXiojjgGP": { type: "premier_semestre", durationMonths: 6 },
  "prod_UEuqHOh5ZvQ9Km": { type: "annuel", durationMonths: 12 },
};

const log = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const body = await req.text();

    let event: Stripe.Event;
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      // Fallback (no signature verification) — should only happen if secret not yet configured
      event = JSON.parse(body) as Stripe.Event;
      log("WARNING: webhook secret not configured, signature not verified");
    }

    log("Event received", { type: event.type, id: event.id });

    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true, ignored: event.type }), { status: 200 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") {
      log("Session not paid, ignoring", { id: session.id });
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Retrieve full session with line items
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price.product", "customer"],
    });

    const email =
      fullSession.customer_details?.email ||
      fullSession.customer_email ||
      (typeof fullSession.customer === "object" && fullSession.customer
        ? (fullSession.customer as Stripe.Customer).email
        : null);

    if (!email) {
      log("No email found on session", { id: session.id });
      return new Response(JSON.stringify({ error: "no email" }), { status: 200 });
    }

    const lineItem = fullSession.line_items?.data[0];
    const price = lineItem?.price;
    const productId =
      typeof price?.product === "string" ? price.product : (price?.product as any)?.id;
    const plan = productId ? PRODUCT_PLANS[productId] : null;
    const subscriptionType = plan?.type || "annuel";
    const durationMonths = plan?.durationMonths || 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find user by email via auth admin
    const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw new Error(`listUsers failed: ${listErr.message}`);

    const user = usersList.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      log("No matching user for email", { email });
      return new Response(JSON.stringify({ received: true, no_user: true }), { status: 200 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_subscribed: true,
        subscription_type: subscriptionType,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) throw new Error(`update profile failed: ${updateError.message}`);

    log("Subscription activated via webhook", { userId: user.id, subscriptionType });

    return new Response(JSON.stringify({ received: true, activated: true }), { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }
});
