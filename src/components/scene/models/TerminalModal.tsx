"use client";

// Shared red/charcoal glass terminal chrome — every clickable model's active
// modal (Guardian, Reactor, Portal, Pillars) renders its own content inside
// this same shell instead of duplicating the border/blur/glow/close-button
// styling four times.
export default function TerminalModal({
  title,
  onClose,
  children,
  width = "w-[calc(100vw-2.5rem)] max-w-xs sm:w-80",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  const handleClose = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className={`${width} max-h-[75vh] overflow-y-auto border border-red-600/50 bg-zinc-950/95 p-5 backdrop-blur-md touch-manipulation select-text`}
      style={{ boxShadow: "0 0 24px 2px rgba(220, 38, 38, 0.25)", pointerEvents: "auto" }}
      // Contain all pointer and touch events so they don't fall through to the WebGL canvas underneath
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 pr-2">
          {title}
        </h3>
        <button
          type="button"
          onClick={handleClose}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="-mr-2 -mt-2 inline-flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded p-2 font-mono text-xs tracking-widest text-zinc-400 transition-colors hover:bg-red-950/40 hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500 touch-manipulation"
          aria-label="Close modal"
        >
          <span>[ X ]</span>
        </button>
      </div>

      {children}
    </div>
  );
}
