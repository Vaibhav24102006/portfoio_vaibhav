"use client";

import { useEffect, useRef } from "react";

const VOID_COLOR = "#050505";
const NODE_COLOR = "rgba(180, 186, 200, 0.5)";
const LINE_COLOR_BASE = "rgba(130, 138, 155, 0.15)";
const ACCENT_RED = "255, 0, 51";
const ACCENT_CYAN = "0, 255, 255";

// Roughly one node per this many px^2 of viewport, clamped so a huge
// ultrawide monitor doesn't spawn thousands of them.
const AREA_PER_NODE = 14000;
const MAX_NODES = 90;
const LINK_DISTANCE = 150;
const CURSOR_RADIUS = 180;
const DRIFT_SPEED = 0.06;

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  accent: string; // the "255, 0, 51" / "0, 255, 255" rgb triplet, no glow until near the cursor
};

type Comet = { ax: number; ay: number; bx: number; by: number; t: number; speed: number; accent: string };
type GridPoint = { x: number; y: number };
type Pulse = { path: GridPoint[]; t: number; duration: number };

export interface DataMeshBackgroundProps {
  /** Max node cap (same role as the old MAX_NODES constant). Default 90 — identical to pre-prop behavior. Grid variant reuses it to cap concurrent signal pulses. */
  nodeCount?: number;
  /** Probability [0-1] a given node is tinted red vs cyan. Default 0.5 (even split) — identical to pre-prop behavior. Mesh variant only. */
  colorMix?: number;
  /** Multiplier on the base drift/animation speed. Default 1 — identical to pre-prop behavior. */
  driftSpeed?: number;
  /**
   * "mesh" (default) — About's organic drifting node-graph, unchanged from
   * the original implementation.
   * "grid" — Projects' blueprint circuit-grid: a faint technical grid with
   * traveling signal pulses and a slow scan sweep, in place of drifting
   * nodes. Same canvas engine, a genuinely different rendering mode so the
   * two routes stop reading as "the same background" at a glance.
   */
  variant?: "mesh" | "grid";
}

// Plain 2D canvas, no WebGL — this sits behind a Framer Motion bento grid on
// a route with no R3F Canvas of its own, so there's no shared GPU context to
// worry about. Cheap enough on Canvas2D that neither variant needs a WebGL
// pipeline at all.
export default function DataMeshBackground({
  nodeCount = MAX_NODES,
  colorMix = 0.5,
  driftSpeed = 1,
  variant = "mesh",
}: DataMeshBackgroundProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    const pointer = { x: -9999, y: -9999 };

    // ---------- mesh variant state (About) ----------
    let nodes: Node[] = [];
    let comets: Comet[] = [];

    function buildNodes() {
      const area = width * height;
      const count = Math.min(nodeCount, Math.max(24, Math.round(area / AREA_PER_NODE)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * DRIFT_SPEED * driftSpeed,
        vy: (Math.random() - 0.5) * DRIFT_SPEED * driftSpeed,
        accent: Math.random() < colorMix ? ACCENT_RED : ACCENT_CYAN,
      }));
      comets = [];
    }

    // ---------- grid variant state (Projects) ----------
    let cols = 0;
    let rows = 0;
    let cell = 72;
    let pulses: Pulse[] = [];
    let sweepT = 0;
    const maxPulses = Math.max(4, Math.min(12, Math.round(nodeCount / 8)));

    function buildGrid() {
      cell = Math.max(56, Math.min(96, Math.round(Math.min(width, height) / 10)));
      cols = Math.floor(width / cell) + 1;
      rows = Math.floor(height / cell) + 1;
      pulses = [];
      sweepT = 0;
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (variant === "grid") buildGrid();
      else buildNodes();
    }

    function handlePointerMove(event: PointerEvent) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }

    function handlePointerLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    let rafId = 0;
    let lastFrame = performance.now();

    function frameMesh(delta: number) {
      ctx!.fillStyle = VOID_COLOR;
      ctx!.fillRect(0, 0, width, height);

      for (const node of nodes) {
        if (!reduceMotion) {
          node.x += node.vx * delta * 60;
          node.y += node.vy * delta * 60;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
          node.x = Math.max(0, Math.min(width, node.x));
          node.y = Math.max(0, Math.min(height, node.y));
        }
      }

      // Connecting lines first so node dots draw on top of them. Also
      // collects real edges so comets below only ever travel a connection
      // that's actually being drawn, not an invented path.
      const edges: { a: Node; b: Node }[] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK_DISTANCE) continue;
          edges.push({ a, b });

          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const cursorDist = Math.hypot(midX - pointer.x, midY - pointer.y);
          const proximity = Math.max(0, 1 - cursorDist / CURSOR_RADIUS);
          const baseAlpha = (1 - dist / LINK_DISTANCE) * 0.4;

          if (proximity > 0) {
            ctx!.strokeStyle = `rgba(${a.accent}, ${baseAlpha + proximity * 0.5})`;
            ctx!.lineWidth = 1 + proximity;
          } else {
            ctx!.strokeStyle = LINE_COLOR_BASE.replace("0.15", String(baseAlpha));
            ctx!.lineWidth = 1;
          }
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // Comets — an occasional bright pulse traveling a real connection,
      // like a synapse firing. Spawned only from edges already on screen,
      // capped low so it reads as a rare accent, not noise.
      if (!reduceMotion) {
        if (comets.length < 3 && edges.length > 0 && Math.random() < 0.02) {
          const edge = edges[Math.floor(Math.random() * edges.length)];
          comets.push({
            ax: edge.a.x,
            ay: edge.a.y,
            bx: edge.b.x,
            by: edge.b.y,
            t: 0,
            speed: 0.6 + Math.random() * 0.4,
            accent: edge.a.accent,
          });
        }
        comets = comets.filter((c) => c.t < 1);
        for (const c of comets) {
          c.t += delta * c.speed;
          const x = c.ax + (c.bx - c.ax) * c.t;
          const y = c.ay + (c.by - c.ay) * c.t;
          ctx!.beginPath();
          ctx!.fillStyle = `rgba(${c.accent}, ${0.9 * (1 - c.t)})`;
          ctx!.shadowColor = `rgba(${c.accent}, 0.8)`;
          ctx!.shadowBlur = 10;
          ctx!.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;
        }
      }

      for (const node of nodes) {
        const cursorDist = Math.hypot(node.x - pointer.x, node.y - pointer.y);
        const proximity = Math.max(0, 1 - cursorDist / CURSOR_RADIUS);
        const radius = 1.6 + proximity * 2.2;

        if (proximity > 0) {
          ctx!.beginPath();
          ctx!.fillStyle = `rgba(${node.accent}, ${0.5 + proximity * 0.5})`;
          ctx!.shadowColor = `rgba(${node.accent}, ${proximity})`;
          ctx!.shadowBlur = 12 * proximity;
          ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;
        } else {
          ctx!.beginPath();
          ctx!.fillStyle = NODE_COLOR;
          ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
    }

    function gridPoint(cx: number, cy: number): GridPoint {
      return { x: cx * cell, y: cy * cell };
    }

    function spawnPulse() {
      let cx = Math.floor(Math.random() * (cols + 1));
      let cy = Math.floor(Math.random() * (rows + 1));
      const path: GridPoint[] = [gridPoint(cx, cy)];
      const steps = 3 + Math.floor(Math.random() * 4);
      let lastDir = -1;
      for (let s = 0; s < steps; s++) {
        const dirs =
          lastDir === -1 ? [0, 1, 2, 3] : [0, 1, 2, 3].filter((d) => d !== (lastDir + 2) % 4);
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        if (dir === 0) cy -= 1;
        else if (dir === 1) cx += 1;
        else if (dir === 2) cy += 1;
        else cx -= 1;
        cx = Math.max(0, Math.min(cols, cx));
        cy = Math.max(0, Math.min(rows, cy));
        path.push(gridPoint(cx, cy));
        lastDir = dir;
      }
      pulses.push({ path, t: 0, duration: (1.6 + Math.random() * 1.4) / driftSpeed });
    }

    function pointAt(path: GridPoint[], t: number) {
      const segCount = path.length - 1;
      const segT = Math.min(t, 0.9999) * segCount;
      const segIndex = Math.min(Math.floor(segT), segCount - 1);
      const localT = segT - segIndex;
      const a = path[segIndex];
      const b = path[segIndex + 1];
      return { x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT, segIndex };
    }

    function frameGrid(delta: number) {
      ctx!.fillStyle = VOID_COLOR;
      ctx!.fillRect(0, 0, width, height);

      // Blueprint grid lines — one batched stroke for the whole network.
      ctx!.strokeStyle = "rgba(34, 229, 255, 0.05)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      for (let cx = 0; cx <= cols; cx++) {
        ctx!.moveTo(cx * cell, 0);
        ctx!.lineTo(cx * cell, height);
      }
      for (let cy = 0; cy <= rows; cy++) {
        ctx!.moveTo(0, cy * cell);
        ctx!.lineTo(width, cy * cell);
      }
      ctx!.stroke();

      // Intersection nodes, brighter near the cursor — same interaction
      // language as the mesh variant's node glow.
      for (let cx = 0; cx <= cols; cx++) {
        for (let cy = 0; cy <= rows; cy++) {
          const x = cx * cell;
          const y = cy * cell;
          const cursorDist = Math.hypot(x - pointer.x, y - pointer.y);
          const proximity = Math.max(0, 1 - cursorDist / CURSOR_RADIUS);
          ctx!.beginPath();
          if (proximity > 0) {
            ctx!.fillStyle = `rgba(34, 229, 255, ${0.25 + proximity * 0.65})`;
            ctx!.shadowColor = "rgba(34, 229, 255, 0.7)";
            ctx!.shadowBlur = 10 * proximity;
            ctx!.arc(x, y, 2 + proximity * 1.5, 0, Math.PI * 2);
          } else {
            ctx!.fillStyle = "rgba(34, 229, 255, 0.18)";
            ctx!.arc(x, y, 1.3, 0, Math.PI * 2);
          }
          ctx!.fill();
          ctx!.shadowBlur = 0;
        }
      }

      // Slow scan sweep — a soft horizontal band drifting down and looping.
      if (!reduceMotion) {
        sweepT += delta * 0.05 * driftSpeed;
        if (sweepT > 1.3) sweepT = -0.3;
      }
      const sweepY = sweepT * height;
      const sweepGradient = ctx!.createLinearGradient(0, sweepY - 60, 0, sweepY + 60);
      sweepGradient.addColorStop(0, "rgba(34, 229, 255, 0)");
      sweepGradient.addColorStop(0.5, "rgba(34, 229, 255, 0.05)");
      sweepGradient.addColorStop(1, "rgba(34, 229, 255, 0)");
      ctx!.fillStyle = sweepGradient;
      ctx!.fillRect(0, sweepY - 60, width, 120);

      // Signal pulses traveling the grid — the technical-archive "wow" beat,
      // analogous to the mesh variant's comets but rigid/orthogonal instead
      // of a straight organic line.
      if (!reduceMotion) {
        if (pulses.length < maxPulses && Math.random() < 0.045) spawnPulse();
        pulses = pulses.filter((p) => p.t < 1);
        for (const p of pulses) {
          p.t += delta / p.duration;
          const head = pointAt(p.path, p.t);

          ctx!.strokeStyle = "rgba(34, 229, 255, 0.35)";
          ctx!.lineWidth = 1.5;
          ctx!.beginPath();
          ctx!.moveTo(p.path[0].x, p.path[0].y);
          for (let s = 1; s <= head.segIndex; s++) ctx!.lineTo(p.path[s].x, p.path[s].y);
          ctx!.lineTo(head.x, head.y);
          ctx!.stroke();

          ctx!.beginPath();
          ctx!.fillStyle = `rgba(34, 229, 255, ${0.9 * (1 - p.t * 0.3)})`;
          ctx!.shadowColor = "rgba(34, 229, 255, 0.9)";
          ctx!.shadowBlur = 12;
          ctx!.arc(head.x, head.y, 2.6, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;
        }
      }
    }

    function frame(now: number) {
      rafId = requestAnimationFrame(frame);
      // Caps a tab-backgrounding delta spike to one frame's worth of drift —
      // same guard used throughout the 3D scene's own useFrame hooks.
      const delta = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      if (variant === "grid") frameGrid(delta);
      else frameMesh(delta);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    // Stops the rAF loop entirely while the tab is hidden instead of just
    // letting frames pile up unseen — the one piece of "optimized for
    // performance" that a plain rAF loop doesn't give you for free.
    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        lastFrame = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [nodeCount, colorMix, driftSpeed, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: VOID_COLOR }}
    />
  );
}
