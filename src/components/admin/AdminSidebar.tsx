// src/components/admin/AdminSidebar.tsx
"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiGrid,
  FiUsers,
  FiLayers,
  FiGlobe,
  FiMessageSquare,
  FiAlertTriangle,
} from "react-icons/fi";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <FiGrid /> },
  { href: "/admin/users", label: "Uživatelé", icon: <FiUsers /> },
  { href: "/admin/workspaces", label: "Workspaces", icon: <FiLayers /> },
  { href: "/admin/sites", label: "Weby", icon: <FiGlobe /> },
  { href: "/admin/feedback", label: "Feedback", icon: <FiMessageSquare /> },
  { href: "/admin/bug-reports", label: "Bug reports", icon: <FiAlertTriangle /> },
];

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ top: number; height: number; ready: boolean }>({
    top: 0,
    height: 0,
    ready: false,
  });

  const activeHref = useMemo(() => {
    const exact = navItems.find((it) => it.href === pathname)?.href;
    if (exact) return exact;

    // fallback for nested routes
    const hit = navItems.find((it) => it.href !== "/admin" && pathname.startsWith(it.href));
    return hit?.href ?? "/admin";
  }, [pathname]);

  function measure() {
    const root = containerRef.current;
    const el = itemRefs.current[activeHref];
    if (!root || !el) return;

    const rRoot = root.getBoundingClientRect();
    const rEl = el.getBoundingClientRect();

    setPill({
      top: rEl.top - rRoot.top,
      height: rEl.height,
      ready: true,
    });
  }

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref]);

  useLayoutEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    // if sidebar scrolls / fonts load
    const t = window.setTimeout(() => measure(), 0);
    const t2 = window.setTimeout(() => measure(), 250);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800/70 bg-zinc-950/80 backdrop-blur">
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-800/70">
        <span className="text-lg font-semibold tracking-tight text-zinc-50">
          Origio Admin
        </span>
      </div>

      {/* Nav */}
      <div className="relative flex-1 px-2 py-4">
        {/* Sliding active background */}
        <div ref={containerRef} className="relative space-y-1">
          {pill.ready && (
            <motion.div
              aria-hidden
              className="absolute left-0 right-0 rounded-xl bg-white/10 ring-1 ring-white/10 shadow-sm"
              initial={false}
              animate={{ y: pill.top, height: pill.height }}
              transition={{ type: "spring", stiffness: 520, damping: 44 }}
            />
          )}

          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => {
                  itemRefs.current[item.href] = el;
                }}
                className={cx(
                  "relative z-10 group flex items-center gap-2 rounded-xl px-3 py-2 transition",
                  "outline-none focus-visible:ring-2 focus-visible:ring-white/10 focus-visible:ring-offset-0",
                  active ? "text-white" : "text-zinc-400 hover:text-zinc-50 hover:bg-white/5"
                )}
              >
                <span
                  className={cx(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg transition",
                    active ? "bg-white/10 text-white" : "bg-white/[0.03] text-zinc-300 group-hover:bg-white/[0.06]"
                  )}
                >
                  {item.icon}
                </span>

                <span className="text-sm">{item.label}</span>

                {/* Active dot (optional small indicator) */}
                <span
                  className={cx(
                    "ml-auto h-1.5 w-1.5 rounded-full transition",
                    active ? "bg-white" : "bg-zinc-700 group-hover:bg-zinc-500"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer / hint */}
      <div className="px-4 py-3 border-t border-zinc-800/70">
        <div className="text-xs text-zinc-500">Admin panel • dark mode only</div>
      </div>
    </aside>
  );
}
