"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ChromaticAberrationEffect } from "postprocessing";

// Peak color-fringe offset at full transition intensity (intensity === 1,
// i.e. the instant a focus/close click lands). Kept tiny — this is a lens
// detail during motion, not a stylized glitch effect.
const CA_MAX_OFFSET = 0.0025;

// Bloom's tuned resting intensity — RenderGate's fade ramp multiplies this
// down to 0 on cold start so an unbaked, blown-out first frame never gets
// amplified into the red flash Bloom would otherwise exaggerate.
const BLOOM_INTENSITY = 0.6;

export default function Effects({
  transitionRef,
  renderFadeRef,
}: {
  transitionRef: React.RefObject<number>;
  renderFadeRef: React.RefObject<number>;
}) {
  const chromaticAberrationRef = useRef<ChromaticAberrationEffect>(null);
  const bloomRef = useRef<BloomEffect>(null);

  useFrame(() => {
    const intensity = transitionRef.current ?? 0;
    chromaticAberrationRef.current?.offset.set(
      CA_MAX_OFFSET * intensity,
      CA_MAX_OFFSET * intensity
    );

    if (bloomRef.current) {
      // renderFadeRef.current is always a number (Scene.tsx initializes it via
      // useRef(0) and RenderGate only ever writes numbers into it) — this
      // fallback never actually triggers, kept only as defensive typing.
      bloomRef.current.intensity = BLOOM_INTENSITY * (renderFadeRef.current ?? 1);
    }
  });

  return (
    <EffectComposer>
      <Bloom
        ref={bloomRef}
        // Raised from 0.3 — the DramaticSpotlight's red wash sat close enough
        // to the old threshold that Bloom picked up ambient-lit surfaces, not
        // just the light's own hotspot, spreading the red glow further than
        // intended.
        luminanceThreshold={0.75}
        luminanceSmoothing={0.9}
        intensity={0}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.3} darkness={0.7} />
      <Noise
        premultiply
        blendFunction={BlendFunction.OVERLAY}
        opacity={0.04}
      />
      <ChromaticAberration ref={chromaticAberrationRef} offset={[0, 0]} />
    </EffectComposer>
  );
}
