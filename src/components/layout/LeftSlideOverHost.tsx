// src/components/layout/LeftSlideOverHost.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUiPanel } from "@/store/ui-panel";
import { X } from "lucide-react";

import FeedbackPanel from "@/components/panels/FeedbackPanel";
import AccountPanel from "@/components/panels/AccountPanel";
import SubscriptionPanel from "@/components/panels/SubscriptionPanel";
import HubPanel from "@/components/panels/HubPanel";
import BugReportPanel from "@/components/panels/BugReportPanel";
import AnalyticsPanel from "@/components/panels/AnalyticsPanel";
import SettingsPanel from "@/components/panels/SettingsPanel";
import SlugPanel from "@/components/panels/SlugPanel";
import WhatsNewPanel from "@/components/panels/WhatsNewPanel";
import NewPagePanel from "../panels/NewPagePanel";
import ThemePanel from "../panels/ThemePanel";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function LeftSlideOverHost() {
  const { leftPanel, closeLeft } = useUiPanel();
  const isOpen = !!leftPanel;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (blur + subtle vignette) */}
          <motion.button
            type="button"
            key="left-backdrop"
            aria-label="Close panel"
            className="fixed inset-0 z-[80] cursor-default bg-black/35 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            onClick={closeLeft}
          >
            {/* subtle gradient / vignette */}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-black/35" />
          </motion.button>

          {/* Panel */}
          <motion.aside
            key="left-panel"
            className="fixed inset-y-0 left-0 z-[90] flex w-full max-w-[600px]"
            initial={{ x: "-100%", opacity: 0, filter: "blur(10px)" as any }}
            animate={{ x: 0, opacity: 1, filter: "blur(0px)" as any }}
            exit={{ x: "-100%", opacity: 0, filter: "blur(10px)" as any }}
            transition={{ duration: 0.42, ease: EASE }}
            style={{ willChange: "transform" }}
          >
            {/* Outer wrapper */}
            <div className="flex h-full w-full flex-col">
              {/* Inner rounded shell */}
              <motion.div
                className="m-3 flex h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950"
                initial={{ scale: 0.985 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.985 }}
                transition={{ duration: 0.42, ease: EASE }}
                style={{ willChange: "transform" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-xl">
                  <p className="text-2xl tracking-tighter font-medium text-zinc-100">
                    {leftPanel === "feedback" && "Zpětná vazba"}
                    {leftPanel === "account" && "Můj účet"}
                    {leftPanel === "subscription" && "Předplatné"}
                    {leftPanel === "hub" && "Origio"}
                    {leftPanel === "analytics" && "Návštěvnost stránky"}
                    {leftPanel === "settings" && "Nastavení"}
                    {leftPanel === "slug" && "Doména"}
                    {leftPanel === "bug-report" && "Nahlášení chyb"}
                    {leftPanel === "whats-new" && "Co je nového"}
                    {leftPanel === "new-page" && "Začít znovu"}
                    {leftPanel === "theme-panel" && "Branding"}
                  </p>

                  <button
                    onClick={closeLeft}
                    className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-full bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
                    aria-label="Zavřít panel"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-zinc-950">
                  {leftPanel === "feedback" && <FeedbackPanel />}
                  {leftPanel === "account" && <AccountPanel />}
                  {leftPanel === "subscription" && <SubscriptionPanel />}
                  {leftPanel === "hub" && <HubPanel />}
                  {leftPanel === "bug-report" && <BugReportPanel />}
                  {leftPanel === "analytics" && <AnalyticsPanel />}
                  {leftPanel === "settings" && <SettingsPanel />}
                  {leftPanel === "slug" && <SlugPanel />}
                  {leftPanel === "whats-new" && <WhatsNewPanel />}
                  {leftPanel === "new-page" && <NewPagePanel />}
                  {leftPanel === "theme-panel" && <ThemePanel />}
                </div>
              </motion.div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
