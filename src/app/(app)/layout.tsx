import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import DotGridBackground from "@/components/DotGridBackground";

export default async function AppGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();

  return (
    <div className="relative min-h-dvh text-zinc-100">
      <DotGridBackground />

      <div className="relative z-10 min-h-dvh flex flex-col">
        {children}
      </div>
    </div>
  );
}
