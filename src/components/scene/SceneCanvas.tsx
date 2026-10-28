"use client";

import dynamic from "next/dynamic";

// next/dynamic's ssr:false can only be called from a Client Component in the
// App Router, hence this thin wrapper — page.tsx stays a Server Component and
// just renders this instead of importing Scene (and its WebGL context) directly.
import type { FocusTarget } from "./models/types";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function SceneCanvas({
  focus,
  setFocus,
}: {
  focus?: FocusTarget | null;
  setFocus?: (focus: FocusTarget | null) => void;
}) {
  return <Scene focusProp={focus} setFocusProp={setFocus} />;
}
