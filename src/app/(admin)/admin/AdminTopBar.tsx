// src/components/admin/AdminTopbar.tsx
"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { FiSearch, FiBell, FiPlus } from "react-icons/fi";

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Uživatelé",
  "/admin/workspaces": "Workspaces",
  "/admin/sites": "Weby",
  "/admin/feedback": "Feedback",
  "/admin/bug-reports": "Bug reports",
};

function pickTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  // nested routes fallback
  const hit = Object.keys(TITLES).find((k) => k !== "/admin" && pathname.startsWith(k));
  return hit ? TITLES[hit] : "Admin";
}

export default function AdminTopbar() {
  const pathname = usePathname();

  const title = useMemo(() => pickTitle(pathname), [pathname]);

  return (
    <div className="border-b border-white/10 bg-zinc-950/40 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <div className="min-w-0">
          <div className="text-xs text-zinc-500">Admin</div>
          <div className="truncate text-sm font-semibold text-zinc-50">
            {title}
          </div>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 shadow-sm">
          <FiSearch className="text-zinc-400" />
          <input
            placeholder="Search…"
            className="w-[240px] bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
          />
        </div>

        {/* Actions */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06] transition"
          title="Notifications"
        >
          <FiBell />
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition"
        >
          <FiPlus />
          Action
        </button>
      </div>
    </div>
  );
}
