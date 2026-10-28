"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { signalRenderReady } from "@/lib/renderReadyBridge";

// Real frames (not wall-clock time) to let tick by after gl.compile() before
// starting the intensity fade. gl.compile() only pre-links shader programs —
// it does NOT bake shadow maps, and PCFShadowMap-cast light/occluder
// geometry can take a handful of frames to fully converge on a cold GPU.
// Counting frames rather than ms keeps this correct regardless of monitor
// refresh rate or a slow first frame.
const SETTLE_FRAMES = 12;

// Wall-clock cap on the settle phase, independent of SETTLE_FRAMES. On a
// healthy machine 12 frames land well under this (12 frames at even a rough
// 30fps is 400ms), so the cap never engages. It exists because frame COUNT
// is a bad proxy for "converged" when the frame RATE itself is depressed —
// a heavier scene makes each settle frame slower, so a purely frame-count
// gate compounds under load instead of adapting to it. This bounds worst-
// case cold-start latency instead of leaving the boot screen up
// indefinitely while frames trickle in one at a time.
const SETTLE_TIMEOUT_MS = 800;

const FADE_MS = 500;

// Rendered as the last child of the same <Suspense> boundary as
// SceneContent, so React only mounts it once every useGLTF() call inside
// SceneContent has resolved — the full model + material graph already
// exists in the scene by the time this component's effect runs.
//
// Deliberately does NOT call signalRenderReady() until renderFadeRef has
// already reached 1. BootSequence never lifts before that signal, so the
// entire intensity ramp — and whatever shadow-map/composer warm-up
// artifacts happen during it — is guaranteed to run fully hidden behind the
// opaque boot overlay. Only a single, already-stable final frame is ever
// revealed; there is no window where a partially-faded frame is visible.
export default function RenderGate({
  renderFadeRef,
}: {
  renderFadeRef: React.RefObject<number>;
}) {
  const { gl, scene, camera } = useThree();
  const frameCountRef = useRef(0);
  const settleStartRef = useRef<number | null>(null);
  const fadeStartRef = useRef<number | null>(null);
  const signaledRef = useRef(false);

  useEffect(() => {
    // Pre-compiles every material's shader program against the current
    // renderer/scene state up front, so the settle frames below spend their
    // time on shadow-map/composer convergence instead of also paying for
    // on-the-fly shader compilation in the same frame.
    gl.compile(scene, camera);
  }, [gl, scene, camera]);

  useFrame(() => {
    if (signaledRef.current) return;

    if (settleStartRef.current === null) {
      settleStartRef.current = performance.now();
    }

    const settling =
      frameCountRef.current < SETTLE_FRAMES &&
      performance.now() - settleStartRef.current < SETTLE_TIMEOUT_MS;

    if (settling) {
      frameCountRef.current += 1;
      renderFadeRef.current = 0;
      return;
    }

    if (fadeStartRef.current === null) {
      fadeStartRef.current = performance.now();
    }

    const elapsed = performance.now() - fadeStartRef.current;
    const fade = Math.min(1, elapsed / FADE_MS);
    renderFadeRef.current = fade;

    if (fade >= 1) {
      signaledRef.current = true;
      signalRenderReady();
    }
  });

  return null;
}
