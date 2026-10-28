"use client";

import { useGLTF, Html } from "@react-three/drei";
import { useHoverInteraction } from "./useHoverInteraction";
import TerminalModal from "./TerminalModal";
import type { FocusTarget } from "./types";

const LABEL_Y = 0.5;
const KEY = "portal";
const GROUND_OFFSET = 0.5;

export default function Portal({
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
  const { scene } = useGLTF("/models/portal.glb");
  const { scale: hoverScale, handlers } = useHoverInteraction({
    isActive,
    onClick: () => (isActive ? onClose() : onFocus({ key: KEY, position })),
  });

  return (
    <group position={position} scale={scale}>
      <group scale={hoverScale} {...handlers}>
        <primitive object={scene} position={[0, GROUND_OFFSET, 0]} />

        {isActive && (
          <Html center position={[0, LABEL_Y + 0.15, 0]} zIndexRange={[40, 0]}>
            <TerminalModal title="[ SECURE_COMMS_GATEWAY ]" onClose={onClose}>
              <p className="mb-3 text-sm leading-relaxed text-zinc-300">
                Open to cybersecurity internships, bug bounty collaboration,
                and security-focused engineering work.
              </p>
              <div className="flex flex-col gap-1 font-mono text-xs uppercase tracking-widest">
                <a
                  href="mailto:vaibhavjain24102006@gmail.com"
                  className="inline-flex min-h-[44px] items-center text-red-500 transition-colors hover:text-red-400 touch-manipulation"
                >
                  Email →
                </a>
                <a
                  href="https://github.com/Vaibhav24102006"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-red-500 transition-colors hover:text-red-400 touch-manipulation"
                >
                  GitHub →
                </a>
                <a
                  href="https://www.linkedin.com/in/vaibhav-jain-56b0b8328"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-red-500 transition-colors hover:text-red-400 touch-manipulation"
                >
                  LinkedIn →
                </a>
              </div>
            </TerminalModal>
          </Html>
        )}
      </group>
    </group>
  );
}

useGLTF.preload("/models/portal.glb");
