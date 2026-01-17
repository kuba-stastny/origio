// src/sections/cta-banner-v2.tsx
"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import { SectionShell } from "@/sections/ui/SectionShell";
import type { DesignSystem } from "@/types/design-system";
import { resolveSectionTheme, mapThemeJson } from "@/lib/design-system";
import { Heading, Text } from "@/sections/ui/Typography";
import PreviewImage from "../../previews/ct002.png";

/**
 * cta-banner-v2 (DS invert via surface/onSurface)
 * - Big centered layout
 * - Form (placeholders only) + contact links column
 * - Sends POST /api/contact (server resolves recipient by host slug or projectId in builder)
 * - Button shows status (Sending / Sent / Error)
 */

/* =========================
   Types
========================= */

type FormField = {
  placeholder?: string;
};

type ContactItem = {
  icon?: string; // "pack:ExportName" (react-icons)
  label?: string; // visible text
  href?: string; // optional link
};

/* =========================
   Defaults
========================= */

export const CTA_BANNER_V2_DEFAULT_DATA = {
  heading: "Hello! I'm Harrison. Tell me about your next project!",
  subheading:
    "I specialize in elevating brands on search engines, driving targeted traffic, and converting prospects into loyal clients.",
  form: {
    name: { placeholder: "Name" } as FormField,
    email: { placeholder: "Email" } as FormField,
    message: { placeholder: "Message" } as FormField,
    buttonLabel: "Send message",
  },
  contacts: [
    {
      icon: "md:MdOutlineMailOutline",
      label: "hello@dustin.com",
      href: "mailto:hello@dustin.com",
    },
    { icon: "md:MdOutlinePhone", label: "+114 945 78297", href: "tel:+11494578297" },
    { icon: "md:MdOutlineLanguage", label: "Instagram", href: "#" },
    { icon: "md:MdOutlineSportsBasketball", label: "Dribbble", href: "#" },
    { icon: "md:MdOutlineBrush", label: "Behance", href: "#" },
  ] as ContactItem[],
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
  return <C className={className} size={size} aria-hidden />;
}

/* =========================
   Renderer
========================= */

function inputStyle(): React.CSSProperties {
  return {
    background:
      "color-mix(in oklab, var(--ds-on-surface) 6%, var(--ds-surface) 94%)",
    color: "color-mix(in oklab, var(--ds-on-surface) 78%, transparent)",
    outline:
      "1px solid color-mix(in oklab, var(--ds-on-surface) 10%, transparent)",
    outlineOffset: "-1px",
  };
}

type CtaBannerV2RendererProps = {
  block: BlockInstance;
};

type SendState = "idle" | "sending" | "sent" | "error";

function pickProjectIdFromParams(p: any): string | undefined {
  if (!p) return undefined;
  const values = Object.values(p).filter(Boolean).map(String);
  const uuid = values.find((v) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
  return uuid ?? (p.projectId ? String(p.projectId) : undefined);
}

function CtaBannerV2Renderer({ block }: CtaBannerV2RendererProps) {
  const d: any = block.data || {};

  const heading: string = d.heading ?? CTA_BANNER_V2_DEFAULT_DATA.heading;
  const subheading: string =
    d.subheading ?? CTA_BANNER_V2_DEFAULT_DATA.subheading;

  const form = {
    name: d.form?.name ?? CTA_BANNER_V2_DEFAULT_DATA.form.name,
    email: d.form?.email ?? CTA_BANNER_V2_DEFAULT_DATA.form.email,
    message: d.form?.message ?? CTA_BANNER_V2_DEFAULT_DATA.form.message,
    buttonLabel:
      d.form?.buttonLabel ?? CTA_BANNER_V2_DEFAULT_DATA.form.buttonLabel,
  };

  const contacts: ContactItem[] =
    Array.isArray(d.contacts) && d.contacts.length
      ? d.contacts
      : (CTA_BANNER_V2_DEFAULT_DATA.contacts as any);

  const theme: DesignSystem = useMemo(() => {
    const mapped = mapThemeJson(d?.theme);
    return resolveSectionTheme(mapped);
  }, [d?.theme]);

  const params = useParams() as any;
  const projectId = pickProjectIdFromParams(params);

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
        window.setTimeout(() => setSendState("idle"), 2400);
        return;
      }

      setSendState("sent");
      setName("");
      setEmail("");
      setMessage("");

      window.setTimeout(() => setSendState("idle"), 2400);
    } catch (err) {
      console.error("Contact send error:", err);
      setSendState("error");
      window.setTimeout(() => setSendState("idle"), 2400);
    }
  }

  return (
    <SectionShell theme={theme}>
      <div className="mx-auto w-full">
        <div
          className={[
            "w-full overflow-hidden",
            "rounded-[calc(var(--ds-radius,16px))]",
            "px-6 py-10 md:px-10 md:py-14 lg:px-10 lg:py-20",
            "flex items-center justify-center",
          ].join(" ")}
          style={{
            background: "var(--ds-surface)",
            color: "var(--ds-on-surface)",
            outline:
              "1px solid color-mix(in oklab, var(--ds-on-surface) 14%, transparent)",
            outlineOffset: "-1px",
          }}
        >
          <div className="flex w-full max-w-[1280px] flex-col items-center gap-10 md:gap-14">
            {/* top text */}
            <div className="flex w-full flex-col items-center gap-4">
              <Heading
                level="h2"
                weight="medium"
                align="center"
                className="max-w-[800px]"
                style={{ color: "var(--ds-on-surface)" }}
              >
                {heading}
              </Heading>

              {!!subheading && (
                <Text
                  size="lg"
                  weight="light"
                  align="center"
                  className="max-w-[560px]"
                  style={{
                    color:
                      "color-mix(in oklab, var(--ds-on-surface) 70%, transparent)",
                  }}
                >
                  {subheading}
                </Text>
              )}
            </div>

            {/* middle: form + contacts */}
            <div className="flex w-full flex-col items-center justify-center gap-10 md:flex-row md:items-start md:gap-10">
              {/* form */}
              <div className="w-full md:w-[432px] md:max-w-[440px]">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    aria-label="Name"
                    placeholder={form.name?.placeholder || "Name"}
                    className={[
                      "w-full",
                      "rounded-[calc(var(--ds-radius,16px))]",
                      "px-4 py-3",
                      "text-[18px] leading-[27px] font-light",
                      "outline-none",
                    ].join(" ")}
                    style={inputStyle()}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (sendState !== "idle") setSendState("idle");
                    }}
                    autoComplete="name"
                  />

                  <input
                    aria-label="Email"
                    placeholder={form.email?.placeholder || "Email"}
                    className={[
                      "w-full",
                      "rounded-[calc(var(--ds-radius,16px))]",
                      "px-4 py-3",
                      "text-[18px] leading-[27px] font-light",
                      "outline-none",
                    ].join(" ")}
                    style={inputStyle()}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (sendState !== "idle") setSendState("idle");
                    }}
                    autoComplete="email"
                    inputMode="email"
                  />

                  <textarea
                    aria-label="Message"
                    placeholder={form.message?.placeholder || "Message"}
                    rows={4}
                    className={[
                      "w-full resize-none",
                      "rounded-[calc(var(--ds-radius,16px))]",
                      "px-4 py-3",
                      "text-[18px] leading-[27px] font-light",
                      "outline-none",
                    ].join(" ")}
                    style={inputStyle()}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (sendState !== "idle") setSendState("idle");
                    }}
                  />

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

              {/* contacts column */}
              <div className="w-full md:w-auto">
                <div className="flex flex-col gap-6 md:min-h-[272px] md:justify-between">
                  {contacts.map((c, i) => {
                    const href =
                      typeof c.href === "string" && c.href.length ? c.href : null;

                    const Row = (
                      <div className="flex items-center gap-4">
                        <div
                          className="h-8 w-8 shrink-0"
                          style={{ color: "var(--ds-on-surface)" }}
                        >
                          <ReactIcon
                            value={c.icon}
                            size={32}
                            className="text-[color:var(--ds-on-surface)]"
                          />
                        </div>

                        <Text
                          as="div"
                          size="md"
                          weight="light"
                          style={{
                            color:
                              "color-mix(in oklab, var(--ds-on-surface) 70%, transparent)",
                          }}
                        >
                          {c.label || "Contact"}
                        </Text>
                      </div>
                    );

                    return href ? (
                      <a
                        key={`${c.label || "contact"}-${i}`}
                        href={href}
                        className="inline-flex"
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          href.startsWith("http")
                            ? "noreferrer noopener"
                            : undefined
                        }
                      >
                        {Row}
                      </a>
                    ) : (
                      <div key={`${c.label || "contact"}-${i}`}>{Row}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

/* =========================
   Schema
========================= */

export const CTA_BANNER_V2_SCHEMA = [
  {
    type: "group",
    label: "Nastavení sekce",
    children: [
      {
        type: "theme",
        path: "theme",
        label: "Design systém sekce",
        help:
          "Invert varianta – karta používá ds-surface/ds-on-surface. " +
          "Pro bílý blok na tmavé stránce nastav surface světlé a bg tmavé.",
      },
      {
        type: "text",
        path: "heading",
        label: "Nadpis",
        rows: 2,
        multiline: true,
        maxLength: 140,
      },
      {
        type: "text",
        path: "subheading",
        label: "Podnadpis",
        rows: 3,
        multiline: true,
        maxLength: 240,
      },
    ],
  },
  {
    type: "group",
    label: "Formulář (placeholders)",
    children: [
      {
        type: "text",
        path: "form.name.placeholder",
        label: "Placeholder – Name",
        maxLength: 60,
      },
      {
        type: "text",
        path: "form.email.placeholder",
        label: "Placeholder – Email",
        maxLength: 60,
      },
      {
        type: "text",
        path: "form.message.placeholder",
        label: "Placeholder – Message",
        maxLength: 80,
      },
      {
        type: "text",
        path: "form.buttonLabel",
        label: "Text tlačítka",
        maxLength: 32,
      },
    ],
  },
  {
    type: "repeater",
    label: "Kontakty / odkazy",
    path: "contacts",
    emptyHint: "Přidej první kontakt",
    itemFactory: () => ({
      icon: "md:MdOutlineMailOutline",
      label: "hello@dustin.com",
      href: "mailto:hello@dustin.com",
    }),
    children: [
      {
        type: "icon",
        path: "icon",
        label: "Ikona",
        placeholder: "Select icon…",
        help: 'Ukládá se jako "pack:Name" (např. md:MdOutlineMailOutline).',
      },
      { type: "text", path: "label", label: "Text", maxLength: 80 },
      {
        type: "link",
        path: "href",
        label: "Odkaz (volitelné)",
        placeholder: "mailto: / tel: / https:// / #",
      },
    ],
  },
] as const;

/* =========================
   Editor
========================= */

function CtaBannerV2Editor() {
  return (
    <div className="p-3 text-xs text-[color:color-mix(in_oklab,var(--ds-body,var(--ds-on-bg))_65%,transparent)]">
      (Použij horní akci „Upravit sekci“ pro změnu textů, formuláře a kontaktů.)
    </div>
  );
}

/* =========================
   Registration
========================= */

const ct002: SectionModule = {
  id: "ct002",
  definition: {
    type: "cta-banner-v2",
    title: "CTA banner – v2 (center + contacts)",
    version: 2,
    defaultData: CTA_BANNER_V2_DEFAULT_DATA,
    Renderer: CtaBannerV2Renderer,
    editor: {
      schema: CTA_BANNER_V2_SCHEMA,
      title: "Upravit CTA banner (v2)",
      modelPath: "data",
    },
  },
  Editor: CtaBannerV2Editor,
  meta: {
    category: "cta",
    previewImage: PreviewImage,
  },
};

export default ct002;
