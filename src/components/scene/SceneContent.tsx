"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import type { Object3D, SpotLight as SpotLightImpl } from "three";
import EnvironmentArchitecture from "./EnvironmentArchitecture";
import Guardian from "./models/Guardian";
import Reactor from "./models/Reactor";
import Drone from "./models/Drone";
import Pillars from "./models/Pillars";
import Portal from "./models/Portal";
import type { FocusTarget } from "./models/types";

const MODEL_SCALE = 4;

const GUARDIAN_POSITION: [number, number, number] = [0, 0.08, 0];
// Composition correction pass: the previous compaction (see the old comment
// this replaced) claimed to fix top clipping but a real screenshot showed
// both Reactor and Portal's tops still at/above the viewport edge at
// BASE_ZOOM=70 — Portal (originally z=-4.6, only 1.3 units from BACK_WALL at
// z=-5.9) was living at background depth when it needs to read as midground.
// Pulled both toward Guardian (position only, scale/zoom untouched) and
// tuned across 3 build+screenshot iterations: z=-3.2 cleared the clip with
// large margin but visually overlapped Guardian's silhouette; z=-4.0
// reintroduced clipping; z=-3.8 is the confirmed sweet spot — clip-free with
// modest headroom. Kept in sync with EnvironmentArchitecture.tsx's
// MOUNT_POINTS/CONDUITS so pads and conduits stay attached to the moved
// models — not a conduit redesign, just keeping endpoints synced.
const REACTOR_POSITION: [number, number, number] = [-3.15, 0.08, -2.4];
const PORTAL_POSITION: [number, number, number] = [0, 0.08, -3.8];

// Matches --bg exactly so distant geometry fades into the same charcoal as
// the page background instead of a mismatched fog color.
const FOG_COLOR = "#08080c";

// Rakes down from the back-left server corner toward Guardian's pedestal.
// Uses the documented R3F pattern for light targets: an actual <object3D>
// in the scene graph (so it gets a proper matrixWorld every frame) assigned
// to the light imperatively, rather than the `target-position` shorthand,
// which only reliably works when the target is part of the render tree.
const SPOT_INTENSITY = 8;

function DramaticSpotlight({
  renderFadeRef,
}: {
  renderFadeRef: React.RefObject<number>;
}) {
  const lightRef = useRef<SpotLightImpl>(null);
  const targetRef = useRef<Object3D>(null);

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  // Starts at 0 (set on the JSX element below) and is driven up to
  // SPOT_INTENSITY by RenderGate's fade ramp — this is the light most
  // responsible for the cold-start red flash (colored, high-intensity,
  // castShadow), so it's the one that most needs to not be at full power
  // before its shadow map has actually been baked.
  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.intensity = SPOT_INTENSITY * (renderFadeRef.current ?? 0);
    }
  });

  return (
    <>
      <spotLight
        ref={lightRef}
        position={[-9, 9, -9]}
        angle={0.55}
        penumbra={0.75}
        intensity={0}
        distance={35}
        decay={1.5}
        color="#ff0033"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <object3D ref={targetRef} position={[0, 1.2, 0]} />
    </>
  );
}

export default function SceneContent({
  focus,
  onFocus,
  onClose,
  renderFadeRef,
}: {
  focus: FocusTarget | null;
  onFocus: (focus: FocusTarget) => void;
  onClose: () => void;
  renderFadeRef: React.RefObject<number>;
}) {
  return (
    <>
      {/* Exponential-squared falloff reads more natural than linear fog at
          this scale — density tuned so the room's edges (pillars/portal are
          the farthest set-pieces, ~8-10 units out) dissolve into the
          background rather than hard-clipping at a fixed plane. */}
      <fogExp2 attach="fog" args={[FOG_COLOR, 0.028]} />

      {/* Lowered from 0.75 (Conference Hall round 2, Phase 1) — flat high
          ambient was washing every surface to a similar value, flattening
          Guardian's own red key light into the same brightness tier as
          everything else and killing the platform's reflectivity as a
          depth cue. Tested incrementally at 0.25/0.20/0.15 with real
          screenshots — 0.15 dropped the pillars' and server walls' surface
          detail to flat near-black silhouettes (fails the "subtly readable"
          bar), so 0.20 is the lowest value that keeps chiaroscuro without
          losing legibility. */}
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.45}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <DramaticSpotlight renderFadeRef={renderFadeRef} />

      {/* Blob shadows pinning every model to the platform below — the
          platform itself (with its own mounting pads and conduits) lives in
          EnvironmentArchitecture.tsx now, replacing the old flat plane +
          Grid. */}
      {/* scale reduced from 20 -> 10 to stay inside the compacted, now
          back-offset platform (PLATFORM_SIZE 24 -> 14, PLATFORM_Z_OFFSET
          -1.2 in EnvironmentArchitecture.tsx) — at the old scale the
          shadow-catching plane extended past the platform's edge. */}
      <ContactShadows
        position={[0, 0.006, 0]}
        scale={10}
        opacity={0.8}
        blur={2}
        far={8}
        frames={1}
        color="#000000"
      />

      {/* Ambient dust */}
      <Sparkles
        count={120}
        scale={[20, 5, 20]}
        position={[0, 2, 0]}
        size={1.5}
        speed={0.2}
        opacity={0.35}
        color="#aab0c0"
      />

      {/* Procedural background architecture */}
      <EnvironmentArchitecture />

      {/* Guardian — centered on its pedestal, the IDENTITY_CORE terminal */}
      <Guardian
        position={GUARDIAN_POSITION}
        scale={MODEL_SCALE}
        isActive={focus?.key === "guardian"}
        onFocus={onFocus}
        onClose={onClose}
      />

      {/* Reactor — the TECH_STACK_ENGINE terminal */}
      <Reactor
        position={REACTOR_POSITION}
        scale={MODEL_SCALE}
        isActive={focus?.key === "reactor"}
        onFocus={onFocus}
        onClose={onClose}
      />

      {/* Drone — surveillance set-piece. Pulled in with the same ~65%
          compaction as Reactor/Portal, and raised slightly (1.2 -> 1.4) so
          it reads as hovering surveillance near the Guardian/Reactor
          cluster rather than parked off to the side. Now shares the same
          onFocus/onClose toggle + modal pattern as every other POI (see
          Drone.tsx) instead of a bare always-focus callback with no modal
          and no way back to idle. */}
      <Drone
        position={[3.3, 1.4, -2]}
        scale={MODEL_SCALE}
        isActive={focus?.key === "drone"}
        onFocus={onFocus}
        onClose={onClose}
      />

      {/* Pillars — grouped project display terminals */}
      <Pillars focus={focus} onFocus={onFocus} onClose={onClose} />

      {/* Portal — the SECURE_COMMS_GATEWAY contact terminal */}
      <Portal
        position={PORTAL_POSITION}
        scale={MODEL_SCALE}
        isActive={focus?.key === "portal"}
        onFocus={onFocus}
        onClose={onClose}
      />
    </>
  );
}
