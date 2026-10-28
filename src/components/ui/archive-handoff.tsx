"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";

// Replaces the old END_OF_ARCHIVE footer (eyebrow + headline + two flat
// buttons on empty black) with a single deliberate closing scene: a thin
// SVG "aperture" — concentric rings, tick marks, a few orbital markers, a
// vertical signal line that draws downward once in view — behind the
// closing copy. Pure SVG/CSS/Framer Motion, no new dependencies, no WebGL.
// All copy below is the user's own supplied direction verbatim; the
// ARCHIVE_STATUS/CHANNEL/ACCESS/HANDOFF labels are explicitly-authorized
// interface atmosphere, not security claims — no invented statistics,
// certifications, or achievements.

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.16, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const ringFade: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut" } },
};

const tickFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const drawLine: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.9, ease: "easeInOut" } },
};

// 12 ticks at 30deg spacing, radius 190 (outer edge) inward to 178 — precomputed, not runtime trig.
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  const x1 = 200 + 190 * Math.sin(angle);
  const y1 = 200 - 190 * Math.cos(angle);
  const x2 = 200 + 178 * Math.sin(angle);
  const y2 = 200 - 178 * Math.cos(angle);
  return { x1, y1, x2, y2 };
});

// A handful of orbital markers at hand-picked (not evenly spaced) angles on
// the mid ring — reads as an instrument, not a clock face.
const MARKERS = [
  { deg: 24, accent: "red" as const },
  { deg: 100, accent: "cyan" as const },
  { deg: 168, accent: "cyan" as const },
  { deg: 232, accent: "red" as const },
  { deg: 305, accent: "cyan" as const },
];

const MICRO_LABELS = [
  { label: "ARCHIVE_STATUS", value: "CLOSED", pos: "left-0 top-0 items-start text-left" },
  { label: "CHANNEL", value: "SECURE", pos: "right-0 top-0 items-end text-right" },
  { label: "ACCESS", value: "VERIFIED", pos: "left-0 bottom-0 items-start text-left" },
  { label: "HANDOFF", value: "READY", pos: "right-0 bottom-0 items-end text-right" },
];

function markerPoint(deg: number, r: number) {
  const angle = (deg * Math.PI) / 180;
  return { x: 200 + r * Math.sin(angle), y: 200 - r * Math.cos(angle) };
}

export function ArchiveHandoff() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-28 md:py-40">
      {/* Faint atmosphere so the section doesn't disappear into pure black —
          not a grid, not a wash, just enough to read as a lit space. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--accent-red-glow),_transparent_60%)] opacity-[0.05]" />

      <motion.div
        className="relative z-10 mx-auto flex max-w-xl flex-col items-center px-6 text-center"
        initial={reduceMotion ? "visible" : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={container}
      >
        <motion.p
          variants={fadeUp}
          className="font-mono text-[10px] tracking-[0.35em] text-red-500 uppercase"
        >
          [ END_OF_ARCHIVE ]
        </motion.p>

        <div className="relative my-6 flex h-[300px] w-[300px] items-center justify-center md:h-[520px] md:w-[520px]">
          <svg
            viewBox="0 0 400 400"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="handoff-line" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34,229,255,0)" />
                <stop offset="50%" stopColor="rgba(34,229,255,0.35)" />
                <stop offset="100%" stopColor="rgba(34,229,255,0)" />
              </linearGradient>
            </defs>

            <motion.circle
              cx="200"
              cy="200"
              r="190"
              fill="none"
              stroke="rgba(63,63,70,0.5)"
              strokeWidth="1"
              variants={ringFade}
              style={{ transformOrigin: "50% 50%" }}
            />
            <motion.circle
              cx="200"
              cy="200"
              r="155"
              fill="none"
              stroke="rgba(63,63,70,0.35)"
              strokeWidth="1"
              strokeDasharray="2 6"
              variants={ringFade}
              style={{ transformOrigin: "50% 50%" }}
            />
            <motion.circle
              cx="200"
              cy="200"
              r="120"
              fill="none"
              stroke="rgba(255,0,51,0.15)"
              strokeWidth="1"
              variants={ringFade}
              style={{ transformOrigin: "50% 50%" }}
            />

            <motion.g variants={tickFade}>
              {TICKS.map((t, i) => (
                <line
                  key={i}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke="rgba(82,82,91,0.5)"
                  strokeWidth="1"
                />
              ))}
            </motion.g>

            {MARKERS.map((m, i) => {
              const p = markerPoint(m.deg, 155);
              return (
                <motion.circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="2.5"
                  fill={m.accent === "red" ? "rgba(255,0,51,0.7)" : "rgba(34,229,255,0.6)"}
                  variants={tickFade}
                />
              );
            })}

            <motion.line
              x1="200"
              y1="14"
              x2="200"
              y2="386"
              stroke="url(#handoff-line)"
              strokeWidth="1.5"
              variants={reduceMotion ? tickFade : drawLine}
            />
          </svg>

          {MICRO_LABELS.map(({ label, value, pos }) => (
            <div
              key={label}
              className={`absolute hidden flex-col gap-0.5 font-mono text-[9px] tracking-[0.2em] text-zinc-600 uppercase md:flex ${pos}`}
            >
              <span>{label}</span>
              <span className="text-zinc-500">{value}</span>
            </div>
          ))}

          <motion.div variants={fadeUp} className="relative z-10 flex flex-col items-center gap-3 px-8">
            <h2 className="text-2xl leading-[1.05] font-black tracking-tight text-zinc-100 uppercase md:text-4xl">
              The Archive Ends Here.
              <br />
              The Work Doesn&apos;t.
            </h2>
            <p className="max-w-xs text-xs leading-relaxed text-zinc-500 md:text-sm">
              Six systems. One security-focused practice.
              <br />
              Explore the operator behind the work.
            </p>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="mt-2 flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/about"
            className="border-b border-zinc-700 pb-1 font-mono text-xs tracking-[0.2em] text-zinc-300 uppercase transition-colors hover:border-red-500 hover:text-red-400"
          >
            Operator Dossier
          </Link>
          <a
            href="mailto:vaibhavjain24102006@gmail.com"
            className="rounded-sm border border-red-500/40 bg-red-500/10 px-4 py-1.5 font-mono text-xs tracking-[0.2em] text-red-400 uppercase transition-colors hover:bg-red-500/20"
          >
            Establish Contact
          </a>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-7 flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-zinc-600 uppercase"
        >
          <span className="h-1 w-1 rounded-full bg-cyan-400" aria-hidden="true" />
          Connection Ready
        </motion.p>
      </motion.div>
    </section>
  );
}
