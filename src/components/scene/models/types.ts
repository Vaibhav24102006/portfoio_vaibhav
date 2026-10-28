// Shared across every clickable model (Guardian, Reactor, Portal, Pillars) so
// the camera fly-in system and the terminal modals aren't pillar-specific —
// "key" replaces the pillar-only numeric id so any asset type can identify
// itself (e.g. "guardian", "reactor", "portal", "pillar-0").
export type FocusTarget = {
  key: string;
  position: [number, number, number];
};
