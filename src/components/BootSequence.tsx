"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "@react-three/drei";
import { RENDER_READY_EVENT } from "@/lib/renderReadyBridge";
import { ROUTES_WITH_OWN_SCENE } from "@/lib/sceneRoutes";

// Extra grace delay after render-ready fires before the boot screen lifts.
// RENDER_READY_EVENT only fires once RenderGate's own intensity fade has
// already finished (see RenderGate.tsx) — the scene is fully stable and at
// its final lighting by that point, so this is a pure hold, not a mask for
// anything still in flight.
const HOLD_MS = 400;

// Reveal transition once booted flips true. The scene behind it is already
// fully stable and fully lit, so this is purely a cosmetic dissolve — never
// a race with an in-progress lighting ramp.
const EXIT_DURATION_S = 0.5;

export default function BootSequence() {
  const pathname = usePathname();
  // Routes in this set never mount the lab's <Canvas>, so drei's
  // useProgress() has nothing to track there — progress sits at a
  // permanent 0 and would gate this boot screen open forever. Those routes
  // gate on renderReady alone (their own scene dispatches the same event).
  const hasOwnScene = ROUTES_WITH_OWN_SCENE.has(pathname);
  const { progress, item, active } = useProgress();
  const [booted, setBooted] = useState(false);
  // useProgress() only tracks asset loading (GLTFs, textures) — it has no
  // idea whether the renderer has shader-compiled, baked shadow maps, and
  // finished its own internal intensity fade-in yet. Without this gate the
  // boot screen could lift the instant assets finish loading, exposing
  // whatever cold-start GPU warm-up RenderGate exists to hide.
  const [renderReady, setRenderReady] = useState(false);

  useEffect(() => {
    const handleRenderReady = () => setRenderReady(true);
    window.addEventListener(RENDER_READY_EVENT, handleRenderReady);
    return () => window.removeEventListener(RENDER_READY_EVENT, handleRenderReady);
  }, []);

  useEffect(() => {
    if (!hasOwnScene && (progress < 100 || active)) return;
    if (!renderReady) return;
    const timeout = setTimeout(() => setBooted(true), HOLD_MS);
    return () => clearTimeout(timeout);
  }, [progress, active, renderReady, hasOwnScene]);

  return (
    <AnimatePresence>
      {!booted && (
        <motion.div
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: EXIT_DURATION_S, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg)]"
        >
          <div className="w-72 font-mono">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-red-500">
              [ SYSTEM_CORE // INITIALIZING ]
              <span className="blinking-cursor">_</span>
            </p>

            <div className="mb-2 h-[3px] w-full bg-zinc-900">
              <motion.div
                className="h-full bg-red-600"
                style={{ boxShadow: "0 0 8px 1px var(--accent-red-glow)" }}
                animate={{ width: `${Math.round(progress)}%` }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </div>

            <p className="text-[10px] tracking-widest text-zinc-500 uppercase">
              {Math.round(progress)}% —{" "}
              {item
                ? `LOADING ${item.split("/").pop()}`
                : !renderReady
                  ? "COMPILING RENDER PIPELINE"
                  : "STANDBY"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
