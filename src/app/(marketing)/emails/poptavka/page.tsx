// src/app/email-preview/page.tsx
'use client';

import React from 'react';

export default function EmailPreviewPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-10">
      <div className="w-[624px] p-10 bg-zinc-950 inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
        <div className="self-stretch flex flex-col justify-start text-white items-center">
          <div className="mt-3 justify-start tracking-tighter text-white text-4xl font-semibold">
            Máš tu potávku z origio.
          </div>
          <div className="mt-3 self-stretch tracking-tighter text-center justify-start text-neutral-400 text-xs font-light">
            Na origio ti právě někdo poslal poptávku.
          </div>
        </div>

        <div className="border-1 border-zinc-700 p-5 border-dashed mt-5 self-stretch flex flex-col justify-start text-white items-center gap-[5px]">
          <div className="mt-4 self-stretch tracking-tighter text-center justify-start text-neutral-400 text-xs font-light">
            Dobrý den, chtěl by se zeptat zda se zabývate i webdesignem eshopů?
            Náš budget je 80 000 Kč až 200 000 Kč.
          </div>
          <div className="mt-2">
            <p className=" self-stretch tracking-tighter text-center justify-start text-neutral-200 text-xs font-light">
              John Smith
            </p>
            <a
              href="mail:to"
              className="self-stretch underline tracking-tighter text-center justify-start text-neutral-200 text-xs font-light"
            >
              johnsmith@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-5 text-center font-light tracking-tighter justify-start text-neutral-400 text-[8px]">
          Tento e-mail byl odeslán na základw tvého registrované emailu v
          origio.site, na který ti budou chodit poptávky
        </div>
      </div>
    </div>
  );
}
