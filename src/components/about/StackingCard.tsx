"use client";

import React from "react";

// Route design system pass: dropped the image/photo panel entirely (was
// generic Unsplash stock photography, not real work — a credibility risk,
// not a style choice) and the bordered/shadowed "card" chrome. Iterated
// again after live feedback that the first text-only pass read as flat —
// this version adds real graphic presence through typographic devices
// instead of imagery: a giant low-opacity ghost index number (classic
// editorial-magazine technique), a larger pull-quote treatment for each
// section's opening line, and a cyan rule to break the red-only monochrome
// — all typography/color, zero new assets, zero invented content.
//
// bg-black on the root: found live (real screenshot, mid-scroll) that
// dropping the card's opaque background entirely broke the sticky-stack
// mechanism itself — each block's `sticky` wrapper in page.tsx overlaps the
// previous one during the scroll transition by design (that's how the
// cascade reads), and the original bordered card's solid fill was quietly
// doing double duty: masking that overlap so only one block's text stays
// legible at a time. A plain solid-black backing (no border, no shadow, no
// rounded corners) restores that masking without reintroducing "card"
// chrome.
export interface DossierBeat {
  kicker: string;
  heading: string;
  paragraphs: string[];
}

export function StackingCard({ beat, index }: { beat: DossierBeat; index: number }) {
  const [lead, ...rest] = beat.paragraphs;
  return (
    <div className="relative w-full max-w-3xl bg-black py-2">
      {/* Ghost index number — purely typographic, no image asset. Sits
          behind the heading so it reads as graphic texture, not a
          competing focal point. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 -left-2 select-none font-black text-[8rem] leading-none text-zinc-900/80 md:-top-10 md:text-[12rem]"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="relative">
        <span className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-red-500">
          <span className="h-px w-8 bg-red-500/60" aria-hidden="true" />
          {beat.kicker}
        </span>
        <h2 className="mb-7 text-4xl font-black uppercase tracking-tighter text-zinc-100 md:text-6xl">
          {beat.heading}
        </h2>
        <div className="space-y-5 border-l-2 border-cyan-500/40 pl-6 md:pl-8">
          {lead && (
            <p className="text-2xl leading-snug font-medium text-zinc-100 md:text-3xl">
              {lead}
            </p>
          )}
          {rest.map((paragraph, i) => (
            <p key={i} className="text-lg leading-relaxed text-zinc-400 md:text-xl">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StackingCard;
