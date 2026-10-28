"use client";

import { useGLTF, Html } from "@react-three/drei";
import { useHoverInteraction } from "./useHoverInteraction";
import TerminalModal from "./TerminalModal";
import type { FocusTarget } from "./types";

const LABEL_Y = 0.5;
const KEY = "reactor";
const GROUND_OFFSET = 0.5;

export default function Reactor({
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
  const { scene } = useGLTF("/models/reactor.glb");
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
            <TerminalModal title="[ TECH_STACK_ENGINE ]" onClose={onClose}>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Security &amp; Offensive Testing
              </p>
              <ul className="mb-3 space-y-1 text-sm leading-relaxed text-zinc-300">
                <li>OWASP Top 10, Web App Pentesting</li>
                <li>IDOR / Access Control, Auth Testing</li>
                <li>Burp Suite, Kali Linux, Nmap, Wireshark</li>
              </ul>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Engineering
              </p>
              <ul className="space-y-1 text-sm leading-relaxed text-zinc-300">
                <li>Python, JavaScript, React.js, Node.js</li>
                <li>Three.js / React Three Fiber, Next.js</li>
              </ul>
            </TerminalModal>
          </Html>
        )}
      </group>
    </group>
  );
}

useGLTF.preload("/models/reactor.glb");
