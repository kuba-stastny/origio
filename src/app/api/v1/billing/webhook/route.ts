// @ts-nocheck


// src/app/api/v1/billing/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = await supabaseServer();

  // 1) uložíme webhook event (best effort)
  try {
    await supabase.from("billing_webhook_events").insert({
      id: event.id,
      type: event.type,
      payload: event.data.object as any,
    });
  } catch (e) {
    console.error("Failed to insert webhook event:", e);
  }

  // 2) vlastní logika
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        // základní subscription z eventu
        let subs = event.data.object as Stripe.Subscription;
        const customerId = subs.customer as string;

        // najdi workspace podle customer
        const { data: bc, error: bcErr } = await supabase
          .from("billing_customers")
          .select("workspace_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (bcErr) {
          console.error("billing_customers lookup error:", bcErr.message);
          break;
        }
        if (!bc?.workspace_id) {
          console.warn("No workspace for customer:", customerId);
          break;
        }

        // ⚠️ portal často neposílá current_period_* → fallback: stáhneme plnou sub
        const needsFetch =
          typeof subs.current_period_start !== "number" ||
          typeof subs.current_period_end !== "number";

        if (needsFetch) {
          try {
            const full = await stripe.subscriptions.retrieve(subs.id);
            subs = full; // přepíšeme subs plnou verzí
          } catch (fetchErr: any) {
            console.error(
              "Failed to fetch full subscription from Stripe:",
              fetchErr.message
            );
          }
        }

        const firstItem = subs.items?.data?.[0];
        const priceId = firstItem?.price?.id ?? "unknown";

        const payload: any = {
          id: subs.id,
          workspace_id: bc.workspace_id,
          stripe_price_id: priceId,
          status: subs.status,
          cancel_at_period_end: subs.cancel_at_period_end ?? false,
          canceled_at: subs.canceled_at
            ? new Date(subs.canceled_at * 1000).toISOString()
            : null,
        };

        // teď už by to tam mělo být – buď z eventu nebo z retrieve
        if (typeof subs.current_period_start === "number") {
          payload.current_period_start = new Date(
            subs.current_period_start * 1000
          ).toISOString();
        }
        if (typeof subs.current_period_end === "number") {
          payload.current_period_end = new Date(
            subs.current_period_end * 1000
          ).toISOString();
        }

        await supabase.from("billing_subscriptions").upsert(payload);
        break;
      }

      case "customer.subscription.deleted": {
        const subs = event.data.object as Stripe.Subscription;
        const customerId = subs.customer as string;

        const { data: bc } = await supabase
          .from("billing_customers")
          .select("workspace_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (bc?.workspace_id) {
          const firstItem = subs.items?.data?.[0];
          const priceId = firstItem?.price?.id ?? "unknown";

          await supabase.from("billing_subscriptions").upsert({
            id: subs.id,
            workspace_id: bc.workspace_id,
            stripe_price_id: priceId,
            status: "canceled",
            cancel_at_period_end: false,
            canceled_at: new Date().toISOString(),
          });
        }
        break;
      }

      default:
        // ostatní zatím neřešíme
        break;
    }
  } catch (err: any) {
    console.error("Webhook handler error:", err.message);
    // odpověď dáme stejně 200
  }

  return NextResponse.json({ received: true });
}
