"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

// Second pass, restarted after visual comparison against the actual Ruixen
// CardStack reference (github.com/... via 21st.dev/@ruixen.ui/card-stack —
// inspected live, not guessed): the reference's active card is ~95% image
// with a two-line title/tagline overlay confined to the bottom-left corner
// behind a shallow gradient; neighboring cards overlap heavily (~65%),
// rotate ~15deg each step, and carry no border/HUD chrome — shadow alone
// separates them from the black backdrop. The first pass here inverted that
// hierarchy (dense text panel, small card, big background). This version
// adapts the reference's actual proportions/behavior to real project data
// instead of luxury-car Unsplash imagery.
export type ProjectRecord = {
  id: string | number;
  title: string;
  category: string;
  objective: string;
  /** Short (<=90 char) on-card tagline — a trimmed excerpt of `objective`, never new copy. */
  tagline: string;
  stack?: string;
  /** Real organizational context (e.g. an internship host), preserved from the verified record even though this pass doesn't render it on-card. */
  context?: string;
  status: "PUBLIC REPOSITORY" | "IN DEVELOPMENT — NO PUBLIC REPOSITORY" | "NO PUBLIC REPOSITORY";
  /** Real screenshot only. Absent renders a clean, minimal "coming soon" panel, not a dense fallback. */
  imageSrc?: string;
  link?: string;
  demo?: string;
};

export type CardStackProps = {
  items: ProjectRecord[];
  initialIndex?: number;
  maxVisible?: number;
  cardWidth?: number;
  cardHeight?: number;
  overlap?: number;
  spreadDeg?: number;
  perspectivePx?: number;
  depthPx?: number;
  tiltXDeg?: number;
  activeLiftPx?: number;
  activeScale?: number;
  inactiveScale?: number;
  springStiffness?: number;
  springDamping?: number;
  loop?: boolean;
  className?: string;
  onChangeIndex?: (index: number, item: ProjectRecord) => void;
};

function wrapIndex(n: number, len: number) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

function signedOffset(i: number, active: number, len: number, loop: boolean) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

export function CardStack({
  items,
  initialIndex = 0,
  maxVisible = 5,
  // Tuned against the real reference (measured from a live screenshot, not
  // defaults): ~1.7:1 landscape, heavy overlap, ~15deg rotation per step,
  // shallow depth/tilt so the fan reads as premium rather than a carnival
  // spread.
  cardWidth = 600,
  cardHeight = 350,
  overlap = 0.65,
  spreadDeg = 30,
  perspectivePx = 1400,
  depthPx = 90,
  tiltXDeg = 5,
  activeLiftPx = 10,
  activeScale = 1.05,
  inactiveScale = 0.93,
  springStiffness = 260,
  springDamping = 28,
  loop = true,
  className,
  onChangeIndex,
}: CardStackProps) {
  const reduceMotion = useReducedMotion();
  const len = items.length;

  const [active, setActive] = React.useState(() => wrapIndex(initialIndex, len));

  React.useEffect(() => {
    setActive((a) => wrapIndex(a, len));
  }, [len]);

  React.useEffect(() => {
    if (!len) return;
    onChangeIndex?.(active, items[active]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const canGoPrev = loop || active > 0;
  const canGoNext = loop || active < len - 1;

  const prev = React.useCallback(() => {
    if (!len || !canGoPrev) return;
    setActive((a) => wrapIndex(a - 1, len));
  }, [canGoPrev, len]);

  const next = React.useCallback(() => {
    if (!len || !canGoNext) return;
    setActive((a) => wrapIndex(a + 1, len));
  }, [canGoNext, len]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  if (!len) return null;

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative w-full outline-none"
        style={{ height: Math.max(420, cardHeight + 70) }}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Project records"
        onKeyDown={onKeyDown}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: `${perspectivePx}px` }}
        >
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, active, len, loop);
              const abs = Math.abs(off);
              const visible = abs <= maxOffset;
              if (!visible) return null;

              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const z = -abs * depthPx;
              const isActive = off === 0;
              const scale = isActive ? activeScale : inactiveScale;
              const lift = isActive ? -activeLiftPx : 0;
              const rotateX = isActive ? 0 : tiltXDeg;
              const zIndex = 100 - abs;

              const dragProps = isActive
                ? {
                    drag: "x" as const,
                    dragConstraints: { left: 0, right: 0 },
                    dragElastic: 0.18,
                    onDragEnd: (_e: unknown, info: PanInfo) => {
                      if (reduceMotion) return;
                      const travel = info.offset.x;
                      const v = info.velocity.x;
                      const threshold = Math.min(140, cardWidth * 0.22);
                      if (travel > threshold || v > 650) prev();
                      else if (travel < -threshold || v < -650) next();
                    },
                  }
                : {};

              return (
                <motion.div
                  key={item.id}
                  className={cn(
                    "absolute overflow-hidden rounded-lg will-change-transform select-none",
                    isActive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                  )}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    zIndex,
                    boxShadow: isActive
                      ? "0 30px 70px -18px rgba(0,0,0,0.85)"
                      : "0 20px 45px -18px rgba(0,0,0,0.8)",
                    transformStyle: "preserve-3d",
                  }}
                  initial={reduceMotion ? false : { opacity: 0, x, rotateZ, rotateX, scale }}
                  animate={{ opacity: isActive ? 1 : 0.82, x, y: lift, rotateZ, rotateX, scale }}
                  transition={{ type: "spring", stiffness: springStiffness, damping: springDamping }}
                  onClick={() => setActive(i)}
                  role="button"
                  aria-label={`${item.title} — record ${i + 1} of ${len}${isActive ? " (active)" : ""}`}
                  aria-current={isActive}
                  {...dragProps}
                >
                  <div
                    className="h-full w-full"
                    style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}
                  >
                    <ProjectFanCard item={item} active={isActive} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <CardStackControls active={active} onPrev={prev} onNext={next} />
    </div>
  );
}

function CardStackControls({
  active,
  onPrev,
  onNext,
}: {
  active: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-center gap-5">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous project"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-zinc-800 p-3 text-zinc-400 transition-colors hover:border-cyan-500/50 hover:text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 touch-manipulation"
      >
        <ArrowLeft size={16} />
      </button>
      <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
        Project {String(active + 1).padStart(2, "0")}
      </span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next project"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-zinc-800 p-3 text-zinc-400 transition-colors hover:border-cyan-500/50 hover:text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 touch-manipulation"
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

// The image (or, until one exists, a clean minimal placeholder) IS the
// card — no metadata panel, no footer strip. A two-line title/tagline sits
// in the bottom-left corner behind a shallow gradient, matching the
// reference's actual proportions instead of a dense info-card treatment.
export function ProjectFanCard({ item, active }: { item: ProjectRecord; active: boolean }) {
  const hasImage = !!item.imageSrc;

  return (
    <div className="relative h-full w-full bg-zinc-950">
      {hasImage ? (
        <Image
          src={item.imageSrc!}
          alt={`${item.title} — project screenshot`}
          fill
          sizes="(max-width: 768px) 92vw, 600px"
          className="object-cover"
          priority={active}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center border border-dashed border-zinc-800">
          <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-700 uppercase">
            Screenshot coming soon
          </span>
        </div>
      )}

      {/* Shallow, corner-only gradient — the reference keeps the image
          legible almost everywhere; this only darkens enough for the title
          to read, not a wash over the whole card. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      <div className="absolute bottom-0 left-0 p-4 md:p-5">
        <h3 className="text-base leading-tight font-semibold text-white md:text-lg">
          {item.title}
        </h3>
        <p className="mt-1 max-w-[85%] text-xs leading-snug text-white/75 md:text-sm">
          {item.tagline}
        </p>
      </div>
    </div>
  );
}

// Mobile: one full-width card at a time, no fan — the desktop geometry
// can't degrade gracefully at narrow widths, so this is a distinct simpler
// layout, not a squeeze. aspect-video keeps the screenshot large/readable
// at any viewport width instead of a fixed pixel box.
export function MobileProjectStack({
  items,
  className,
  onChangeIndex,
}: {
  items: ProjectRecord[];
  className?: string;
  onChangeIndex?: (index: number, item: ProjectRecord) => void;
}) {
  const reduceMotion = useReducedMotion();
  const len = items.length;
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (!len) return;
    onChangeIndex?.(active, items[active]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const prev = () => setActive((a) => wrapIndex(a - 1, len));
  const next = () => setActive((a) => wrapIndex(a + 1, len));

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (reduceMotion) return;
    if (info.offset.x > 70 || info.velocity.x > 500) prev();
    else if (info.offset.x < -70 || info.velocity.x < -500) next();
  };

  if (!len) return null;
  const item = items[active]!;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={item.id}
            className="h-full w-full overflow-hidden rounded-lg"
            style={{ boxShadow: "0 20px 50px -16px rgba(0,0,0,0.75)" }}
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
          >
            <ProjectFanCard item={item} active />
          </motion.div>
        </AnimatePresence>
      </div>

      <CardStackControls active={active} onPrev={prev} onNext={next} />
    </div>
  );
}
