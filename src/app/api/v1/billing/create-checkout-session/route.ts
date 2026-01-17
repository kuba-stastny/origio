// src/app/api/v1/billing/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await req.json();
  if (!workspaceId) {
    return NextResponse.json(
      { error: "Missing workspaceId" },
      { status: 400 }
    );
  }

  const supabase = await supabaseServer();

  // ověř členství
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // zjisti stripe_customer_id, případně vytvoř
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  let stripeCustomerId = billingCustomer?.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        workspace_id: workspaceId,
        user_id: user.id,
      },
    });

    await supabase.from("billing_customers").insert({
      workspace_id: workspaceId,
      stripe_customer_id: customer.id,
    });

    stripeCustomerId = customer.id;
  }

  // V1: máme jen jeden price
  const priceId = process.env.STRIPE_PRICE_PRO;
  if (!priceId) {
    return NextResponse.json(
      { error: "Missing STRIPE_PRICE_PRO env" },
      { status: 500 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: stripeCustomerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/subscription?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/subscription?canceled=1`,
    metadata: {
      workspace_id: workspaceId,
    },
  });

  return NextResponse.json({ url: session.url });
}
