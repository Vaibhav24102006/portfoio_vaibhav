"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function RouteTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative h-full w-full"
        >
          {children}

          {/* Scanline wipe — a fresh mount every route change, so it always
              sweeps top-to-bottom in lockstep with the incoming page. Purely
              decorative: pointer-events-none keeps it out of the way of the
              content it's sweeping over.

              Animates `y` (transform: translateY, GPU-composited) instead of
              the `top` property — a Chrome DevTools performance trace showed
              this element as the largest contributor to this page's CLS
              (11 layout-shift events, ~0.076 combined score) because
              animating `top` forces layout on every frame. `main` is
              `h-screen`, so vh units reproduce the same -4%→104% sweep
              distance the old percentage-of-parent `top` animation had. */}
          <motion.div
            aria-hidden
            initial={{ y: "-4vh" }}
            animate={{ y: "104vh" }}
            transition={{ duration: 0.28, ease: "easeIn" }}
            className="pointer-events-none absolute left-0 top-0 h-[2px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--accent-red) 50%, transparent)",
              boxShadow: "0 0 12px 2px var(--accent-red-glow)",
            }}
          />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
