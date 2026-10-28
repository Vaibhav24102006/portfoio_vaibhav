// Routes the persistent lab Canvas should NOT mount on — either because the
// route runs its own separate WebGL scene (/cosmos), or because it's a plain
// 2D/DOM page with no 3D content of its own (/about, /projects). Shared
// between LabViewWrapper (which must not mount the lab Canvas here) and
// BootSequence (which must not wait on the lab's render-ready signal here,
// since with no lab Canvas mounted it will never fire).
//
// /about and /projects used to be missing from this set: navigating to
// either directly (not via in-app nav from "/") forced a ~30-40s wait behind
// the lab's boot gate — all 5 GLB models loading and shader-compiling for a
// scene the page never shows, since it's a 2D page rendered on top of it.
// Verified live. Each of these routes now calls signalRenderReady() itself
// (see renderReadyBridge.ts) once its own lightweight content is mounted,
// the same way /cosmos already does for its own scene.
export const ROUTES_WITH_OWN_SCENE = new Set(["/cosmos", "/about", "/projects"]);
