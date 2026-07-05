import { Download, Library, FileLock2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { KnowledgeSource } from "../types";
import { SourceIcon } from "./SourceIcon";
import { LANG_TAG, SOURCE_META, cx } from "../lib/ui";

function downloadUrl(filename: string): string {
  return `/api/source-file?f=${encodeURIComponent(filename)}`;
}

function SourceCard({ source }: { source: KnowledgeSource }) {
  const meta = SOURCE_META[source.type];
  const downloadable = source.type === "catalog";

  return (
    <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-[var(--color-border-strong)]">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]">
          <SourceIcon type={source.type} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[14px] font-semibold text-[var(--color-fg)]"
            title={source.filename}
          >
            {source.filename}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--color-fg-subtle)]">
            {source.kind}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-[var(--color-surface-3)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-fg-muted)]">
          {LANG_TAG[source.language]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--color-fg-subtle)] tabnums">
        <span>{meta.label}</span>
        <span aria-hidden>·</span>
        <span>{source.pages} pages</span>
        <span aria-hidden>·</span>
        <span>{source.sizeLabel}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success-soft)] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-success)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
          Indexed
        </span>

        {downloadable ? (
          <a
            href={downloadUrl(source.filename)}
            download
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[var(--color-accent-hover)]"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden />
            Download
          </a>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg-subtle)]"
            title="Internal document — not available for download"
          >
            <FileLock2 className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden />
            Internal
          </span>
        )}
      </div>
    </div>
  );
}

export function SourcesExplorer({
  sources,
  loading,
}: {
  sources: KnowledgeSource[];
  loading: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter(
      (s) =>
        s.filename.toLowerCase().includes(q) ||
        s.kind.toLowerCase().includes(q) ||
        SOURCE_META[s.type].label.toLowerCase().includes(q)
    );
  }, [sources, query]);

  const catalogCount = sources.filter((s) => s.type === "catalog").length;

  return (
    <div className="scroll-quiet h-full overflow-y-auto bg-[var(--color-canvas)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-sm">
            <Library className="h-6 w-6" strokeWidth={1.9} aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-fg)]">
              Sources
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[var(--color-fg-muted)]">
              Every document the copilot can cite. Catalogs are downloadable;
              internal documents stay in-house. Answers are grounded only in what
              you see here.
            </p>
          </div>
        </div>

        {/* Stats + search */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-fg-muted)] tabnums">
            <span className="rounded-lg bg-[var(--color-surface-3)] px-2.5 py-1">
              {sources.length} indexed
            </span>
            <span className="rounded-lg bg-[var(--color-surface-3)] px-2.5 py-1">
              {catalogCount} downloadable
            </span>
          </div>
          <div className="relative sm:w-72">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-subtle)]"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sources"
              aria-label="Search sources"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-8 pr-2.5 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-ring)] focus:outline-none"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[150px] animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-4 py-10 text-center text-[13px] text-[var(--color-fg-subtle)]">
            No sources match “{query}”.
          </div>
        ) : (
          <div className={cx("mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3")}>
            {filtered.map((s) => (
              <SourceCard key={s.id} source={s} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[11.5px] text-[var(--color-fg-subtle)]">
          Downloads stream the original file directly from the indexed source.
        </p>
      </div>
    </div>
  );
}
