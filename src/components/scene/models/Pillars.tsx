"use client";

import { useGLTF, Clone, Html } from "@react-three/drei";
import { useHoverInteraction } from "./useHoverInteraction";
import PillarModal, { type Project } from "./PillarModal";
import type { FocusTarget } from "./types";

// Reduced from 4 (Guardian's own MODEL_SCALE in SceneContent.tsx) — with an
// orthographic camera, apparent size is pure per-object scale, no
// perspective foreshortening to lean on. Three pillars at the same scale as
// one Guardian gave the cluster noticeably more combined visual weight than
// the identity figure in the scene's default hero framing — verified live,
// not assumed. This is a composition fix (Guardian should read as the focal
// point), not a claim that the pillars themselves were too large.
const BASE_SCALE = 3.4;
const LABEL_Y = 0.5;
const GROUND_OFFSET = 0.4636;

// Sourced from Vaibhav's actual resume (Vaibhav_Jain_Updated_Resume_v3_Bug_Bounty.pdf).
// The other 4 real projects (Angle Bot, Fit India, Oasis, Cyberpunk WebGL
// Portfolio itself) live on the full /projects archive — these 3 are the
// most concrete, security-relevant work, kept to 3 to match the existing
// pillar layout.
// Arranged in a straight row (matching the requested "three distinct
// records" layout), evenly spaced at BASE_SCALE=3.4 with a real,
// measured gap — not guessed. pillar.glb's own bounding box (queried live
// via GLTFLoader against the actual file: size ~[0.976, 0.927, 1.0]) gives
// a world footprint of ~3.32 x 3.4 at this scale, so adjacent centers were
// only ~2.04 apart before this fix (footprint 3.4, so they visibly
// overlapped). 3.8 center-to-center spacing (X axis, unchanged) leaves a
// deliberate ~0.4-unit gap between bounding boxes. Z pulled in from 3.4 to
// 2.8 in the composition-correction pass — a real screenshot showed the row
// occupying nearly the entire lower half of the default viewport; this is
// a position-only change, BASE_SCALE is untouched. Kept in sync with this
// cluster's MOUNT_POINTS/CONDUITS in EnvironmentArchitecture.tsx.
const PILLARS: { position: [number, number, number]; project: Project }[] = [
  {
    position: [-3.8, 0.08, 2.8],
    project: {
      title: "AI-Assisted Cyber Crime Complaint Analysis System",
      org: "Rajasthan Police Headquarters, Cyber Crime Branch",
      stack: "Python, Offline OCR, Entity Extraction",
      description:
        "Built during a government cybersecurity internship — structured cyber-complaint analysis, offline OCR processing, and entity extraction for investigator-ready reporting.",
    },
  },
  {
    position: [0, 0.08, 2.8],
    project: {
      title: "OSINT-Based Cyber Investigation Support Tool",
      org: "Cyber Cell, Police Commissionerate Agra",
      stack: "Python, OSINT",
      description:
        "Built during a government cybersecurity internship — processes phone numbers, emails, and IP addresses to support structured intelligence gathering for investigators.",
    },
  },
  {
    position: [3.8, 0.08, 2.8],
    project: {
      title: "Photo Forensics Tool",
      org: "Personal project — in development",
      stack: "Digital Image Forensics",
      description:
        "A digital image forensics tool to detect metadata tampering and manipulation anomalies for digital evidence validation.",
    },
  },
];

function Pillar({
  index,
  position,
  project,
  isActive,
  onFocus,
  onClose,
}: {
  index: number;
  position: [number, number, number];
  project: Project;
  isActive: boolean;
  onFocus: (focus: FocusTarget) => void;
  onClose: () => void;
}) {
  const { scene } = useGLTF("/models/pillar.glb");
  const key = `pillar-${index}`;
  const { scale, handlers } = useHoverInteraction({
    isActive,
    onClick: () => (isActive ? onClose() : onFocus({ key, position })),
  });

  return (
    <group position={position} scale={BASE_SCALE * scale} {...handlers}>
      <Clone object={scene} position={[0, GROUND_OFFSET, 0]} />

      {isActive && (
        <Html center position={[0, LABEL_Y + 0.15, 0]} zIndexRange={[40, 0]}>
          <PillarModal project={project} onClose={onClose} />
        </Html>
      )}
    </group>
  );
}

export default function Pillars({
  focus,
  onFocus,
  onClose,
}: {
  focus: FocusTarget | null;
  onFocus: (focus: FocusTarget) => void;
  onClose: () => void;
}) {
  return (
    <>
      {PILLARS.map(({ position, project }, i) => (
        <Pillar
          key={i}
          index={i}
          position={position}
          project={project}
          isActive={focus?.key === `pillar-${i}`}
          onFocus={onFocus}
          onClose={onClose}
        />
      ))}
    </>
  );
}

useGLTF.preload("/models/pillar.glb");
