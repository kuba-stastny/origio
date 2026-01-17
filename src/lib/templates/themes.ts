// updated onboarding theme presets (DB shape = snake_case)
// ✅ adds: inverse_surface, input, border

export const THEME_BLACKY = {
  body: "#d4d4d8",
  font: "system",
  heading: "#ffffff",

  primary: "#ffffff",
  primary_hover: "#e5e7eb",

  secondary: "#000000",
  secondary_hover: "#27272a",

  background: "#000000",
  surface: "#ffffff",

  // ✅ NEW
  inverse_surface: "#000000",
  input: "#0a0a0a",
  border: "#27272a",

  on_primary: "#000000",
  on_surface: "#000000",
  on_secondary: "#ffffff",
  on_background: "#ffffff",

  border_radius: 16,
} as const;

export const THEME_WHITEY = {
  body: "#0a0a0a",
  font: "system",
  heading: "#0a0a0a",

  primary: "#0a0a0a",
  primary_hover: "#18181b",

  secondary: "#ffffff",
  secondary_hover: "#f4f4f5",

  background: "#ffffff",
  surface: "#0a0a0a",

  // ✅ NEW
  inverse_surface: "#0a0a0a",
  input: "#ffffff",
  border: "#e4e4e7",

  on_primary: "#ffffff",
  on_surface: "#ffffff",
  on_secondary: "#0a0a0a",
  on_background: "#0a0a0a",

  border_radius: 16,
} as const;
