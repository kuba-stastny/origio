// src/lib/analytics/types.ts
export type DeviceType = "desktop" | "mobile" | "tablet";
export type OSName = "ios" | "android" | "macos" | "windows" | "linux" | "other";
export type HeatKind = "click" | "hover";
export type Breakpoint = "sm" | "md" | "lg";

export type RawEventName =
  | "click"
  | "hover"
  | "scroll"
  | "section_time"
  | "heartbeat"
  | "end"
  | "cta"
  | "checkout"
  | "purchase"
  | "page_start";

export type RawEvent = {
  type: RawEventName;
  ts?: number; // ms epoch
  data?: Record<string, unknown>;
};

export type PageviewRow = {
  id: string;
  session_id: string;
  project_id: string;
  page_id: string;
  path: string;
  referrer: string | null;
  utm: Record<string, unknown> | null;
  screen: { w: number; h: number } | null;
  viewport: { w: number; h: number } | null;
  device_type: DeviceType | null;
  os: OSName | null;
  country: string | null;
  region: string | null;
  city: string | null;
  started_at: string; // ISO
  duration_ms: number | null;
  scroll_depth: number | null;
  sections_ms: Record<string, number> | null;
  clicks_count: number;
  clicks_top: Record<string, number> | null;
  last_seen: string; // ISO
};

export type HeatTileRow = {
  project_id: string;
  page_id: string;
  path: string;
  breakpoint: Breakpoint;
  kind: HeatKind;
  x: number; // 0..63
  y: number; // 0..35
  count: number;
};
