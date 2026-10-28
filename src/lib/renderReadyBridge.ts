// Mirrors navigationBridge.ts's approach: BootSequence is rendered as a
// sibling of the Canvas/dynamic-import tree (see layout.tsx), so it can't
// read a ref that lives inside <Canvas>. A plain CustomEvent is the simplest
// way to hand it one bit of state — "the scene has been shader-compiled,
// shadow-mapped, and presented at least once" — without threading a prop
// through the dynamic(ssr:false) boundary.
export const RENDER_READY_EVENT = "app:render-ready";

export function signalRenderReady() {
  window.dispatchEvent(new CustomEvent(RENDER_READY_EVENT));
}
