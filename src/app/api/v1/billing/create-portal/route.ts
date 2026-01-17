// src/app/api/v1/billing/create-portal/route.ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await req.json();
  if (!workspaceId)
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

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

  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!billingCustomer?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer for this workspace" },
      { status: 400 }
    );
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: billingCustomer.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/subscription`,
  });

  return NextResponse.json({ url: portal.url });
}
