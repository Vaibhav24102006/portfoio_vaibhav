"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

const CHARCOAL = "#16161c";
const CHARCOAL_DARK = "#0d0d11";
const ACCENT_RED = "#ff0033";
const ACCENT_CYAN = "#22e5ff";

// Shared material singletons for the platform/pads/conduits below. Each of
// these props is identical across every mesh that uses it, so one material
// instance is reused via <primitive attach="material"> instead of a fresh
// <meshStandardMaterial> JSX element per mesh. This matters beyond memory:
// gl.compile() (RenderGate.tsx) walks every mesh's material synchronously on
// mount, and while Three.js's own program cache already dedupes identical
// shader permutations, cutting the raw material *instance* count this much
// (rim 4→1, pad body 6→1, pad ring 6→1, conduit bed 8→1) measurably reduces
// that walk — this addition alone had roughly 4x'd the scene's material
// count over the flat-floor version it replaced.
const rimMaterial = new THREE.MeshStandardMaterial({
  color: ACCENT_RED,
  emissive: ACCENT_RED,
  emissiveIntensity: 1.1,
  toneMapped: false,
});

// Conference Hall round 2, Phase 6: metalness lowered from 0.75/roughness
// raised from 0.3 — same lesson as conduitBedMaterial's own earlier fix.
// 0.75 metalness gives almost no diffuse response to ambient light, so the
// pad only read under a specular highlight at the right grazing angle;
// under the Phase 1 ambient reduction (0.75->0.2) it went essentially
// invisible except directly under a model's own local light, which defeated
// the "dark inert housing you can actually see is there" language Phase 6
// asks for. Values now match floorSeamMaterial's family for a consistent
// housing tone across pads/seams.
const padBodyMaterial = new THREE.MeshStandardMaterial({
  color: "#2e3444",
  metalness: 0.3,
  roughness: 0.5,
});

// floorSeamMaterial: needs to read under plain ambient/directional light
// across the whole platform with no nearby local light source (unlike
// padBodyMaterial above, which at least sits near a locally-lit model).
// base color, same family as the conduit housing tone.
const floorSeamMaterial = new THREE.MeshStandardMaterial({
  color: "#3a4152",
  metalness: 0.25,
  roughness: 0.45,
});

// Bloom's luminanceThreshold sits at 0.75 (Effects.tsx) to keep the
// DramaticSpotlight's ambient wash from triggering it. A material's raw hex
// color rarely clears that on its own — boosting the color channel values
// past 1.0 (valid with toneMapped:false, same trick as POIHotspot's
// GLOW_COLOR) plus a high emissiveIntensity is what actually punches an
// emissive surface through the threshold reliably.
function boostedColor(hex: string, scalar: number): THREE.Color {
  return new THREE.Color(hex).multiplyScalar(scalar);
}

const PAD_RING_GLOW = boostedColor(ACCENT_RED, 3);

const padRingMaterial = new THREE.MeshStandardMaterial({
  color: PAD_RING_GLOW,
  emissive: PAD_RING_GLOW,
  emissiveIntensity: 3.5,
  toneMapped: false,
  side: THREE.DoubleSide,
});

// Color lifted from near-black (#050506, indistinguishable from the
// reflective floor beneath it) to a value that reads as a distinct metal
// channel via plain diffuse/specular shading alone — this is the actual
// fix for conduit legibility, not the emissive layer above it. Root cause
// (confirmed by reading the material, not guessed): ConduitSegment's
// emissiveMap is a mostly-transparent scrolling texture — outside the
// ~15%-wide traveling pulse band, it samples to black and multiplies the
// emissive color to zero, so for most of a conduit's length at any given
// instant there is no glow at all, only a moving glint. Emission was
// intentionally left untouched (per the "no neon roads" constraint); this
// gives the conduit a legible at-rest appearance independent of the pulse.
// ROOT CAUSE OF THE "CONDUITS ARE INVISIBLE" BUG (confirmed by bisecting the
// scene tree component-by-component down to a minimal repro, not guessed):
// Guardian's pedestal mesh (Guardian.tsx: local PEDESTAL_RADIUS=1.4, scaled
// by MODEL_SCALE=4 -> world radius ~5.6-6.2, world Y ~0.08-1.28) is an
// opaque, dark-gray (#3a3a44) disc that visually blends into the equally
// dark platform/fog and reads as empty floor in every screenshot — but it is
// still solid geometry that occludes anything drawn behind it. Any floor-
// level object anywhere within that ~6-unit radius of Guardian (which is
// most of the platform, since Guardian sits near its center) silently loses
// the z-test to this invisible-looking disc. Bisection: an isolated bright
// marker showed up in a scene with only EnvironmentArchitecture + the
// marker; it vanished the instant Guardian was reintroduced, at every XZ
// position within ~6 units of Guardian's origin, regardless of Guardian's
// own pedestal being nowhere near that position visually. Guardian.tsx's
// pedestal scale is out of scope to touch (standing constraint), so the fix
// is raising the conduit network above the pedestal's own Y range instead of
// tunneling under it.
const CONDUIT_Y = 1.4;

const conduitBedMaterial = new THREE.MeshStandardMaterial({
  color: "#121218",
  metalness: 0.5,
  roughness: 0.4,
});



// Two walls meeting at the room's back corner (-x, -z) — the "back-left"
// wall runs along x=-9 with z varying, the "back-right" wall runs along
// z=-9 with x varying. Kept a full unit inside the platform's true edge
// (±12) so nothing clips through it, and well clear of every model's
// footprint and every camera fly-in destination: IsometricCamera flies to
// focus position + FOCUS_OFFSET(8) on every axis, so the nearest fly-in
// target (Portal's) lands at (8, 8, 1) — nowhere near this back corner.
type ServerBank = { position: [number, number, number]; height: number; hasLight?: boolean };

// All X/Z coordinates in this file (walls, columns, mount points, conduits)
// are compacted to ~65% of their original radius from Guardian at the
// origin — matched to the same factor applied to Reactor/Portal/Drone
// (SceneContent.tsx) and the Pillars (Pillars.tsx). At the tighter
// BASE_ZOOM (IsometricCamera.tsx) the old ±9 wall radius fell almost
// entirely outside the viewport and read as isolated outlines rather than
// framing the lab — pulling everything in together keeps every mounting
// pad and conduit endpoint under its model while making the walls act as a
// visible perimeter again.
const LEFT_WALL: ServerBank[] = [
  { position: [-5.9, 0, -5.2], height: 6 },
  { position: [-5.9, 0, -3.6], height: 4.5, hasLight: true },
  { position: [-5.9, 0, -2], height: 7 },
  { position: [-5.9, 0, -0.3], height: 5, hasLight: true },
  { position: [-5.9, 0, 1.3], height: 6.5 },
  { position: [-5.9, 0, 2.9], height: 4, hasLight: true },
];

const BACK_WALL: ServerBank[] = [
  { position: [-4.2, 0, -5.9], height: 5.5, hasLight: true },
  { position: [-2.6, 0, -5.9], height: 7 },
  { position: [1.95, 0, -5.9], height: 6 },
  { position: [3.6, 0, -5.9], height: 4.5, hasLight: true },
  { position: [5.2, 0, -5.9], height: 6.5 },
];

// Corners and midpoints of the same two walls, taller than any server bank
// so they read as the room's actual structural skeleton. Height + distance
// from the idle camera (~24-30 units) puts most of each shaft well inside
// fogExp2's falloff, so tops dissolve into the charcoal without needing a
// height-based fog hack.
const COLUMNS: [number, number, number][] = [
  [-6, 0, -6],
  [-6, 0, 0],
  [0, 0, -6],
  [5.5, 0, -6],
];

// The raised obsidian platform every model sits on. Sized to comfortably
// enclose the server walls/columns above (±5.9/±6) with margin. Thickness is
// centered on PLATFORM_Y so the TOP face lands exactly at y=0 — the plane
// every model's own GROUND_OFFSET, ContactShadows, and the conduits below
// already assume is "the floor." Keeping that convention meant zero changes
// were needed anywhere else for the platform swap.
//
// Offset backward (-Z) rather than kept centered on Guardian: every real
// object in the scene (server walls, Reactor/Portal, the pillars) sits
// either at or behind the origin except the pillars, which only reach
// z=+3.25. A platform centered on the origin left a wide dead apron of bare
// floor between the pillars and the platform's near edge, toward the
// camera, with barely any payoff on the far edge where the walls already
// sit close to the origin. Shifting the whole slab back hugs the actual
// content instead of padding empty space on the camera-facing side.
const PLATFORM_SIZE = 14;
const PLATFORM_THICKNESS = 0.5;
const PLATFORM_Y = -PLATFORM_THICKNESS / 2;
const PLATFORM_Z_OFFSET = -1.2;

// Conference Hall round 2, Phase 4: a procedurally generated (runtime
// CanvasTexture, same technique as getFlowTexture above — no external asset
// file) tiling panel/seam pattern for the platform surface. Cached as a
// module-level singleton like flowTexture, since it's identical for every
// PlatformBase instance (there's only ever one, but this keeps the pattern
// consistent and avoids regenerating on remount). Painted mostly dark with
// subtle lighter seam lines and darker groove shadows so it reads as
// manufactured plating rather than a flat void, without introducing any new
// emissive detail — this is the "physical structure, non-emissive" layer
// the floor was missing entirely before.
let floorTexture: THREE.Texture | null = null;
function getFloorTexture(): THREE.Texture {
  if (floorTexture) return floorTexture;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0a0a0d";
  ctx.fillRect(0, 0, size, size);

  // 4x4 grid of large panel plates with a visible seam gap between them.
  const cols = 4;
  const cell = size / cols;
  const gap = 10;
  for (let row = 0; row < cols; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cell;
      const y = row * cell;
      // Groove shadow (darker) along the full seam width, then a thin
      // lighter highlight line offset toward one edge — fakes a beveled
      // panel edge catching directional light without real geometry.
      ctx.fillStyle = "#020203";
      ctx.fillRect(x, y, cell, gap);
      ctx.fillRect(x, y, gap, cell);
      ctx.fillStyle = "#232733";
      ctx.fillRect(x + gap, y + gap - 1.5, cell - gap, 1.5);
      ctx.fillRect(x + gap - 1.5, y + gap, 1.5, cell - gap);

      // Faint per-panel value variation so adjacent plates read as
      // distinct pieces, not one continuous surface with a grid drawn on
      // top — kept subtle (single-digit lightness delta) to stay dark/matte.
      const shade = (row * cols + col) % 3;
      ctx.fillStyle = shade === 0 ? "#0c0c10" : shade === 1 ? "#09090c" : "#0b0b0e";
      ctx.fillRect(x + gap, y + gap, cell - gap, cell - gap);
    }
  }

  floorTexture = new THREE.CanvasTexture(canvas);
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(PLATFORM_SIZE / 3.5, PLATFORM_SIZE / 3.5);
  return floorTexture;
}

function PlatformBase() {
  const half = PLATFORM_SIZE / 2 - 0.15;
  const rimY = 0.011;
  const seamSpan = PLATFORM_SIZE - 0.6;
  // Quarter-point grid lines dividing the platform into a 4x4 panel layout.
  const seamOffsets = [-PLATFORM_SIZE / 4, 0, PLATFORM_SIZE / 4];
  const floorMap = useMemo(() => getFloorTexture(), []);
  return (
    <group position={[0, 0, PLATFORM_Z_OFFSET]}>
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[PLATFORM_SIZE, 0.5, PLATFORM_SIZE]} />
        {/* roughnessMap reuses the runtime-generated panel/seam canvas — its
            lighter seam lines read as a slightly sharper local reflection,
            its darker groove as slightly more diffuse (see the shader math
            in MeshReflectorMaterial.js: reflectorRoughnessFactor *=
            roughnessMap.g, which does have a real, if subtle, effect on
            local blur). A `map` (diffuse texture) prop was tried first and
            reverted — verified in the material's own source that with
            mirror=1 the formula is diffuseColor * ((1-mirror) +
            reflection*mixStrength), so (1-mirror)=0 completely zeroes out
            any diffuse map's contribution; it was provably invisible, not
            just subtle, in a real screenshot. The seam lines below (real,
            non-reflective geometry) are what actually carries the "engraved
            plating" read — they aren't subject to that suppression since
            they're a separate material entirely. */}
        <MeshReflectorMaterial
          blur={[300, 100]}
          color="#020202"
          roughnessMap={floorMap}
          depthScale={1.2}
          maxDepthThreshold={1.4}
          metalness={0.9}
          minDepthThreshold={0.4}
          mirror={1}
          mixBlur={1}
          mixStrength={50}
          resolution={1024}
          roughness={0.15}
        />
      </mesh>

      {/* Panel seams — real geometry, not baked texture, specifically
          because MeshReflectorMaterial's mirror=1 math (see above) proved to
          structurally suppress any texture-based approach. A 4x4 grid (3
          lines per axis) reusing the existing padBodyMaterial (already a
          shared singleton, matte dark metal) — ordinary MeshStandardMaterial
          shading, so it responds normally to ambient/directional light
          regardless of the reflective floor beneath it. Bounded at 6 meshes
          total, well within the "no giant grid, no dozens of objects"
          constraint. */}
      {seamOffsets.map((offset, i) => (
        <mesh key={`seam-x-${i}`} position={[0, 0.009, offset]} material={floorSeamMaterial}>
          <boxGeometry args={[seamSpan, 0.02, 0.08]} />
        </mesh>
      ))}
      {seamOffsets.map((offset, i) => (
        <mesh key={`seam-z-${i}`} position={[offset, 0.009, 0]} material={floorSeamMaterial}>
          <boxGeometry args={[0.08, 0.02, seamSpan]} />
        </mesh>
      ))}

      {/* Etched red rim tracing the platform's outer edge */}
      <mesh position={[0, rimY, half]} material={rimMaterial}>
        <boxGeometry args={[PLATFORM_SIZE - 0.3, 0.01, 0.08]} />
      </mesh>
      <mesh position={[0, rimY, -half]} material={rimMaterial}>
        <boxGeometry args={[PLATFORM_SIZE - 0.3, 0.01, 0.08]} />
      </mesh>
      <mesh position={[half, rimY, 0]} material={rimMaterial}>
        <boxGeometry args={[0.08, 0.01, PLATFORM_SIZE - 0.3]} />
      </mesh>
      <mesh position={[-half, rimY, 0]} material={rimMaterial}>
        <boxGeometry args={[0.08, 0.01, PLATFORM_SIZE - 0.3]} />
      </mesh>
    </group>
  );
}

// One docking pad per grounded model (Guardian, Reactor, Portal, all 3
// Pillars) — Drone is deliberately excluded, same reasoning as its grounding
// exemption elsewhere: it's an intentionally-elevated flying set-piece, not
// something that docks into the platform. Radii are tuned by eye per model
// footprint, not derived from GLB bounding boxes on the X/Z axes (only Y was
// audited, for the earlier grounding fix).
// Composition correction pass: Reactor/Portal/Pillar positions pulled in
// toward Guardian in SceneContent.tsx/Pillars.tsx to fix real, confirmed top
// clipping and foreground crowding at BASE_ZOOM=70 — kept in sync here so
// pads stay attached to the moved models.
const MOUNT_POINTS: { position: [number, number]; radius: number }[] = [
  { position: [0, 0], radius: 2.2 }, // Guardian
  { position: [-3.15, -2.4], radius: 1.5 }, // Reactor
  { position: [0, -3.8], radius: 1.5 }, // Portal
  { position: [-3.8, 2.8], radius: 1.5 }, // Pillar 0
  { position: [0, 2.8], radius: 1.5 }, // Pillar 1
  { position: [3.8, 2.8], radius: 1.5 }, // Pillar 2
];

function MountingPad({ position, radius }: { position: [number, number]; radius: number }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.008, 0]} receiveShadow material={padBodyMaterial}>
        <cylinderGeometry args={[radius, radius, 0.02, 24]} />
      </mesh>
      <mesh position={[0, 0.019, 0]} rotation={[-Math.PI / 2, 0, 0]} material={padRingMaterial}>
        <ringGeometry args={[radius * 0.88, radius * 0.95, 32]} />
      </mesh>
    </group>
  );
}

// Attempted a Guardian-specific "hero ring" here (Phase 6/17 of the brief)
// and reverted it — recording why, since the next person touching this file
// will hit the same wall. Guardian.tsx's pedestal mesh is a direct child of
// its own `scale={4}` group, so PEDESTAL_RADIUS=1.4 renders at a **world**
// radius of ~5.6-6.2, not 1.4. Any ring tight enough to read as "Guardian's
// own platform" (radius ~3) sits entirely inside that footprint and is
// fully occluded — confirmed live by pushing the radius out to 7, where it
// became visible, then had to be reverted anyway because at that radius it
// sprawls past Guardian into the pillars/Reactor, which is a facility-wide
// perimeter, not a Guardian hero platform. Fixing this properly would mean
// touching Guardian.tsx's pedestal scale, which is out of this pass's scope.

const SEGMENT_GAP = 0.05;
const PANEL_EDGE_COLOR = "#4a4a55";

// Each tower is built from stacked panel segments (rather than one tall box)
// — EdgesGeometry only draws creases, so a single box's flat faces would
// never show internal division lines no matter how many segments its
// BoxGeometry has. Real seams between separate meshes are what actually
// reads as paneling.
function ServerUnit({ position, height, hasLight }: ServerBank) {
  const scale: [number, number, number] = [1.2, height, 1.2];
  const boxPosition: [number, number, number] = [position[0], height / 2, position[2]];

  return (
    <group>
      <mesh position={boxPosition}>
        <boxGeometry args={scale} />
        <meshStandardMaterial color="#131318" roughness={0.4} metalness={0.8} />
        <Edges color={PANEL_EDGE_COLOR} threshold={15} />
      </mesh>
      {hasLight && (
        <group position={position}>
          <LedArray height={height} />
        </group>
      )}
    </group>
  );
}

const LED_ROWS = 4;
const LED_COLS = 3;
const LED_COUNT = LED_ROWS * LED_COLS;

// A grid of tiny emissive boxes on one panel face, rendered as a single
// InstancedMesh (one draw call for all 12 LEDs instead of 12 separate
// meshes). Per-instance color is randomized once at mount — via
// instanceColor, not a per-instance animated uniform — so the array reads
// as "a cluster of independent status lights" without the cost of animating
// each one individually; a single shared material.emissiveIntensity pulse
// on top sells "actively processing" cheaply.
function LedArray({ height }: { height: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let i = 0;
    for (let r = 0; r < LED_ROWS; r++) {
      for (let c = 0; c < LED_COLS; c++) {
        dummy.position.set(
          (c - (LED_COLS - 1) / 2) * 0.16,
          height * 0.65 + (r - (LED_ROWS - 1) / 2) * 0.16,
          0.61
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        color.setRGB(0.7 + Math.random() * 0.3, 0, 0);
        mesh.setColorAt(i, color);
        i++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [height]);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.emissiveIntensity = 1.3 + Math.sin(clock.elapsedTime * 4 + phase) * 0.6;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, LED_COUNT]}>
      <boxGeometry args={[0.07, 0.07, 0.02]} />
      <meshStandardMaterial
        ref={materialRef}
        color={ACCENT_RED}
        emissive={ACCENT_RED}
        emissiveIntensity={1.5}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function StructuralColumn({ position }: { position: [number, number, number] }) {
  const height = 14;
  return (
    <mesh position={[position[0], height / 2, position[2]]} receiveShadow castShadow>
      <cylinderGeometry args={[0.5, 0.6, height, 12]} />
      {/* CHARCOAL, not CHARCOAL_DARK — at this thinness (0.5-0.6 radius) and
          distance, the darker shade was reading as a near-invisible thread
          rather than the room's structural skeleton it's meant to be
          (verified live via a zoomed screenshot). */}
      <meshStandardMaterial color={CHARCOAL} metalness={0.4} roughness={0.6} />
    </mesh>
  );
}

// Lazily-built, module-shared texture: a single soft white pulse-band on a
// transparent field, tiled along a segment's length and scrolled via
// texture.offset in useFrame. Cheaper than animating geometry or vertex
// colors, and is the standard trick for "flowing energy" on a static mesh.
let flowTexture: THREE.Texture | null = null;
function getFlowTexture(): THREE.Texture {
  if (flowTexture) return flowTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 8;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 64, 0);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.12, "rgba(255,255,255,1)");
  gradient.addColorStop(0.28, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 8);
  flowTexture = new THREE.CanvasTexture(canvas);
  flowTexture.wrapS = THREE.RepeatWrapping;
  flowTexture.wrapT = THREE.ClampToEdgeWrapping;
  return flowTexture;
}

// One straight, axis-aligned run of a motherboard conduit. MotherboardConduit
// below composes two of these (plus a via pad) into a right-angled trace —
// this component only ever draws a single leg.
function ConduitSegment({
  from,
  to,
  color,
}: {
  from: [number, number];
  to: [number, number];
  color: string;
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [x1, z1] = from;
  const [x2, z2] = to;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const rotationY = -Math.atan2(dz, dx);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const glowColor = useMemo(() => boostedColor(color, 2.5), [color]);

  const map = useMemo(() => {
    const texture = getFlowTexture().clone();
    texture.needsUpdate = true;
    texture.repeat.set(Math.max(1, length / 0.8), 1);
    return texture;
  }, [length]);

  useFrame(({ clock }, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    map.offset.x -= safeDelta * 0.6;
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 2.5 + Math.sin(clock.elapsedTime * 1.5 + phase) * 0.8;
    }
  });

  // Evenly spaced rivet-style studs along the run, in the segment's own
  // local (pre-rotation) space — a periodic raised/lit pattern the eye
  // picks up far more readily than one continuous low-relief strip does
  // against the reflective platform, without touching emissiveIntensity.
  // Endpoints excluded (they'd double up with the via pad / mount pad).
  // Computed before the length<0.01 early return — hooks can't be called
  // conditionally.
  const studCount = Math.max(0, Math.floor(length / 0.9) - 1);
  const studOffsets = useMemo(
    () =>
      Array.from({ length: studCount }, (_, i) => (i + 1) * (length / (studCount + 1)) - length / 2),
    [studCount, length]
  );

  if (length < 0.01) return null;

  return (
    <group position={[midX, 0, midZ]} rotation={[0, rotationY, 0]}>
      {/* Conference Hall round 2, Phase 2-3: the previous version's emissive
          channel occupied 0.65 of the 0.8-wide bed (81%) at intensity 5.0 —
          shape=glow is the arcade/neon signature regardless of exact hue,
          since the trace's silhouette WAS the glow's silhouette. Redesigned
          as a genuine housing: this base bed is now the dominant, wide, dark
          matte physical structure (unchanged dimensions/material — it was
          already doing its job of being inert and readable under ambient
          light). Y offset is CONDUIT_Y, not floor-level — see that
          constant's comment for why: floor-level conduit geometry anywhere
          near Guardian is invisibly occluded by its own pedestal. */}
      <mesh position={[0, CONDUIT_Y, 0]} material={conduitBedMaterial}>
        <boxGeometry args={[length, 0.1, 0.8]} />
      </mesh>
      {/* Two raised, non-emissive rails flanking the trace — reuses
          conduitBedMaterial (shared, no new material instance). Taller than
          the trace itself so they cast real shadow/highlight across it under
          the directional light, which is what sells "recessed channel" via
          shape+shadow rather than glow. Rails at z=+-0.28 (width 0.18 each)
          leave a 0.12-wide dark gap on each side of the trace before the
          rail's inner edge, then the trace itself, then the far gap and
          rail — a visible physical channel, not a line drawn on a slab. */}
      <mesh position={[0, CONDUIT_Y + 0.075, 0.28]} material={conduitBedMaterial}>
        <boxGeometry args={[length, 0.05, 0.18]} />
      </mesh>
      <mesh position={[0, CONDUIT_Y + 0.075, -0.28]} material={conduitBedMaterial}>
        <boxGeometry args={[length, 0.05, 0.18]} />
      </mesh>
      <mesh position={[0, CONDUIT_Y + 0.055, 0]}>
        {/* Narrowed from 0.65 (81% of the bed) to 0.14 (~17.5%) — the
            Conference Hall's target ratio (10-15% illuminated, 85-90%
            inert). Sits lower than the rail tops (CONDUIT_Y+0.1 vs this
            mesh's top at CONDUIT_Y+0.055+0.03/2=CONDUIT_Y+0.07) so it reads
            as recessed between them instead of proud of the surface. Base
            color/metalness/roughness unchanged from the prior fix (diffuse
            enough to register under ambient light without a specular
            grazing angle) — only width and, below, emissiveIntensity
            changed. */}
        <boxGeometry args={[length, 0.03, 0.14]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#2a2f3a"
          metalness={0.35}
          roughness={0.45}
          emissive={glowColor}
          emissiveIntensity={2.5}
          emissiveMap={map}
          toneMapped={false}
        />
      </mesh>
      {studOffsets.map((offset, i) => (
        <mesh key={i} position={[offset, CONDUIT_Y + 0.06, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.5}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// A right-angled, PCB-trace-style route between two points — one leg along
// X, one along Z, meeting at a corner via pad. Never a diagonal line, which
// is what actually reads as circuit routing rather than a cable. Runs at
// CONDUIT_Y (see that constant) — see its comment for the confirmed root
// cause of why floor-level geometry near Guardian was invisible.
function MotherboardConduit({
  from,
  to,
  color,
}: {
  from: [number, number];
  to: [number, number];
  color: string;
}) {
  const corner: [number, number] = [to[0], from[1]];
  return (
    <group>
      <ConduitSegment from={from} to={corner} color={color} />
      <ConduitSegment from={corner} to={to} color={color} />
      {/* Radius shrunk from 0.35 to 0.22 to match the trace's own new 0.14
          width — a via-pad that stayed oversized relative to the now-thin
          trace would have re-introduced the same "shape=glow" problem at
          the junction points specifically. Intensity kept at 5.0
          deliberately: junctions ARE meant to be the brightest single
          accent in the DARK HOUSING -> THIN TRACE -> bright junction
          hierarchy, in contrast to the trace itself. Y raised to sit above
          the rails' own top (CONDUIT_Y+0.1) so the pad reads as sitting on
          the housing, not buried under it. */}
      <mesh
        position={[corner[0], CONDUIT_Y + 0.11, corner[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.22, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={5.0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// One conduit per Pillar converging on Guardian's core (cyan — data flowing
// in), plus a red security/power spine running Reactor -> Guardian -> Portal.
// Drone gets its own cyan spur so every grounded/hovering object in the
// scene has at least one visible connection to the core — previously Portal
// and Drone had zero conduits touching them at all, which was the actual
// "reads as disconnected props" gap (confirmed by counting entries here, not
// assumed).
//
// Path geometry checked by hand against every other entry below plus
// LEFT_WALL/BACK_WALL/COLUMNS before adding, since MotherboardConduit only
// ever draws right-angle legs (never diagonal) and two legs sharing an axis
// would visibly overlap:
// - Reactor's existing leg runs along x=-3.3 (z: 0 -> -2.6); Drone's new leg
//   runs along x=+3.3 (z: 0 -> -2) — mirrored, opposite sides of x=0, no
//   overlap.
// - The 3 pillar conduits' final legs run along x=0 for z: 0 -> +3.4
//   (foreground side); the new Guardian->Portal spine runs along x=0 for
//   z: 0 -> -4.6 (background side) — opposite sides of z=0, meet only at
//   Guardian's own point, which is the intended hub.
// - Neither new leg's x/z range intersects any ServerUnit/StructuralColumn
//   position (walls at x=-5.9/z=-5.9, columns at the 4 COLUMNS entries).
// An earlier pass here concluded the 3 pillars' own GLB silhouettes (they're
// large — BASE_SCALE=3.4 in Pillars.tsx against 3.8-unit spacing) were what
// blocked a straight 2-segment path to Guardian, and routed each pillar's
// conduit through an extra bend to avoid the inter-pillar gap. That
// conclusion didn't hold up under a proper component-by-component bisection:
// the real occluder is Guardian's own pedestal (see CONDUIT_Y's comment),
// which the CONDUIT_Y raise now clears regardless of XZ routing. Reverted to
// the plain 2-segment MotherboardConduit every other conduit uses.
const CONDUITS: { from: [number, number]; to: [number, number]; color: string }[] = [
  { from: [-3.8, 2.8], to: [0, 0], color: ACCENT_CYAN },
  { from: [0, 2.8], to: [0, 0], color: ACCENT_CYAN },
  { from: [3.8, 2.8], to: [0, 0], color: ACCENT_CYAN },
  { from: [0, 0], to: [-3.15, -2.4], color: ACCENT_RED },
  { from: [0, 0], to: [3.3, -2], color: ACCENT_CYAN },
  { from: [0, 0], to: [0, -3.8], color: ACCENT_RED },
];

// Conference Hall round 2, Phase 5: bolt/rivet hardware detail, ONE shared
// instancedMesh (single draw call regardless of instance count) rather than
// individual React meshes. Placed at mounting-pad edges (cardinal points
// around each non-Guardian pad — Guardian's own pad is skipped: its radius
// sits close enough to the pedestal's own occlusion zone, documented on
// CONDUIT_Y above, that floor-level geometry there risked repeating that
// same invisible-occlusion bug) and at the 3 conduit junction points away
// from Guardian's exact origin (the pillar corner, and the Reactor/Drone
// corners). Kept intentionally small in count (29 total) and low-contrast —
// "discovered subconsciously," not a decorative bolt field.
const RIVET_POSITIONS: [number, number][] = (() => {
  const positions: [number, number][] = [];
  // Cardinal-point rivets around every mounting pad except Guardian's.
  for (const { position, radius } of MOUNT_POINTS) {
    if (position[0] === 0 && position[1] === 0) continue; // Guardian — skip
    const r = radius + 0.12;
    positions.push([position[0] + r, position[1]], [position[0] - r, position[1]]);
    positions.push([position[0], position[1] + r], [position[0], position[1] - r]);
  }
  // Junction clusters at the 3 non-Guardian conduit corners (kept in sync
  // with the composition-correction pass's moved CONDUITS entries above).
  for (const [cx, cz] of [
    [0, 2.8],
    [-3.15, 0],
    [3.3, 0],
  ] as [number, number][]) {
    positions.push([cx + 0.45, cz], [cx - 0.45, cz], [cx, cz + 0.45]);
  }
  return positions;
})();

function RivetField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    RIVET_POSITIONS.forEach(([x, z], i) => {
      dummy.position.set(x, 0.012, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RIVET_POSITIONS.length]} material={floorSeamMaterial}>
      <cylinderGeometry args={[0.05, 0.05, 0.025, 8]} />
    </instancedMesh>
  );
}

export default function EnvironmentArchitecture() {
  return (
    <>
      <PlatformBase />
      <RivetField />
      {MOUNT_POINTS.map((pad, i) => (
        <MountingPad key={`pad-${i}`} {...pad} />
      ))}
      {LEFT_WALL.map((bank, i) => (
        <ServerUnit key={`left-${i}`} {...bank} />
      ))}
      {BACK_WALL.map((bank, i) => (
        <ServerUnit key={`back-${i}`} {...bank} />
      ))}
      {COLUMNS.map((position, i) => (
        <StructuralColumn key={`col-${i}`} position={position} />
      ))}
      {CONDUITS.map((conduit, i) => (
        <MotherboardConduit key={`conduit-${i}`} {...conduit} />
      ))}
    </>
  );
}
