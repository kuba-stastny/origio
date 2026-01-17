"use client";
import { create } from "zustand";

// co všechno chceš ukazovat vlevo
export type LeftPanelType =
  | "feedback"
  | "account"
  | "subscription"
  | "hub"
  | "bug-report"
  | "analytics"
  | "settings"
  | "slug"
  | "whats-new"
  | "new-page"
  | "theme-panel"

  | null;

// vpravo bude spíš kontextová editace
export type RightPanelType =
  | { type: "section-edit"; sectionId?: string }
  | { type: "assets" }
  | null;

type UiPanelState = {
  leftPanel: LeftPanelType;
  rightPanel: RightPanelType;

  openLeft: (p: LeftPanelType) => void;
  closeLeft: () => void;

  openRight: (p: RightPanelType) => void;
  closeRight: () => void;
};

export const useUiPanel = create<UiPanelState>((set) => ({
  leftPanel: null,
  rightPanel: null,

  openLeft: (p) => set({ leftPanel: p }),
  closeLeft: () => set({ leftPanel: null }),

  openRight: (p) => set({ rightPanel: p }),
  closeRight: () => set({ rightPanel: null }),
}));
