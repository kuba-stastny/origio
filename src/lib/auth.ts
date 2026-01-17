import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";

export async function getSession() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function getUser() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
