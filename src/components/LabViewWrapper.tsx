"use client";

import React, { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import SceneCanvas from "@/components/scene/SceneCanvas";
import GlobalHUD from "@/components/GlobalHUD";
import type { FocusTarget } from "@/components/scene/models/types";
import { ROUTES_WITH_OWN_SCENE } from "@/lib/sceneRoutes";

// Kept in sync with SceneContent.tsx / Pillars.tsx's actual current
// positions — this is a SEPARATE lookup table for NavMenu's "3D LAB POINTS
// OF INTEREST" menu (a different entry point than clicking the 3D meshes
// directly), and had drifted to the pre-compaction coordinates: clicking a
// POI from the nav menu would still open the right modal (that only checks
// `key`) but fly the camera to the wrong, stale spot instead of actually
// framing the object.
const POI_TARGETS: Record<string, [number, number, number]> = {
  guardian: [0, 0.08, 0],
  reactor: [-3.15, 0.08, -2.4],
  portal: [0, 0.08, -3.8],
  "pillar-0": [-3.8, 0.08, 2.8],
  "pillar-1": [0, 0.08, 2.8],
  "pillar-2": [3.8, 0.08, 2.8],
  drone: [3.3, 1.4, -2],
};

export default function LabViewWrapper() {
  const pathname = usePathname();
  const [focus, setFocus] = useState<FocusTarget | null>(null);

  const handleSelectPOI = useCallback((key: string) => {
    const position = POI_TARGETS[key] || [0, 0, 0];
    setFocus({ key, position });
  }, []);

  return (
    <>
      {!ROUTES_WITH_OWN_SCENE.has(pathname) && (
        <SceneCanvas focus={focus} setFocus={setFocus} />
      )}
      <GlobalHUD onSelectPOI={handleSelectPOI} />
    </>
  );
}
