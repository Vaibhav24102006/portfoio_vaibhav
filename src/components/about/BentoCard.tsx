"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function BentoCard({
  header,
  children,
  large = false,
}: {
  header: string;
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-xl border border-red-900/30 bg-[#080808] shadow-[0_-20px_40px_rgba(0,0,0,0.9)] backdrop-blur-md transition-colors duration-300 hover:border-red-600/70 hover:shadow-[0_0_55px_-10px_rgba(255,0,51,0.55)] ${large ? "p-10" : "p-8"}`}
    >
      <div>
        <h2
          className={`mb-4 flex items-center gap-3 font-black uppercase tracking-tight text-zinc-100 ${
            large ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
          }`}
        >
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_10px_2px_rgba(255,0,51,0.6)]" />
          {header}
        </h2>
        <div
          className={`leading-relaxed text-zinc-400 ${large ? "text-base md:text-lg" : "text-sm md:text-lg"}`}
        >
          {children}
        </div>
      </div>
      {/* Corner accent — purely decorative, brightens on hover alongside the border */}
      <div className="pointer-events-none absolute top-0 right-0 h-12 w-12 border-t border-r border-zinc-800/50 opacity-0 transition-opacity duration-300 group-hover:border-red-600/60 group-hover:opacity-100" />
    </motion.div>
  );
}
