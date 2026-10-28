"use client";

import React, { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NavMenu from "./NavMenu";

interface GlobalHUDProps {
  onSelectPOI?: (key: string) => void;
}

export default function GlobalHUD({ onSelectPOI }: GlobalHUDProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // On narrow mobile screens (< 768px), collapse the bio snippet card by default
  // so the 3D facility remains the primary visual on load, while preserving
  // desktop's expanded-by-default behavior. User can intentionally toggle it via 'i'.
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsInfoExpanded(false);
    }
  }, []);

  // Without this, a keyboard user closing the menu (Escape or the Close
  // button) lands on <body> with no visible focus anywhere — verified live.
  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  };
  // The bio card and "click models" hint both reference the 3D lab
  // specifically ("this 3D interactive lab...", "click models to explore")
  // — wrong copy once you're on a route like /about, and worse, the bio
  // card is position:fixed so on a scrollable page it stays pinned over
  // whatever content happens to scroll through that corner for the entire
  // page, not just once. Both are lab-only.
  const pathname = usePathname();
  const isLabHome = pathname === "/";

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-between p-4 md:p-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          {/* Top-Left: System Badge & Info Button */}
          <div className="pointer-events-auto flex items-center gap-3">
            {isLabHome && (
              <button
                type="button"
                onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-red-500/50 bg-zinc-950/80 font-mono text-xs font-bold text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all hover:scale-105 hover:bg-red-950/60 hover:text-white touch-manipulation"
                title="System Information"
                aria-label="Toggle System Information"
              >
                i
              </button>
            )}
            <div className="hidden font-mono text-xs font-bold tracking-widest text-red-500 uppercase sm:block">
              VAIBHAV TOOLS // SYSTEM_ACTIVE
              <span className="blinking-cursor">_</span>
            </div>
          </div>

          {/* Top-Right: Menu Button */}
          <div className="pointer-events-auto flex items-center gap-4">
            <div className="hidden font-mono text-[10px] tracking-widest text-zinc-500 uppercase lg:block">
              ENCRYPTION: AES-256 [SECURED]
            </div>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-red-500/40 bg-zinc-950/85 px-5 py-2 font-mono text-xs font-bold tracking-widest text-zinc-100 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-red-500 hover:bg-red-950/80 hover:text-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] touch-manipulation"
            >
              <span>Menu</span>
              <span className="text-red-500 font-bold">+</span>
            </button>
          </div>
        </div>

        {/* RIGHT SIDE BADGE (Awwwards / Nominee Style) - Hidden on small mobile screens to keep touch area clear */}
        <div className="pointer-events-auto absolute right-0 top-1/2 -translate-y-1/2 hidden sm:block">
          <div className="flex flex-col items-center gap-2 rounded-l-md border-l border-y border-red-500/40 bg-zinc-950/90 py-3 px-1.5 font-mono text-[9px] font-bold tracking-widest text-zinc-300 backdrop-blur-md shadow-lg">
            <span className="text-red-500 font-bold text-xs">W.</span>
            <span className="[writing-mode:vertical-lr] rotate-180 uppercase text-zinc-400 tracking-widest">
              Nominee
            </span>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="flex items-end justify-between">
          {/* Bottom-Left: Bio Snippet Card — lab-only */}
          <div className="pointer-events-auto max-w-[calc(100vw-3rem)] sm:max-w-xs md:max-w-sm">
            {isLabHome && isInfoExpanded && (
              <div className="rounded-lg border border-red-500/20 bg-zinc-950/90 p-3.5 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <p className="font-mono text-[11px] leading-relaxed text-zinc-300">
                  <span className="font-bold text-red-400">Vaibhav Jain</span> — creative developer & systems architect. This 3D interactive lab showcases systems, security tools & projects.
                </p>
                <div className="mt-2 flex items-center gap-2 font-mono text-[9px] text-zinc-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>3D ENVIRONMENT LOADED</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom-Right instruction (desktop) — lab-only */}
          {isLabHome && (
            <div className="hidden font-mono text-[10px] tracking-widest text-zinc-500 uppercase md:block">
              [ CLICK MODELS TO EXPLORE ]
            </div>
          )}
        </div>
      </div>

      {/* Nav Menu Overlay */}
      <NavMenu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        onSelectPOI={onSelectPOI}
      />
    </>
  );
}
