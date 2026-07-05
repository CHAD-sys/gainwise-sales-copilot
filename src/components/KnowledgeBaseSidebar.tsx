import { Loader2, Plus, Search, Database, PanelLeftClose } from "lucide-react";
import type { KnowledgeSource } from "../types";
import { SourceIcon } from "./SourceIcon";
import { LANG_TAG, SOURCE_META, cx } from "../lib/ui";

function StatusBadge({ source }: { source: KnowledgeSource }) {
  if (source.status === "processing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning-soft)] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-warning)]">
        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} aria-hidden />
        Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success-soft)] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-success)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
      Indexed
    </span>
  );
}

function SourceRow({ source }: { source: KnowledgeSource }) {
  const processing = source.status === "processing";
  return (
    <li
      className={cx(
        "group rounded-xl border p-3 transition-colors duration-150",
        processing
          ? "border-[var(--color-warning-border)] bg-[var(--color-warning-soft)]/40"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cx(
            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
            processing
              ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
              : "bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]"
          )}
          aria-hidden
        >
          <SourceIcon type={source.type} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[13px] font-semibold text-[var(--color-fg)]"
            title={source.filename}
          >
            {source.filename}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[var(--color-fg-subtle)]">
            <span>{SOURCE_META[source.type].label}</span>
            <span aria-hidden>·</span>
            <span className="rounded bg-[var(--color-surface-3)] px-1.5 py-px font-medium text-[var(--color-fg-muted)]">
              {LANG_TAG[source.language]}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <StatusBadge source={source} />
        <span className="truncate text-[11px] text-[var(--color-fg-subtle)] tabnums">
          {processing ? source.updatedLabel : `${source.pages} pp · ${source.sizeLabel}`}
        </span>
      </div>

      {processing && typeof source.progress === "number" && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-warning-soft)]">
            <div
              className="h-full rounded-full bg-[var(--color-warning)] transition-[width] duration-500"
              style={{ width: `${source.progress}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] font-medium text-[var(--color-warning)] tabnums">
            Extracting & embedding · {source.progress}%
          </p>
        </div>
      )}
    </li>
  );
}

export function KnowledgeBaseSidebar({
  sources,
  loading,
  onCollapse,
}: {
  sources: KnowledgeSource[];
  loading: boolean;
  /** When provided, renders a fold button that collapses the sidebar. */
  onCollapse?: () => void;
}) {
  const indexed = sources.filter((s) => s.status === "indexed").length;
  const processing = sources.filter((s) => s.status === "processing").length;

  return (
    <aside className="flex h-full w-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <div className="shrink-0 border-b border-[var(--color-border)] px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database
              className="h-4 w-4 text-[var(--color-fg-muted)]"
              strokeWidth={1.9}
              aria-hidden
            />
            <h2 className="text-[13px] font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
              Knowledge Base
            </h2>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-lg text-[var(--color-fg-subtle)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]"
              aria-label="Add source"
              title="Add source"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </button>
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                className="hidden h-7 w-7 place-items-center rounded-lg text-[var(--color-fg-subtle)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)] lg:grid"
                aria-label="Collapse knowledge base"
                title="Collapse panel"
              >
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.9} aria-hidden />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-[11.5px] text-[var(--color-fg-subtle)] tabnums">
          {indexed} indexed
          {processing > 0 && ` · ${processing} processing`}
        </p>

        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-fg-subtle)]"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="text"
            placeholder="Filter sources"
            aria-label="Filter sources"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-8 pr-2.5 text-[12.5px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-ring)] focus:outline-none"
          />
        </div>
      </div>

      <ul className="scroll-quiet flex-1 space-y-2 overflow-y-auto p-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="h-[92px] animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
              />
            ))
          : sources.map((s) => <SourceRow key={s.id} source={s} />)}
      </ul>

      <div className="shrink-0 border-t border-[var(--color-border)] px-4 py-2.5">
        <p className="text-[11px] leading-relaxed text-[var(--color-fg-subtle)]">
          Answers are grounded only in these sources. Nothing is generated
          beyond what's cited.
        </p>
      </div>
    </aside>
  );
}
