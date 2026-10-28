"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Space Grotesk', sans-serif;
  -webkit-font-smoothing: antialiased;
  
  --pill-bg-1: rgba(20, 20, 20, 0.85);
  --pill-bg-2: rgba(10, 10, 10, 0.95);
  --pill-shadow: rgba(0, 0, 0, 0.85);
  --pill-highlight: rgba(255, 0, 51, 0.15);
  --pill-inset-shadow: rgba(0, 0, 0, 0.9);
  --pill-border: rgba(255, 0, 51, 0.25);
  
  --pill-bg-1-hover: rgba(40, 10, 10, 0.95);
  --pill-bg-2-hover: rgba(25, 5, 5, 0.95);
  --pill-border-hover: rgba(255, 0, 51, 0.7);
  --pill-shadow-hover: rgba(255, 0, 51, 0.3);
  --pill-highlight-hover: rgba(255, 0, 51, 0.4);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.8; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 35s linear infinite;
}

.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(220, 38, 38, 0.25) 0%, 
    rgba(150, 0, 0, 0.15) 45%, 
    transparent 75%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: #fff;
}

.footer-giant-bg-text {
  font-size: 24vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 0, 51, 0.25);
  background: linear-gradient(180deg, rgba(255, 0, 51, 0.35) 0%, rgba(255, 0, 51, 0.05) 70%);
  -webkit-background-clip: text;
  background-clip: text;
}
`;

export type MagneticButtonProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  href?: string;
  target?: string;
  onClick?: React.MouseEventHandler;
  [key: string]: any;
};

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);
    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;
      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;
          gsap.to(element, { x: x * 0.4, y: y * 0.4, rotationX: -y * 0.15, rotationY: x * 0.15, scale: 1.05, ease: "power2.out", duration: 0.4 });
        };
        const handleMouseLeave = () => {
          gsap.to(element, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, ease: "elastic.out(1, 0.3)", duration: 1.2 });
        };
        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);
        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);
      return () => ctx.revert();
    }, []);
    const Comp = Component as any;
    return (
      <Comp
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>Zero-Day Research</span> <span className="text-red-500/60">✦</span>
    <span>Secure Architecture</span> <span className="text-red-500/60">✦</span>
    <span>System Resilience</span> <span className="text-red-500/60">✦</span>
    <span>Digital Investigation</span> <span className="text-red-500/60">✦</span>
    <span>Infrastructure Scaling</span> <span className="text-red-500/60">✦</span>
  </div>
);

export function MotionFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    // Detect the scrolling container (.overflow-y-auto parent or window)
    const scroller = wrapperRef.current.closest(".overflow-y-auto") || window;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "6vh", scale: 0.9, opacity: 0.4 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            scroller: scroller,
            start: "top 95%",
            end: "bottom bottom",
            scrub: 0.5,
          },
        }
      );
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 30, opacity: 0.3 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            scroller: scroller,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 0.5,
          },
        }
      );
    }, wrapperRef);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  const scrollToTop = () => {
    const scroller = wrapperRef.current?.closest(".overflow-y-auto") || window;
    scroller.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <footer
        ref={wrapperRef}
        className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#050505] text-zinc-100 cinematic-footer-wrapper border-t border-red-900/30 z-20"
      >
        <div className="footer-aurora absolute left-1/2 top-1/2 h-[65vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[90px] pointer-events-none z-0" />
        <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

        {/* Background Watermark Text */}
        <div
          ref={giantTextRef}
          className="footer-giant-bg-text absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
        >
          VAIBHAV
        </div>

        {/* Marquee Banner */}
        <div className="relative z-10 w-full overflow-hidden border-y border-red-900/40 bg-black/70 backdrop-blur-md py-4 -rotate-1 scale-105 shadow-2xl mt-8">
          <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.3em] text-red-500 uppercase">
            <MarqueeItem />
            <MarqueeItem />
          </div>
        </div>

        {/* Center Call to Action */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 w-full max-w-5xl mx-auto text-center">
          <div ref={headingRef} className="flex flex-col items-center">
            <p className="mb-4 font-mono text-xs tracking-[0.3em] text-red-500 uppercase animate-pulse">
              [ STATUS: AVAILABLE_FOR_OPERATIONS ]
            </p>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 uppercase text-white shadow-black drop-shadow-2xl leading-[0.95]">
              Initiate<br />Handshake
            </h2>
          </div>

          <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
            <div className="flex flex-wrap justify-center gap-5 w-full">
              <MagneticButton
                as="a"
                href="https://github.com/Vaibhav24102006"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-glass-pill px-10 py-5 rounded-full text-zinc-200 font-bold text-sm md:text-base flex items-center gap-3"
              >
                GitHub_
              </MagneticButton>
              <MagneticButton
                as="a"
                href="https://www.linkedin.com/in/vaibhav-jain-56b0b8328"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-glass-pill px-10 py-5 rounded-full text-zinc-200 font-bold text-sm md:text-base flex items-center gap-3"
              >
                LinkedIn_
              </MagneticButton>
              <MagneticButton
                as="a"
                href="mailto:vaibhavjain24102006@gmail.com"
                className="footer-glass-pill px-10 py-5 rounded-full text-zinc-200 font-bold text-sm md:text-base flex items-center gap-3"
              >
                Comm_Link_
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-zinc-500 text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1 font-mono">
            © 2026 VAIBHAV JAIN. ALL RIGHTS RESERVED.
          </div>
          <MagneticButton
            as="button"
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full footer-glass-pill flex items-center justify-center text-zinc-400 hover:text-white group order-3"
          >
            <svg
              className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              ></path>
            </svg>
          </MagneticButton>
        </div>
      </footer>
    </>
  );
}
