"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CardStack, MobileProjectStack, type ProjectRecord } from "@/components/ui/card-stack";
import { ArchiveHandoff } from "@/components/ui/archive-handoff";
import { MotionFooter } from "@/components/ui/motion-footer";
import { signalRenderReady } from "@/lib/renderReadyBridge";

// Sourced from Vaibhav's actual resume (Vaibhav_Jain_Updated_Resume_v3_Bug_Bounty.pdf).
// `tagline` is a trimmed excerpt of the same verified `objective` sentence
// below it — shortened for the on-card overlay, never new information.
// `imageSrc` is undefined for all six records — no real project screenshots
// exist in this repo yet. Once supplied (see public/projects/), set it here
// and card-stack.tsx swaps the "coming soon" panel for the real screenshot
// with no other code changes.
const PROJECTS: ProjectRecord[] = [
  {
    id: "cyber-crime-complaint-analysis",
    title: "AI-Assisted Cyber Crime Complaint Analysis System",
    category: "Cyber Investigation",
    tagline: "Structured cyber-complaint analysis with offline OCR and entity extraction for investigator-ready reporting.",
    objective:
      "Built during a government cybersecurity internship at Rajasthan Police Headquarters, Cyber Crime Branch — structured cyber-complaint analysis, offline OCR processing, and entity extraction for investigator-ready reporting.",
    stack: "Python, Offline OCR, Entity Extraction",
    context: "Rajasthan Police Headquarters, Cyber Crime Branch",
    status: "NO PUBLIC REPOSITORY",
  },
  {
    id: "osint-investigation-support-tool",
    title: "OSINT-Based Cyber Investigation Support Tool",
    category: "OSINT",
    tagline: "Processes phone numbers, emails, and IP addresses to support structured OSINT investigations.",
    objective:
      "Built during a government cybersecurity internship at the Cyber Cell, Police Commissionerate Agra — processes phone numbers, emails, and IP addresses to support structured intelligence gathering for investigators.",
    stack: "Python, OSINT",
    context: "Cyber Cell, Police Commissionerate Agra",
    status: "NO PUBLIC REPOSITORY",
  },
  {
    id: "photo-forensics-tool",
    title: "Photo Forensics Tool",
    category: "Forensics",
    tagline: "Digital image forensics tool for metadata tampering and manipulation-anomaly detection.",
    objective:
      "In development — a digital image forensics tool to detect metadata tampering and manipulation anomalies for digital evidence validation.",
    stack: "Digital Image Forensics",
    status: "IN DEVELOPMENT — NO PUBLIC REPOSITORY",
  },
  {
    id: "angle-bot",
    title: "Angle Bot",
    category: "AI / Security Automation",
    tagline: "AI-assisted tool for structured vulnerability assessment and web security insight generation.",
    objective:
      "In development — an AI-assisted cybersecurity analysis tool for structured vulnerability assessment and web security insight generation.",
    status: "IN DEVELOPMENT — NO PUBLIC REPOSITORY",
  },
  {
    id: "fit-india",
    title: "Fit India",
    category: "Web / Applications",
    tagline: "AI-powered health platform with secure web architecture and structured authentication.",
    objective:
      "An AI-powered health platform built with secure web architecture, structured authentication, and backend validation.",
    status: "NO PUBLIC REPOSITORY",
  },
  {
    id: "oasis",
    title: "Oasis",
    category: "Web / Applications",
    tagline: "A gamer's e-commerce platform with structured, secure data handling.",
    objective:
      "A gamer's e-commerce platform — database-driven web application implementing structured data handling and secure development practices.",
    status: "NO PUBLIC REPOSITORY",
  },
];

// The desktop 3D fan uses fixed pixel geometry — it doesn't degrade
// gracefully at narrow widths, so mobile gets a structurally different,
// simpler layout below this breakpoint. `null` until mounted avoids a
// hydration mismatch between server and client renders.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

export default function ProjectsPage() {
  const isDesktop = useIsDesktop();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = PROJECTS[activeIndex]!;

  // This route has no 3D scene of its own (see sceneRoutes.ts) — the lab
  // Canvas that normally sends this signal doesn't mount here, so the page
  // has to self-report ready or BootSequence's boot screen would wait
  // forever.
  //
  // Deferred a tick (matching horizon-hero-section.tsx's own established
  // pattern for this exact race): RouteTransition's {children} — this page
  // — mounts and its effects fire before BootSequence's own effect (which
  // attaches the render-ready listener) has committed, since BootSequence
  // is declared after {children} in layout.tsx. Calling this synchronously
  // let the event dispatch and get lost with nobody listening yet — caught
  // live (boot screen never cleared), not assumed.
  useEffect(() => {
    setTimeout(signalRenderReady, 0);
  }, []);

  return (
    <div className="pointer-events-auto relative h-full w-full overflow-y-auto overflow-x-hidden bg-black">
      {/* Restarted per direct visual comparison against the Ruixen CardStack
          reference: the DataMeshBackground grid/node canvas read as "security
          dashboard" and competed with the cards. Replaced with a near-black
          field and two very low-opacity ambient glows — atmosphere, not
          decoration — so the stack has room to dominate. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--accent-red-glow),_transparent_45%)] opacity-[0.07]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--accent-cyan-glow),_transparent_45%)] opacity-[0.07]" />

      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-24">
        <p className="font-mono text-[10px] tracking-[0.35em] text-cyan-400 uppercase">
          [ PROJECT_ARCHIVE ]
        </p>
        <Link
          href="/"
          className="font-mono text-xs tracking-widest text-zinc-500 uppercase transition-colors hover:text-cyan-400"
        >
          [ &lt;&lt; BACK_TO_LAB ]
        </Link>
      </div>

      {/* Minimal header — states the page's purpose in two lines, then goes
          straight into the stack, which appears within the first viewport. */}
      <div className="relative z-10 mx-auto max-w-2xl px-6 pt-8 pb-6 text-center">
        <h1 className="text-2xl font-black tracking-tight text-zinc-100 uppercase md:text-3xl">
          Projects
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          A visual archive of systems I&apos;ve designed and engineered.
        </p>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
        {isDesktop === null ? (
          <div style={{ height: 490 }} aria-hidden="true" />
        ) : isDesktop ? (
          <CardStack items={PROJECTS} onChangeIndex={(i) => setActiveIndex(i)} />
        ) : (
          <MobileProjectStack items={PROJECTS} onChangeIndex={(i) => setActiveIndex(i)} />
        )}
      </div>

      {/* Supporting metadata for the active record — kept out of the card
          itself (image stays dominant) but immediately beneath the stack,
          concise: category/stack and a real link only when one exists. */}
      {isDesktop !== null && (
        <div className="relative z-10 mx-auto -mt-2 max-w-md px-6 pb-10 text-center">
          <p className="font-mono text-[11px] tracking-[0.2em] text-zinc-500 uppercase">
            {active.category}
            {active.stack ? ` · ${active.stack}` : ""}
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            <span>{active.status}</span>
            {active.link && (
              <a
                href={active.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 transition-colors hover:text-cyan-300"
              >
                View Project →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Archive close — the deliberate hand-off to the next destinations.
          "Secure Handoff": a thin SVG aperture (rings/ticks/orbital markers/
          a signal line that draws downward once in view) behind the closing
          copy, instead of the stack just running out into empty black. */}
      <ArchiveHandoff />

      <MotionFooter />
    </div>
  );
}
