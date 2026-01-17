// src/lib/builderValidation.ts
import { z } from "zod";

export const HeroV2 = z.object({
  eyebrow: z.string().optional().default(""),
  title: z.string().optional().default(""),
  text: z.string().optional().default(""),
  ctas: z
    .array(
      z.object({
        label: z.string().optional().default("Akce"),
        href: z.string().optional().default("#"),
        style: z.string().optional(), // do budoucna
      })
    )
    .optional()
    .default([]),
});

export const FeaturesV2 = z.object({
  heading: z.string().optional().default(""),
  features: z
    .array(
      z.object({
        title: z.string().optional().default(""),
        text: z.string().optional().default(""),
        icon: z.string().optional().default("dot"),
      })
    )
    .optional()
    .default([]),
});

export const TestimonialsV1 = z.object({
  heading: z.string().optional().default(""),
  items: z
    .array(
      z.object({
        quote: z.string().optional().default(""),
        author: z.string().optional().default(""),
      })
    )
    .optional()
    .default([]),
});

export const PricingV1 = z.object({
  heading: z.string().optional().default(""),
  plans: z
    .array(
      z.object({
        name: z.string().optional().default(""),
        price: z.string().optional().default(""),
        features: z.array(z.string()).optional().default([]),
        cta: z
          .object({
            label: z.string().optional().default("Vybrat"),
            href: z.string().optional().default("#"),
          })
          .optional()
          .default({ label: "Vybrat", href: "#" }),
      })
    )
    .optional()
    .default([]),
});

export const FaqV1 = z.object({
  heading: z.string().optional().default(""),
  items: z
    .array(
      z.object({
        q: z.string().optional().default(""),
        a: z.string().optional().default(""),
      })
    )
    .optional()
    .default([]),
});

export function validateBlockData(type: string, version: number, data: any) {
  try {
    switch (type) {
      case "hero-cta":
        if (version === 2) return { ok: true, data: HeroV2.parse(data) };
        break;
      case "features-grid":
        if (version === 2) return { ok: true, data: FeaturesV2.parse(data) };
        break;
      case "testimonials":
        if (version === 1) return { ok: true, data: TestimonialsV1.parse(data) };
        break;
      case "pricing":
        if (version === 1) return { ok: true, data: PricingV1.parse(data) };
        break;
      case "faq":
        if (version === 1) return { ok: true, data: FaqV1.parse(data) };
        break;
    }
    // neznámý typ/verze -> vrátíme původní data (migrace se postarají o defaulty)
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Validation error" };
  }
}
