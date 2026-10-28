"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import DataMeshBackground from "@/components/about/DataMeshBackground";
import StackingCard, { type DossierBeat } from "@/components/about/StackingCard";
import { MotionFooter } from "@/components/ui/motion-footer";
import { signalRenderReady } from "@/lib/renderReadyBridge";

// Route design system pass: the original 8 mood/personality cards are
// regrouped into 4 thematic movements — every sentence below is the
// UNCHANGED original text from the prior DOSSIER_DATA entries (Cybersecurity
// + Digital Investigation -> movement 1, Student & Real-World + Builder ->
// movement 2, Linux & Design + The Mindset -> movement 3, Off-Grid +
// Community & Sound -> movement 4). Nothing was rewritten or invented; this
// is a presentation/pacing change (8 photo cards -> 4 text-forward
// movements), not a content change.
const NARRATIVE: DossierBeat[] = [
  {
    kicker: "01 // FOCUS",
    heading: "Security & Investigation",
    paragraphs: [
      "I spend most of my time understanding how systems break, how people exploit them, and how they can be made more resilient.",
      "Drawn to the process of turning scattered information into something that actually makes sense.",
    ],
  },
  {
    kicker: "02 // PRACTICE",
    heading: "Student, Builder",
    paragraphs: [
      "Currently studying BCA in Cybersecurity while trying to learn considerably more than the curriculum requires. Working around real-world cybercrime and investigation environments with Police Cyber Cells.",
      "Most of my ideas don't stay ideas for very long. If something interests me, I usually end up building a prototype.",
    ],
  },
  {
    kicker: "03 // METHOD",
    heading: "How I Work",
    paragraphs: [
      "Linux is my preferred environment for breaking things, fixing things, and occasionally breaking them again. I value design—software should work exceptionally well and feel good to use.",
      "Driven by curiosity—turning simple questions into deep rabbit holes. Some of my most productive hours happen late at night when the world is quiet.",
    ],
  },
  {
    kicker: "04 // OFF_HOURS",
    heading: "Outside the Terminal",
    paragraphs: [
      "Gym & Training: my way of stepping away from screens and taking on challenges that can't be solved with another terminal command.",
      "Music switches off technical thinking. Constantly learning from researchers, developers, CTFs, open-source projects, and community members.",
    ],
  },
];

// Unchanged from the prior Credibility Log — same 4 verified records, same
// text. Only the presentation (grid of cards -> ruled ledger) changed.
const CREDIBILITY_LOG = [
  {
    id: "01",
    category: "Vulnerability Research",
    detail:
      "10+ responsibly disclosed web application security findings across established bug bounty programs, including Notion — focused on IDOR/BOLA, broken access control, privilege escalation, authentication/authorization, OAuth/OIDC, and API security.",
  },
  {
    id: "02",
    category: "CTF & Labs",
    detail:
      "TryHackMe Junior Penetration Tester, Advent of Cyber, Web Application Security Labs, Top 10% Ranking.",
  },
  {
    id: "03",
    category: "Cyber Investigation",
    detail:
      "Three government cybercrime internships — Rajasthan Police Headquarters, Amroha, and Police Commissionerate Agra — covering OSINT-based investigation, digital evidence handling, and cyber fraud complaint analysis.",
  },
  {
    id: "04",
    category: "Certifications & Training",
    detail:
      "Certified Ethical Hacker (CEH v13), Google Cybersecurity Professional Certificate, KAVACH 1.0 Cybersecurity Awareness Initiative.",
  },
];

export default function About() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // This route has no 3D scene of its own (see sceneRoutes.ts) — the lab
  // Canvas that normally sends this signal doesn't mount here, so the page
  // has to self-report ready or BootSequence's boot screen would wait
  // forever.
  //
  // Deferred a tick (matching horizon-hero-section.tsx's own established
  // pattern for this exact race): RouteTransition's {children} — this page
  // — mounts and its effects fire before BootSequence's own effect (which
  // attaches the render-ready listener) has committed, since BootSequence
  // is declared after {children} in layout.tsx. Calling this synchronously
  // let the event dispatch and get lost with nobody listening yet — caught
  // live (boot screen never cleared on /projects), not assumed.
  useEffect(() => {
    setTimeout(signalRenderReady, 0);
  }, []);

  return (
    <div
      ref={scrollRef}
      className="pointer-events-auto relative h-full w-full overflow-y-auto overflow-x-hidden bg-black scroll-smooth"
    >
      {/* Tuned slower/sparser/warmer than Projects' — About is the
          atmospheric, editorial register; Projects is the structured,
          technical one. Same engine, different feel, per the route design
          system's shared-tokens-different-tuning principle. */}
      {/* Nudged up from the first pass (which tested as too sparse to
          register) — still About's slower/warmer register relative to
          Projects, just with enough presence to actually read as a living
          background instead of a static void. */}
      <DataMeshBackground nodeCount={65} colorMix={0.6} driftSpeed={0.65} />
      {/* Was `-z-10` — sitting entirely behind the canvas, which repaints an
          opaque fill every frame, so this wash was never actually visible.
          `position: fixed` (no explicit z-index) still forms its own
          stacking context (fixed always does) at the same implicit tier as
          the canvas; DOM order (declared after the canvas, before every
          z-10/z-20 content wrapper) puts it above the canvas and below all
          real content, so the tint finally reads without risking painting
          over anything that relies on that same implicit ordering. */}
      {/* Bumped from `red-900/40 via-black to-black` — that combination was
          almost imperceptible (a muted dark red over an opaque black tail
          that also hid most of the mesh at the edges). This reuses the
          actual --accent-red-glow token at full strength with a transparent
          tail instead, so it reads as a real glow and the mesh stays
          visible everywhere outside the glow's core. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent-red-glow),_transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-24">
        <div className="mb-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            {/* Softened from "[ CLASSIFIED_OPERATOR_DOSSIER ]" — the council
                review flagged that label as an unearned tonal mismatch
                against genuinely casual, personal content below it.
                "Operator Profile" keeps the facility metaphor without the
                spy-movie theatrics. */}
            <p className="mb-3 flex items-center gap-3 font-mono text-[10px] tracking-[0.35em] text-red-500 uppercase">
              <span className="h-px w-8 bg-red-500/60" aria-hidden="true" />
              [ OPERATOR_PROFILE ]
            </p>
            <h1 className="text-5xl leading-[0.95] font-black tracking-tighter text-zinc-100 sm:text-7xl md:text-9xl break-words">
              VAIBHAV
              <br />
              JAIN
            </h1>
            {/* Reused verbatim from Guardian.tsx's own IDENTITY_CORE modal —
                the site's existing verified role line, not a new claim. */}
            <p className="mt-5 border-l-2 border-cyan-500/50 pl-4 font-mono text-xs sm:text-sm uppercase tracking-[0.2em] text-cyan-400/80">
              Systems Architect / Cybersecurity Developer
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center font-mono text-xs tracking-widest text-zinc-500 uppercase transition-colors hover:text-red-500 touch-manipulation"
          >
            [ &lt;&lt; BACK_TO_LAB ]
          </Link>
        </div>
      </div>

      {/* Narrative — sticky-stacking mechanism unchanged from the prior
          implementation (same CSS `sticky` + `top: calc(...)` cascade), only
          what's inside each stacked block changed (see StackingCard.tsx). */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-[20vh]">
        {NARRATIVE.map((beat, index) => (
          <div
            key={beat.heading}
            // bg-black + min-h here (not just on StackingCard's own tight
            // wrapper) — found live that a short/centered section's
            // sticky slot left uncovered space above/below its content,
            // through which the previous (lower-stacking-order but still
            // painted-first) section's tail text could peek during the
            // transition. A full-slot opaque backing closes that gap.
            className="sticky mb-[20vh] flex min-h-[70vh] w-full items-center bg-black"
            style={{ top: `calc(12vh + ${index * 18}px)` }}
          >
            <StackingCard beat={beat} index={index} />
          </div>
        ))}
      </div>

      {/* The shift itself is the trust signal: loose narrative above,
          resolving into a rigid, ruled, factual ledger below — a materially
          different visual register (mono, bordered rows, no prose) rather
          than another card in the same sequence. */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-32">
        <p className="mb-3 flex items-center gap-3 font-mono text-[10px] tracking-[0.35em] text-cyan-400 uppercase">
          <span className="h-px w-8 bg-cyan-400/60" aria-hidden="true" />
          [ VERIFIED_RECORD ]
        </p>
        <h2 className="mb-10 text-4xl font-black tracking-tighter text-zinc-100 md:text-5xl">
          Credibility Log
        </h2>
        <ul className="border-t border-zinc-800/80">
          {CREDIBILITY_LOG.map((entry) => (
            <li
              key={entry.id}
              className="group grid gap-2 border-b border-zinc-800/60 py-7 transition-colors sm:grid-cols-[3.5rem_1fr_2fr] sm:gap-8"
            >
              <span
                className="font-mono text-2xl font-bold text-zinc-800 transition-colors group-hover:text-cyan-500"
                aria-hidden="true"
              >
                {entry.id}
              </span>
              <h3 className="font-bold text-zinc-100">{entry.category}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{entry.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <MotionFooter />
    </div>
  );
}
