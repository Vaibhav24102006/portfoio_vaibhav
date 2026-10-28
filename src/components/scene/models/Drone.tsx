"use client";

import { useRef } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useHoverInteraction } from "./useHoverInteraction";
import TerminalModal from "./TerminalModal";
import type { FocusTarget } from "./types";

const LABEL_Y = 0.6;
const KEY = "drone";

// Slow yaw sweep, much lower frequency than any hover reaction, so the
// drone reads as an active surveillance sensor rather than a static prop —
// mutated directly on the ref every frame (not React state) to stay off the
// render loop, per R3F's own high-frequency-animation guidance.
const SCAN_SPEED = 0.35;
const SCAN_AMPLITUDE = 0.6;

export default function Drone({
  position,
  scale = 1,
  isActive = false,
  onFocus,
  onClose,
}: {
  position: [number, number, number];
  scale?: number;
  isActive?: boolean;
  onFocus: (focus: FocusTarget) => void;
  onClose: () => void;
}) {
  const { scene } = useGLTF("/models/drone.glb");
  const scanRef = useRef<Group>(null);
  // Matches every other POI's toggle pattern (Guardian/Reactor/Portal/
  // Pillars) — previously this called the raw onFocus prop with no toggle
  // and no modal, so a click DID fly the camera in (confirmed live via
  // direct camera-state instrumentation: zoom and position converged
  // exactly like every other POI), but nothing on screen ever confirmed it
  // and there was no way back to idle. The fly-in was never broken; the
  // missing modal/close was.
  const { scale: hoverScale, handlers } = useHoverInteraction({
    isActive,
    onClick: () => (isActive ? onClose() : onFocus({ key: KEY, position })),
  });

  useFrame((state) => {
    if (scanRef.current) {
      scanRef.current.rotation.y = Math.sin(state.clock.elapsedTime * SCAN_SPEED) * SCAN_AMPLITUDE;
    }
  });

  return (
    <group position={position} scale={scale}>
      <group ref={scanRef}>
        <group scale={hoverScale} {...handlers}>
          <primitive object={scene} />

          {isActive && (
            <Html center position={[0, LABEL_Y, 0]} zIndexRange={[40, 0]}>
              <TerminalModal title="[ SURVEILLANCE_UNIT ]" onClose={onClose}>
                <p className="text-sm leading-relaxed text-zinc-300">
                  A perimeter monitoring drone patrolling the facility — part of the lab&apos;s
                  passive surveillance layer, not an active terminal.
                </p>
              </TerminalModal>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/drone.glb");
