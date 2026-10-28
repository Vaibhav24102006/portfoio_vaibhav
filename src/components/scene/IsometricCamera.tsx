"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrthographicCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { FocusTarget } from "./models/types";

const ISO_DISTANCE = 20;
const PARALLAX_STRENGTH = 0.6; // Reduced by 60% from 1.5 for a subtle, slow parallax
const FOCUS_OFFSET = 8; // fly-in offset added to the clicked pillar's position
const BASE_ZOOM = 70;
const FOCUS_ZOOM = 100;
const LERP_SPEED = 1.2; // Smoother, slower lerp for gentle breathing movement


// Fixed isometric viewing direction. Looking a constant distance along this
// vector from wherever the camera currently sits is what keeps the isometric
// ANGLE truly constant while flying to a pillar, instead of re-aiming at a
// fixed point like the origin — that would skew the angle once the camera is
// off-center, which is exactly what happens once it flies toward a pillar
// several units off-axis. This is the same technique used for the earlier
// scroll-driven pan, now generalized to handle both idle parallax and focus.
const ISO_DIRECTION = new THREE.Vector3(-1, -1, -1).normalize();
const LOOK_OFFSET = ISO_DIRECTION.clone().multiplyScalar(10);

export default function IsometricCamera({
  focus,
  transitionRef,
}: {
  focus: FocusTarget | null;
  // Written every frame with how far the camera still is from its target
  // zoom, normalized 0-1. Near 1 right when a focus/close click lands, decays
  // to 0 as the exponential lerp converges — a free "in transit" signal that
  // stays in lockstep with the actual camera motion. Effects.tsx reads it to
  // drive chromatic aberration without either component needing its own timer.
  transitionRef?: React.RefObject<number>;
}) {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const lookTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    camera.position.set(ISO_DISTANCE, ISO_DISTANCE, ISO_DISTANCE);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, []);

  useFrame((state, delta) => {
    const camera = cameraRef.current;
    if (!camera) return;

    // Already delta-spike-safe: clamping the derived lerpFactor to 1 (rather
    // than clamping raw delta first) gives the same protection — no matter
    // how large a tab-backgrounding delta gets, lerpFactor can't exceed 1,
    // so position/zoom lerp toward the target in a single step at worst and
    // can never overshoot.
    const lerpFactor = Math.min(1, delta * LERP_SPEED);

    let targetX: number;
    let targetY: number;
    let targetZ: number;
    let targetZoom: number;

    // Determine responsive zoom target based on viewport dimensions:
    // Desktop (width >= 768px): BASE_ZOOM = 70, FOCUS_ZOOM = 100 (Unchanged)
    // Mobile Portrait (< 768px & height > width): BASE_ZOOM = 56, FOCUS_ZOOM = 85 (Comfortable breathing room)
    // Mobile Landscape (height < 500px): BASE_ZOOM = 52, FOCUS_ZOOM = 75 (Prevents vertical clipping)
    const isMobilePortrait = state.size.width < 768 && state.size.height > state.size.width;
    const isMobileLandscape = state.size.height < 500;

    let baseZoomTarget = BASE_ZOOM;
    let focusZoomTarget = FOCUS_ZOOM;

    if (isMobilePortrait) {
      baseZoomTarget = 56;
      focusZoomTarget = 85;
    } else if (isMobileLandscape) {
      baseZoomTarget = 52;
      focusZoomTarget = 75;
    }

    if (focus) {
      // Fly toward the clicked pillar. Orthographic projection doesn't
      // magnify with proximity the way a perspective camera does, so the
      // position offset alone wouldn't actually read as "zoomed in" — the
      // zoom lerp below is what does the real visual work; the position
      // offset just centers the framing on the pillar.
      const [px, py, pz] = focus.position;
      targetX = px + FOCUS_OFFSET;
      targetY = py + FOCUS_OFFSET;
      targetZ = pz + FOCUS_OFFSET;
      targetZoom = focusZoomTarget;
    } else {
      // Idle state: gentle mouse parallax around the base isometric position.
      targetX = ISO_DISTANCE + state.pointer.x * PARALLAX_STRENGTH;
      targetY = ISO_DISTANCE + state.pointer.y * PARALLAX_STRENGTH;
      targetZ = ISO_DISTANCE - state.pointer.x * PARALLAX_STRENGTH;
      targetZoom = baseZoomTarget;
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, lerpFactor);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, lerpFactor);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, lerpFactor);

    const zoomGap = Math.abs(camera.zoom - targetZoom);
    if (zoomGap > 0.01) {
      camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, lerpFactor);
      camera.updateProjectionMatrix();
    }

    if (transitionRef) {
      transitionRef.current = THREE.MathUtils.clamp(
        zoomGap / (FOCUS_ZOOM - BASE_ZOOM),
        0,
        1
      );
    }

    lookTarget.current.copy(camera.position).add(LOOK_OFFSET);
    camera.lookAt(lookTarget.current);
  });

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      zoom={BASE_ZOOM}
      near={0.1}
      far={200}
    />
  );
}
