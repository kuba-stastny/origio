// src/types/design-system.ts

/**
 * DB shape (snake_case) – jen jedna paleta
 */
export type DesignSystemJson = {
  primary?: string;
  primary_hover?: string;
  secondary?: string;
  secondary_hover?: string;

  background?: string;
  surface?: string;

  // ✅ NEW
  inverse_surface?: string;
  input?: string;
  border?: string;

  on_primary?: string;
  on_secondary?: string;
  on_background?: string;
  on_surface?: string;

  heading?: string;
  body?: string;

  border_radius?: number;
  font?: "system" | "sans" | "serif" | "mono" | string;
};

/**
 * Runtime shape (camelCase) – používáš v komponentách
 */
export type DesignSystem = {
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;

  background: string;
  surface: string;

  // ✅ NEW
  inverseSurface: string;
  input: string;
  border: string;

  onPrimary: string;
  onSecondary: string;
  onBackground: string;
  onSurface: string;

  heading: string;
  body: string;

  borderRadius: number;
  font: "system" | "sans" | "serif" | "mono" | string;
};

/**
 * Per-section override – volitelně můžeš přebít jen pár hodnot
 * (třeba jen background/surface v jedné sekci)
 */
export type SectionThemeOverride = Partial<DesignSystemJson>;
