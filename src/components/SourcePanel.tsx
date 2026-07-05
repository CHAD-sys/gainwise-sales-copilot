import { X, FileText, ExternalLink, Copy } from "lucide-react";
import type { Citation, KnowledgeSource } from "../types";
import { SourceIcon } from "./SourceIcon";
import { LANG_TAG, SOURCE_META } from "../lib/ui";

export function SourcePanel({
  citation,
  source,
  onClose,
}: {
  citation: Citation;
  source?: KnowledgeSource;
  onClose: () => void;
}) {
  return (
    <aside
      className="anim-slide-in flex h-full w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)]"
      role="complementary"
      aria-label="Source excerpt"
    >
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]">
            <SourceIcon type={source?.type ?? "catalog"} className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-fg-subtle)]">
              Source excerpt
            </div>
            <h3
              className="truncate text-[14px] font-bold text-[var(--color-fg)]"
              title={citation.filename}
            >
              {citation.filename}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--color-fg-subtle)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]"
          aria-label="Close source panel"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* Meta row */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-[12px]">
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface)] px-2 py-1 font-semibold text-[var(--color-fg-muted)] tabnums shadow-[var(--shadow-card)]">
          <FileText className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden />
          Page {citation.page}
        </span>
        {source && (
          <>
            <span className="rounded-md bg-[var(--color-surface)] px-2 py-1 font-medium text-[var(--color-fg-subtle)]">
              {SOURCE_META[source.type].label}
            </span>
            <span className="rounded-md bg-[var(--color-surface)] px-2 py-1 font-semibold text-[var(--color-fg-subtle)]">
              {LANG_TAG[source.language]}
            </span>
          </>
        )}
      </div>

      {/* Excerpt */}
      <div className="scroll-quiet flex-1 overflow-y-auto px-4 py-4">
        {citation.section && (
          <div className="mb-2 text-[12px] font-bold text-[var(--color-accent)]">
            {citation.section}
          </div>
        )}

        <figure className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
          <span
            className="absolute left-0 top-4 h-[calc(100%-2rem)] w-[3px] rounded-full bg-[var(--color-accent)]"
            aria-hidden
          />
          <blockquote className="pl-3 text-[14px] leading-[1.7] text-[var(--color-fg)]">
            <span className="mr-0.5 select-none font-serif text-[var(--color-border-strong)]">
              "
            </span>
            {citation.excerpt}
            <span className="ml-0.5 select-none font-serif text-[var(--color-border-strong)]">
              "
            </span>
          </blockquote>
          <figcaption className="mt-3 border-t border-[var(--color-border)] pt-2.5 text-[11.5px] text-[var(--color-fg-subtle)]">
            Extracted from{" "}
            <span className="font-semibold text-[var(--color-fg-muted)]">
              {citation.filename}
            </span>
            , page <span className="tabnums">{citation.page}</span>
          </figcaption>
        </figure>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[12.5px] font-semibold text-[var(--color-fg-muted)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden />
            Open document
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[12.5px] font-semibold text-[var(--color-fg-muted)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden />
            Copy excerpt
          </button>
        </div>

        <p className="mt-4 rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-[11.5px] leading-relaxed text-[var(--color-fg-subtle)]">
          This excerpt is what the copilot retrieved to ground its answer. In
          production, "Open document" will jump to this exact page in the source
          file.
        </p>
      </div>
    </aside>
  );
}
