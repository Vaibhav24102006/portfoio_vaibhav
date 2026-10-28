"use client";

import { useState } from "react";
import { useCursor } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";

// Shared onPointerOver/onPointerOut wiring for every loaded model: tracks
// hover state, swaps the cursor to a pointer (drei's useCursor), and returns
// a scale multiplier so the hovered piece reads as interactive.
//
// Click-to-focus is optional (pass isActive/onClick) — Drone stays hover-only
// by calling this with no arguments; Guardian/Reactor/Portal/Pillars pass
// both to join the same fly-in system.
export function useHoverInteraction(options?: {
  hoverScale?: number;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const { hoverScale = 1.08, isActive = false, onClick } = options ?? {};
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !isActive);

  const handlers: {
    onPointerOver: (event: ThreeEvent<PointerEvent>) => void;
    onPointerOut: (event: ThreeEvent<PointerEvent>) => void;
    onClick?: (event: ThreeEvent<MouseEvent>) => void;
  } = {
    onPointerOver: (event) => {
      event.stopPropagation();
      setHovered(true);
    },
    onPointerOut: (event) => {
      event.stopPropagation();
      setHovered(false);
    },
  };

  if (onClick) {
    handlers.onClick = (event) => {
      event.stopPropagation();
      onClick();
    };
  }

  return {
    hovered,
    scale: hovered && !isActive ? hoverScale : 1,
    handlers,
  };
}
