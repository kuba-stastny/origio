import React, { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
          <div className="text-sm text-zinc-500">Načítám…</div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
