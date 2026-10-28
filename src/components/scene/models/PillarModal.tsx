"use client";

import TerminalModal from "./TerminalModal";

export type Project = {
  title: string;
  org?: string;
  stack: string;
  description: string;
  /** Only rendered when set — never a fake "#" placeholder. */
  link?: string;
  demo?: string;
};

export default function PillarModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <TerminalModal title={project.title} onClose={onClose}>
      {project.org && (
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          {project.org}
        </p>
      )}
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
        {project.stack}
      </p>
      <p className="text-sm leading-relaxed text-zinc-300">
        {project.description}
      </p>
      {(project.link || project.demo) && (
        <div className="mt-3 flex gap-4 border-t border-zinc-800 pt-2 font-mono text-xs uppercase tracking-widest">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-red-500 transition-colors hover:text-red-400 touch-manipulation"
            >
              Source →
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-red-500 transition-colors hover:text-red-400 touch-manipulation"
            >
              Live Demo →
            </a>
          )}
        </div>
      )}
    </TerminalModal>
  );
}
