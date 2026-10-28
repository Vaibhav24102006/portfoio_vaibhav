"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { requestNavigation } from "@/lib/navigationBridge";

interface NavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPOI?: (key: string) => void;
}

export default function NavMenu({ isOpen, onClose, onSelectPOI }: NavMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Escape had no handler at all before this — verified live (menu stayed
  // open after pressing Escape). Standard dialog behavior: close on Escape,
  // and move focus into the panel on open so keyboard users aren't left
  // with focus on the now-hidden trigger button.
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleNav = (path: string) => {
    onClose();
    requestNavigation(path);
  };

  const handlePOIClick = (key: string) => {
    onClose();
    if (onSelectPOI) {
      onSelectPOI(key);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md"
          />

          {/* Slide-out Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 z-[90] flex h-full w-full max-w-md flex-col justify-between border-l border-red-500/20 bg-zinc-950/95 p-6 sm:p-8 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-zinc-100 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-y-auto"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 sm:pb-6">
                <div className="font-mono text-xs font-bold tracking-widest text-red-500 uppercase">
                  [ SYSTEM_NAVIGATOR ]
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-red-500/30 px-4 py-2 font-mono text-xs text-red-400 transition-colors hover:border-red-500 hover:bg-red-950/40 hover:text-white touch-manipulation"
                  aria-label="Close navigation menu"
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="mt-6 sm:mt-8 flex flex-col space-y-6">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    01 // CORE SECTIONS
                  </span>
                  <div className="mt-2 flex flex-col space-y-2">
                    <button
                      type="button"
                      onClick={() => handleNav("/")}
                      className="group flex min-h-[44px] items-center justify-between text-left font-mono text-lg sm:text-xl font-bold tracking-wider text-zinc-200 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span>01. 3D LAB HOME</span>
                      <span className="text-xs text-zinc-600 group-hover:text-red-500">→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav("/about")}
                      className="group flex min-h-[44px] items-center justify-between text-left font-mono text-lg sm:text-xl font-bold tracking-wider text-zinc-200 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span>02. ABOUT ARCHITECT</span>
                      <span className="text-xs text-zinc-600 group-hover:text-red-500">→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav("/projects")}
                      className="group flex min-h-[44px] items-center justify-between text-left font-mono text-lg sm:text-xl font-bold tracking-wider text-zinc-200 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span>03. PROJECT ARCHIVE</span>
                      <span className="text-xs text-zinc-600 group-hover:text-red-500">→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNav("/cosmos")}
                      className="group flex min-h-[44px] items-center justify-between text-left font-mono text-lg sm:text-xl font-bold tracking-wider text-zinc-200 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span>04. COSMOS</span>
                      <span className="text-xs text-zinc-600 group-hover:text-red-500">→</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    02 // 3D LAB POINTS OF INTEREST
                  </span>
                  <div className="mt-2 flex flex-col space-y-1 font-mono text-xs sm:text-sm">
                    <button
                      type="button"
                      onClick={() => handlePOIClick("guardian")}
                      className="flex min-h-[44px] items-center gap-2 text-left text-zinc-400 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>[ IDENTITY_CORE ] — Developer Bio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePOIClick("reactor")}
                      className="flex min-h-[44px] items-center gap-2 text-left text-zinc-400 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>[ TECH_ENGINE ] — Core Skills & Stack</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePOIClick("pillar-0")}
                      className="flex min-h-[44px] items-center gap-2 text-left text-zinc-400 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>[ PROJECT_01 ] — Cyber Crime Complaint System</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePOIClick("pillar-1")}
                      className="flex min-h-[44px] items-center gap-2 text-left text-zinc-400 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>[ PROJECT_02 ] — OSINT Investigation Tool</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePOIClick("pillar-2")}
                      className="flex min-h-[44px] items-center gap-2 text-left text-zinc-400 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>[ PROJECT_03 ] — Photo Forensics Tool</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePOIClick("portal")}
                      className="flex min-h-[44px] items-center gap-2 text-left text-zinc-400 transition-colors hover:text-red-400 touch-manipulation"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>[ COMMS_GATEWAY ] — Get in Touch</span>
                    </button>
                  </div>
                </div>
              </nav>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800/80 pt-6">
              <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                <span>LOC: AGRA, IN</span>
                <span>STATUS: ONLINE</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
