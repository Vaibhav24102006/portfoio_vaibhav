"use client";

import { useGLTF, Html } from "@react-three/drei";
import { useHoverInteraction } from "./useHoverInteraction";
import TerminalModal from "./TerminalModal";
import { requestNavigation } from "@/lib/navigationBridge";
import type { FocusTarget } from "./types";

const PEDESTAL_HEIGHT = 0.3;
const PEDESTAL_RADIUS = 1.4;
const GROUND_OFFSET = 0.4353;
const LABEL_Y = 0.2;
const KEY = "guardian";

export default function Guardian({
  position,
  scale = 1,
  isActive,
  onFocus,
  onClose,
}: {
  position: [number, number, number];
  scale?: number;
  isActive: boolean;
  onFocus: (focus: FocusTarget) => void;
  onClose: () => void;
}) {
  const { scene } = useGLTF("/models/guardian.glb");
  const { scale: hoverScale, handlers } = useHoverInteraction({
    isActive,
    onClick: () => (isActive ? onClose() : onFocus({ key: KEY, position })),
  });

  return (
    <group position={position} scale={scale}>
      {/* Pedestal */}
      <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[PEDESTAL_RADIUS, PEDESTAL_RADIUS * 1.1, PEDESTAL_HEIGHT, 8]} />
        <meshStandardMaterial color="#3a3a44" metalness={0.6} roughness={0.4} />
      </mesh>

      <group position={[0, PEDESTAL_HEIGHT, 0]} scale={hoverScale} {...handlers}>
        <primitive object={scene} position={[0, GROUND_OFFSET, 0]} />

        {isActive && (
          <Html center position={[0, LABEL_Y + 0.15, 0]} zIndexRange={[40, 0]}>
            <TerminalModal title="[ IDENTITY_CORE ]" onClose={onClose}>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Systems Architect / Cybersecurity Developer
              </p>
              <p className="mb-4 text-sm leading-relaxed text-zinc-300">
                Vaibhav Jain — building secure systems, intelligent defenses,
                and interactive digital experiences at the intersection of AI
                security and full-stack engineering.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  requestNavigation("/about");
                }}
                className="inline-flex min-h-[44px] items-center cursor-pointer font-mono text-xs uppercase tracking-widest text-red-500 transition-colors hover:text-red-400 touch-manipulation"
              >
                [ INITIATE_FULL_BIO ]
              </button>
            </TerminalModal>
          </Html>
        )}
      </group>
    </group>
  );
}

useGLTF.preload("/models/guardian.glb");
