// src/components/panels/HubPanel.tsx
"use client";

import { useState } from "react";
import { useUiPanel } from "@/store/ui-panel";
import {
  MessageCircle,
  Heart,
  AlertTriangle,
  Twitter,
  Instagram,
  ExternalLink,
} from "lucide-react";

type HubSlide = {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  target?: "whats-new" | "feedback" | "bug-report" | null;
};

const HUB_SLIDES: HubSlide[] = [
  {
    id: "slide-1",
    title: "Co je nového v Origio",
    subtitle: "Mrkni na poslední novinky a změny v aplikaci.",
    image:
      "https://www.apple.com/v/iphone/home/cf/images/overview/select/iphone_17pro__0s6piftg70ym_large.jpg",
    target: "whats-new",
  },
  {
    id: "slide-2",
    title: "Sdílej svůj názor",
    subtitle: "Pošli nám zpětnou vazbu přímo z aplikace.",
    image:
      "https://www.apple.com/v/iphone/home/cf/images/overview/select/iphone_17pro__0s6piftg70ym_large.jpg",
    target: "feedback",
  },
  {
    id: "slide-3",
    title: "Nahlas chybu během pár sekund",
    subtitle: "Přilož screenshoty a my se na to podíváme.",
    image:
      "https://www.apple.com/v/iphone/home/cf/images/overview/select/iphone_17pro__0s6piftg70ym_large.jpg",
    target: "bug-report",
  },
];

export default function HubPanel() {
  const { openLeft } = useUiPanel();
  const [activeSlide, setActiveSlide] = useState(0);

  const slide = HUB_SLIDES[activeSlide];

  function handleSlideClick() {
    if (slide.target) {
      openLeft(slide.target);
    }
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* horní grid */}
      <div className="grid grid-cols-2 gap-5">
        {/* SLIDER karta přes dva sloupce */}
        <div className="col-span-2 space-y-2 mb-3">
          <button
            type="button"
            onClick={handleSlideClick}
            className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-900/40 group"
          >
            {/* background image */}
            <div className="absolute inset-0">
              {slide.image ? (
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950" />
              )}
            </div>

            {/* bottom gradient + text */}
            <div className="absolute w-full h-full top-0 bottom-0">
              <div className="h-full w-full bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-4 text-left">
              <div className="space-y-1">
                <h2 className="text-xl font-medium tracking-tighter text-zinc-50">
                  {slide.title}
                </h2>
                <p className="text-xs text-zinc-300">{slide.subtitle}</p>
              </div>
            </div>
          </button>

          {/* tečky pod sliderem */}
          <div className="flex items-center justify-center gap-1.5">
            {HUB_SLIDES.map((s, index) => {
              const isActive = index === activeSlide;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`rounded-full transition ${
                    isActive
                      ? "w-5 h-2 bg-zinc-100"
                      : "w-2 h-2 bg-zinc-600/60 hover:bg-zinc-400"
                  }`}
                  aria-label={`Přepnout na slide ${index + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Zpětná vazba */}
        <button
          onClick={() => openLeft("feedback")}
          className="hidden aspect-square rounded-3xl bg-zinc-900/30 flex flex-col items-start justify-between p-4 hover:bg-zinc-900 transition"
        >
          <div className="h-10 w-10 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-100">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-left">
            <div className="text-base tracking-tighter font-medium text-zinc-50">
              Odeslat feedback
            </div>
            <div className="text-xs tracking-tighter text-zinc-500 leading-tight">
              Řekněte nám, co zlepšit
            </div>
          </div>
        </button>

        {/* Novinky */}
        <button
          onClick={() => openLeft("whats-new")}
          className="hidden aspect-square rounded-3xl bg-zinc-900/30 flex flex-col items-start justify-between p-4 hover:bg-zinc-900 transition"
        >
          <div className="h-10 w-10 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-100">
            <Heart className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-left">
            <div className="text-base tracking-tighter font-medium text-zinc-50">
              Co je nového
            </div>
            <div className="text-xs tracking-tighter text-zinc-500 leading-tight">
              Poslední změny
            </div>
          </div>
        </button>

        {/* Hlášení chyb – přes dva sloupce */}
        <button
          onClick={() => openLeft("bug-report")}
          className="hidden col-span-2 h-24 rounded-3xl bg-zinc-900/30 flex items-center gap-4 px-4 hover:bg-zinc-900 transition"
        >
          <div className="h-10 w-10 rounded-xl bg-zinc-800/60 flex items-center justify-center text-orange-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-base tracking-tighter font-medium text-zinc-50">
              Nahlásit chybu
            </div>
            <div className="text-xs text-zinc-500">
              Něco nefunguje nebo vypadá divně
            </div>
          </div>
        </button>
      </div>

      {/* spodní část */}
      <div className="space-y-4">
        {/* socials grid */}
        <div className="grid grid-cols-2 gap-5">
          <a
            href="https://twitter.com/origiosite"
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl bg-zinc-900/30 px-4 py-3 flex items-center justify-between hover:bg-zinc-900 transition"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-2xl bg-zinc-800/60 flex items-center justify-center">
                <Twitter className="w-4 h-4 text-zinc-100" />
              </div>
              <div className="text-left">
                <div className="text-base tracking-tighter font-medium text-zinc-50">
                  Twitter
                </div>
                <div className="text-[11px] text-zinc-500">@origiosite</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500" />
          </a>

          <a
            href="https://instagram.com/origiosite"
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl bg-zinc-900/30 px-4 py-3 flex items-center justify-between hover:bg-zinc-900 transition"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-2xl bg-zinc-800/60 flex items-center justify-center">
                <Instagram className="w-4 h-4 text-zinc-100" />
              </div>
              <div className="text-left">
                <div className="text-base tracking-tighter font-medium text-zinc-50">
                  Instagram
                </div>
                <div className="text-[11px] text-zinc-500">@origiosite</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500" />
          </a>
        </div>

        {/* footer */}
        <div className="pt-4 pb-2 flex flex-col items-center gap-3">
          <img className="w-[100px]" src="/images/logo2.png" alt="" />
          <div className="text-center">
            <p className="text-[11px] text-zinc-500">Verze 1.0.0</p>
          </div>
          <div className="flex gap-4 text-[11px] text-zinc-500">
            <button
              onClick={() => openLeft("tos")}
              className="hover:text-zinc-300 transition inline-flex items-center gap-1"
            >
              Podmínky používání
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => openLeft("privacy")}
              className="hover:text-zinc-300 transition inline-flex items-center gap-1"
            >
              Ochrana soukromí
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
