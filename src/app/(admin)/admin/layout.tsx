// app/(admin)/admin/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DotGridBackground from "@/components/DotGridBackground";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Musí být přihlášený uživatel
  const user = await requireUser();

  // Admin guard přes e-mail (bez profiles tabulky)
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn(
      "ADMIN_EMAIL není nastavený v .env – admin sekce bude přístupná všem přihlášeným uživatelům!"
    );
  } else if (user.email !== adminEmail) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50 flex">
            <DotGridBackground />

      {/* Levý admin sidebar – dark mode */}
      <AdminSidebar />


      {/* Hlavní obsah */}
      <main className="flex-1 min-h-dvh">
        <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
