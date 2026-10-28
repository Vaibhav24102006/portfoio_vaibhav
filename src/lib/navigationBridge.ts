// Guardian's [ INITIATE_FULL_BIO ] link renders inside a drei <Html> portal,
// which keeps it in the same React fiber tree as the next/dynamic(ssr:false)
// -loaded <Scene>. Calling next/navigation's router directly from there (via
// <Link> or useRouter().push()) causes that lazy boundary to re-suspend on
// the resulting transition, unmounting and remounting the entire Canvas —
// confirmed by tagging the live <canvas> DOM node and watching it get
// replaced on click, while the same navigation triggered from plain page DOM
// (About's "Back to Lab" link) leaves it untouched.
//
// Dispatching a plain browser CustomEvent and letting RouterBridge (rendered
// as a sibling of SceneCanvas, outside the Canvas/dynamic-import tree) call
// the router from its own, unrelated fiber sidesteps that boundary entirely.
export const NAVIGATE_EVENT = "app:navigate";

export function requestNavigation(path: string) {
  window.dispatchEvent(new CustomEvent<string>(NAVIGATE_EVENT, { detail: path }));
}
