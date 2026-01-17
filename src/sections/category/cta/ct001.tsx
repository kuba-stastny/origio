// src/sections/cta-banner.tsx
"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import { SectionShell } from "@/sections/ui/SectionShell";
import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";
import { Heading, Text } from "@/sections/ui/Typography";
import PreviewImage from "../../previews/ct001.png";

/**
 * cta-banner (DS invert via surface/onSurface)
 * - Card uses: surface + onSurface
 * - Works as "white card on black page" if DS has bg dark + surface light
 * - Socials use IconField value "pack:ExportName" (react-icons)
 * - Form sends POST /api/contact (server resolves recipient by host slug or projectId in builder)
 */

/* =========================
   Defaults
========================= */

type SocialItem = {
  icon?: string; // e.g. "md:MdOutlineLanguage"
  href?: string;
  label?: string; // a11y label
};

type FormField = {
  label?: string;
  placeholder?: string;
};

export const CTA_BANNER_DEFAULT_DATA = {
  heading: "Tell me about your next project!",
  subheading:
    "I specialize in elevating brands on search engines, driving targeted traffic, and converting prospects into loyal clients through strategic SEO and cutting-edge marketing techniques.",
  socials: [
    { icon: "md:MdOutlineLanguage", href: "#", label: "Website" },
    { icon: "md:MdOutlineMailOutline", href: "#", label: "Email" },
  ] as SocialItem[],
  form: {
    name: { label: "Name", placeholder: "Kubo Novak" } as FormField,
    email: { label: "Email", placeholder: "kubo@studio.cz" } as FormField,
    message: {
      label: "Message",
      placeholder: "Write your inquiry...",
    } as FormField,
    buttonLabel: "Send message",
  },
} as const;

/* =========================
   react-icons dynamic rendering (pack:ExportName)
========================= */

function parseIconValue(v?: string | null) {
  if (!v) return null;
  const s = String(v);
  const idx = s.indexOf(":");
  if (idx === -1) return null;
  const pack = s.slice(0, idx);
  const name = s.slice(idx + 1);
  if (!pack || !name) return null;
  return { pack, name };
}

async function loadReactIcon(pack: string, name: string) {
  switch (pack) {
    case "fa": {
      const mod: any = await import("react-icons/fa");
      return mod?.[name] ?? null;
    }
    case "fa6": {
      const mod: any = await import("react-icons/fa6");
      return mod?.[name] ?? null;
    }
    case "md": {
      const mod: any = await import("react-icons/md");
      return mod?.[name] ?? null;
    }
    case "io": {
      const mod: any = await import("react-icons/io");
      return mod?.[name] ?? null;
    }
    case "io5": {
      const mod: any = await import("react-icons/io5");
      return mod?.[name] ?? null;
    }
    case "fi": {
      const mod: any = await import("react-icons/fi");
      return mod?.[name] ?? null;
    }
    case "hi": {
      const mod: any = await import("react-icons/hi");
      return mod?.[name] ?? null;
    }
    case "hi2": {
      const mod: any = await import("react-icons/hi2");
      return mod?.[name] ?? null;
    }
    case "ri": {
      const mod: any = await import("react-icons/ri");
      return mod?.[name] ?? null;
    }
    case "bs": {
      const mod: any = await import("react-icons/bs");
      return mod?.[name] ?? null;
    }
    case "tb": {
      const mod: any = await import("react-icons/tb");
      return mod?.[name] ?? null;
    }
    case "si": {
      const mod: any = await import("react-icons/si");
      return mod?.[name] ?? null;
    }
    case "bi": {
      const mod: any = await import("react-icons/bi");
      return mod?.[name] ?? null;
    }
    case "cg": {
      const mod: any = await import("react-icons/cg");
      return mod?.[name] ?? null;
    }
    case "ci": {
      const mod: any = await import("react-icons/ci");
      return mod?.[name] ?? null;
    }
    case "di": {
      const mod: any = await import("react-icons/di");
      return mod?.[name] ?? null;
    }
    case "gi": {
      const mod: any = await import("react-icons/gi");
      return mod?.[name] ?? null;
    }
    case "go": {
      const mod: any = await import("react-icons/go");
      return mod?.[name] ?? null;
    }
    case "gr": {
      const mod: any = await import("react-icons/gr");
      return mod?.[name] ?? null;
    }
    case "im": {
      const mod: any = await import("react-icons/im");
      return mod?.[name] ?? null;
    }
    case "lia": {
      const mod: any = await import("react-icons/lia");
      return mod?.[name] ?? null;
    }
    case "lu": {
      const mod: any = await import("react-icons/lu");
      return mod?.[name] ?? null;
    }
    case "pi": {
      const mod: any = await import("react-icons/pi");
      return mod?.[name] ?? null;
    }
    case "rx": {
      const mod: any = await import("react-icons/rx");
      return mod?.[name] ?? null;
    }
    case "sl": {
      const mod: any = await import("react-icons/sl");
      return mod?.[name] ?? null;
    }
    case "tfi": {
      const mod: any = await import("react-icons/tfi");
      return mod?.[name] ?? null;
    }
    case "ti": {
      const mod: any = await import("react-icons/ti");
      return mod?.[name] ?? null;
    }
    case "vsc": {
      const mod: any = await import("react-icons/vsc");
      return mod?.[name] ?? null;
    }
    case "wi": {
      const mod: any = await import("react-icons/wi");
      return mod?.[name] ?? null;
    }
    case "ai": {
      const mod: any = await import("react-icons/ai");
      return mod?.[name] ?? null;
    }
    case "fc": {
      const mod: any = await import("react-icons/fc");
      return mod?.[name] ?? null;
    }
    default:
      return null;
  }
}

function ReactIcon({
  value,
  className,
  size = 32,
}: {
  value?: string | null;
  className?: string;
  size?: number;
}) {
  const parsed = useMemo(() => parseIconValue(value || ""), [value]);
  const Comp = React.useRef<React.ComponentType<any> | null>(null);
  const [, force] = React.useState(0);

  React.useEffect(() => {
    let alive = true;

    async function run() {
      if (!parsed) {
        Comp.current = null;
        force((x) => x + 1);
        return;
      }
      try {
        const c = await loadReactIcon(parsed.pack, parsed.name);
        if (!alive) return;
        Comp.current = c ? c : null;
        force((x) => x + 1);
      } catch {
        if (!alive) return;
        Comp.current = null;
        force((x) => x + 1);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [parsed?.pack, parsed?.name]);

  const C: any = Comp.current;
  if (!C) return null;
  return <C className={className} size={size} />;
}

/* =========================
   Renderer
========================= */

type CtaBannerRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

function FieldShell({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {!!label && (
        <Text
          as="div"
          size="xs"
          weight="light"
          className="leading-[18.48px]"
          style={{
            color:
              "color-mix(in oklab, var(--ds-on-surface, var(--ds-on-bg)) 70%, transparent)",
          }}
        >
          {label}
        </Text>
      )}
      {children}
    </div>
  );
}

type SendState = "idle" | "sending" | "sent" | "error";

function CtaBannerRenderer({ block, theme }: CtaBannerRendererProps) {
  const d: any = block.data || {};

  const heading: string = d.heading ?? CTA_BANNER_DEFAULT_DATA.heading;
  const subheading: string = d.subheading ?? CTA_BANNER_DEFAULT_DATA.subheading;

  const socials: SocialItem[] =
    Array.isArray(d.socials) && d.socials.length
      ? d.socials
      : (CTA_BANNER_DEFAULT_DATA.socials as any);

  const form = {
    name: d.form?.name ?? CTA_BANNER_DEFAULT_DATA.form.name,
    email: d.form?.email ?? CTA_BANNER_DEFAULT_DATA.form.email,
    message: d.form?.message ?? CTA_BANNER_DEFAULT_DATA.form.message,
    buttonLabel: d.form?.buttonLabel ?? CTA_BANNER_DEFAULT_DATA.form.buttonLabel,
  };

  const resolvedTheme = theme ?? mapThemeJson(null);

  // builder projectId (optional; used on app.origio.site)
  const params = useParams() as any;
  const projectId: string | undefined = params?.projectId;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [sendState, setSendState] = useState<SendState>("idle");

  const isBusy = sendState === "sending";
  const canSend =
    !!name.trim() && !!email.trim() && !!message.trim() && !isBusy;

  const buttonText = useMemo(() => {
    if (sendState === "sending") return "Sending…";
    if (sendState === "sent") return "Sent ✓";
    if (sendState === "error") return "Error — try again";
    return form.buttonLabel || "Send message";
  }, [sendState, form.buttonLabel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) {
      setSendState("error");
      return;
    }

    setSendState("sending");

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      };

      // Builder mode: pass projectId so API can resolve owner email
      if (projectId) payload.projectId = projectId;

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Contact send failed:", res.status, json);
        setSendState("error");
        return;
      }

      setSendState("sent");
      setName("");
      setEmail("");
      setMessage("");

      // revert state back after a bit
      window.setTimeout(() => setSendState("idle"), 2400);
    } catch (err) {
      console.error("Contact send error:", err);
      setSendState("error");
      window.setTimeout(() => setSendState("idle"), 2400);
    }
  }

  return (
    <SectionShell theme={resolvedTheme}>
      <div className="mx-auto w-full">
        {/* INVERT CARD: surface + onSurface */}
        <div
          className={[
            "w-full overflow-hidden",
            "rounded-[calc(var(--ds-radius,16px))]",
            "px-6 py-8 md:px-10 md:py-10 lg:pr-16 lg:pl-10 lg:py-10",
            "flex flex-col gap-10 md:flex-row md:items-center md:gap-20",
          ].join(" ")}
          style={{
            background: "var(--ds-surface)",
            color: "var(--ds-on-surface)",
            outline:
              "1px solid color-mix(in oklab, var(--ds-on-surface) 14%, transparent)",
            outlineOffset: "-1px",
          }}
        >
          {/* Left */}
          <div className="flex-1">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-4">
                <Heading
                  level="h2"
                  weight="medium"
                  style={{ color: "var(--ds-on-surface)" }}
                >
                  {heading}
                </Heading>

                {!!subheading && (
                  <Text
                    size="lg"
                    weight="light"
                    className="max-w-[480px]"
                    style={{
                      color:
                        "color-mix(in oklab, var(--ds-on-surface) 70%, transparent)",
                    }}
                  >
                    {subheading}
                  </Text>
                )}
              </div>

              {Array.isArray(socials) && socials.length > 0 && (
                <div className="flex flex-wrap items-center gap-6">
                  {socials.map((s, i) => {
                    const href = s.href || "#";
                    const label = s.label || "Social link";
                    return (
                      <a
                        key={`${s.icon || "icon"}-${i}`}
                        href={href}
                        aria-label={label}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex h-8 w-8 items-center justify-center"
                        style={{ color: "var(--ds-on-surface)" }}
                      >
                        <ReactIcon
                          value={s.icon}
                          size={32}
                          className="text-[color:var(--ds-on-surface)]"
                        />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right (form) */}
          <div className="w-full md:w-[432px] md:max-w-[440px]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <FieldShell label={form.name?.label || "Name"}>
                  <input
                    aria-label={form.name?.label || "Name"}
                    placeholder={form.name?.placeholder || ""}
                    className={[
                      "w-full",
                      "rounded-[calc(var(--ds-radius,16px))]",
                      "px-4 py-3",
                      "text-[18px] leading-[27px] font-light",
                      "outline-none",
                    ].join(" ")}
                    style={{
                      background:
                        "color-mix(in oklab, var(--ds-bg) 5%, var(--ds-surface) 8%)",
                      color:
                        "color-mix(in oklab, var(--ds-on-surface) 72%, transparent)",
                      outline:
                        "1px solid color-mix(in oklab, var(--ds-on-surface) 10%, transparent)",
                      outlineOffset: "-1px",
                    }}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (sendState !== "idle") setSendState("idle");
                    }}
                    autoComplete="name"
                  />
                </FieldShell>

                <FieldShell label={form.email?.label || "Email"}>
                  <input
                    aria-label={form.email?.label || "Email"}
                    placeholder={form.email?.placeholder || ""}
                    className={[
                      "w-full",
                      "rounded-[calc(var(--ds-radius,16px))]",
                      "px-4 py-3",
                      "text-[18px] leading-[27px] font-light",
                      "outline-none",
                    ].join(" ")}
                    style={{
                      background:
                        "color-mix(in oklab, var(--ds-bg) 5%, var(--ds-surface) 8%)",
                      color:
                        "color-mix(in oklab, var(--ds-on-surface) 72%, transparent)",
                      outline:
                        "1px solid color-mix(in oklab, var(--ds-on-surface) 10%, transparent)",
                      outlineOffset: "-1px",
                    }}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (sendState !== "idle") setSendState("idle");
                    }}
                    autoComplete="email"
                    inputMode="email"
                  />
                </FieldShell>

                <FieldShell label={form.message?.label || "Message"}>
                  <textarea
                    aria-label={form.message?.label || "Message"}
                    placeholder={form.message?.placeholder || ""}
                    rows={4}
                    className={[
                      "w-full resize-none",
                      "rounded-[calc(var(--ds-radius,16px))]",
                      "px-4 py-3",
                      "text-[18px] leading-[27px] font-light",
                      "outline-none",
                    ].join(" ")}
                    style={{
                      background:
                        "color-mix(in oklab, var(--ds-bg) 5%, var(--ds-surface) 8%)",
                      color:
                        "color-mix(in oklab, var(--ds-on-surface) 72%, transparent)",
                      outline:
                        "1px solid color-mix(in oklab, var(--ds-on-surface) 10%, transparent)",
                      outlineOffset: "-1px",
                    }}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (sendState !== "idle") setSendState("idle");
                    }}
                  />
                </FieldShell>
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: isBusy ? 1 : 0.99 }}
                disabled={!canSend}
                className={[
                  "h-12 w-full",
                  "rounded-[calc(var(--ds-radius,16px))]",
                  "px-8 py-2",
                  "text-[18px] leading-[27px] font-medium tracking-[-0.01em]",
                  !canSend ? "opacity-80 cursor-not-allowed" : "",
                ].join(" ")}
                style={{
                  background: "var(--ds-on-surface)",
                  color: "var(--ds-surface)",
                }}
                aria-live="polite"
              >
                {buttonText}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

/* =========================
   Schema
========================= */

export const CTA_BANNER_SCHEMA = [
  {
    type: "group",
    label: "Nastavení sekce",
    children: [
      {
        type: "theme",
        path: "theme",
        label: "Design systém sekce",
        help:
          "Tahle sekce je 'invert' – karta používá ds-surface/ds-on-surface. " +
          "Pro bílý banner na tmavé stránce nastav surface světlé a bg tmavé.",
      },
      {
        type: "text",
        path: "heading",
        label: "Nadpis",
        rows: 2,
        multiline: true,
        maxLength: 120,
      },
      {
        type: "text",
        path: "subheading",
        label: "Podnadpis",
        rows: 4,
        multiline: true,
        maxLength: 320,
      },
    ],
  },
  {
    type: "repeater",
    label: "Ikony / odkazy",
    path: "socials",
    emptyHint: "Přidej první ikonu",
    itemFactory: () => ({
      icon: "md:MdOutlineLanguage",
      href: "#",
      label: "Website",
    }),
    children: [
      {
        type: "icon",
        path: "icon",
        label: "Ikona",
        placeholder: "Select icon…",
        help: 'Ukládá se jako "pack:Name" (např. md:MdHome).',
      },
      {
        type: "text",
        path: "label",
        label: "Popisek (a11y)",
        placeholder: "Website / Email / Instagram…",
        maxLength: 40,
      },
      {
        type: "link",
        path: "href",
        label: "URL",
        placeholder: "https://…",
      },
    ],
  },
  {
    type: "group",
    label: "Formulář",
    children: [
      {
        type: "group",
        label: "Name",
        children: [
          {
            type: "text",
            path: "form.name.label",
            label: "Label",
            maxLength: 24,
          },
          {
            type: "text",
            path: "form.name.placeholder",
            label: "Placeholder",
            maxLength: 60,
          },
        ],
      },
      {
        type: "group",
        label: "Email",
        children: [
          {
            type: "text",
            path: "form.email.label",
            label: "Label",
            maxLength: 24,
          },
          {
            type: "text",
            path: "form.email.placeholder",
            label: "Placeholder",
            maxLength: 60,
          },
        ],
      },
      {
        type: "group",
        label: "Message",
        children: [
          {
            type: "text",
            path: "form.message.label",
            label: "Label",
            maxLength: 24,
          },
          {
            type: "text",
            path: "form.message.placeholder",
            label: "Placeholder",
            maxLength: 80,
          },
        ],
      },
      {
        type: "text",
        path: "form.buttonLabel",
        label: "Text tlačítka",
        placeholder: "Send message",
        maxLength: 32,
      },
    ],
  },
] as const;

/* =========================
   Editor
========================= */

function CtaBannerEditor() {
  return (
    <div className="p-3 text-xs text-[color:color-mix(in_oklab,var(--ds-body,var(--ds-on-bg))_65%,transparent)]">
      (Použij horní akci „Upravit sekci“ pro změnu textů, ikon a formuláře.)
    </div>
  );
}

/* =========================
   Registrace sekce
========================= */

const ct001: SectionModule = {
  id: "ct001",
  definition: {
    type: "cta-banner",
    title: "CTA banner – invert form",
    version: 4,
    defaultData: CTA_BANNER_DEFAULT_DATA,
    Renderer: CtaBannerRenderer,
    editor: {
      schema: CTA_BANNER_SCHEMA,
      title: "Upravit CTA banner",
      modelPath: "data",
    },
  },
  Editor: CtaBannerEditor,
  meta: {
    category: "cta",
    previewImage: PreviewImage,
  },
};

export default ct001;
