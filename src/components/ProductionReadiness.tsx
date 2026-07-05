import {
  ShieldCheck,
  ScrollText,
  Database,
  GaugeCircle,
  LockKeyhole,
  Workflow,
  CircleDashed,
} from "lucide-react";
import { cx } from "../lib/ui";

type Status = "done" | "in-progress" | "planned";

const STATUS_META: Record<
  Status,
  { label: string; cls: string; dot: string }
> = {
  done: {
    label: "Ready",
    cls: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
    dot: "bg-[var(--color-success)]",
  },
  "in-progress": {
    label: "In progress",
    cls: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    dot: "bg-[var(--color-warning)]",
  },
  planned: {
    label: "Planned",
    cls: "bg-[var(--color-surface-3)] text-[var(--color-fg-subtle)]",
    dot: "bg-[var(--color-fg-subtle)]",
  },
};

const AREAS: {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
  status: Status;
}[] = [
  {
    icon: Workflow,
    title: "Retrieval pipeline",
    desc: "Swap the mock service for real PDF parsing, chunking, and vector retrieval.",
    status: "planned",
  },
  {
    icon: Database,
    title: "Document ingestion",
    desc: "Automated OCR + language detection for catalogs, docs, and WeChat exports.",
    status: "in-progress",
  },
  {
    icon: ScrollText,
    title: "Citation grounding",
    desc: "Every answer must resolve to a real source page — no ungrounded generation.",
    status: "done",
  },
  {
    icon: GaugeCircle,
    title: "Answer quality & evals",
    desc: "Golden-question test set, hallucination checks, and response-time budgets.",
    status: "planned",
  },
  {
    icon: LockKeyhole,
    title: "Access & data security",
    desc: "SSO, per-source permissions, and audit logging for client-facing answers.",
    status: "planned",
  },
  {
    icon: CircleDashed,
    title: "Observability",
    desc: "Query logs, source-hit analytics, and feedback loop on unanswered questions.",
    status: "planned",
  },
];

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="text-[24px] font-extrabold tracking-tight text-[var(--color-fg)] tabnums">
        {value}
      </div>
      <div className="mt-0.5 text-[12px] font-medium text-[var(--color-fg-subtle)]">
        {label}
      </div>
    </div>
  );
}

export function ProductionReadiness() {
  return (
    <div className="scroll-quiet h-full overflow-y-auto bg-[var(--color-canvas)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-sm">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.9} aria-hidden />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--color-fg)]">
              Production Readiness
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[var(--color-fg-muted)]">
              The checklist that moves Gainwise Sales Copilot from a Phase&nbsp;1
              clickable prototype to a deployable internal tool. This is a
              placeholder home — content will be filled in as each track lands.
            </p>
          </div>
        </div>

        {/* Phase banner */}
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-4 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning)] px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-white">
            Phase 1
          </span>
          <p className="text-[13.5px] font-medium text-[var(--color-fg)]">
            UI/UX complete on mock data. The data layer is isolated in a single
            service module for a clean Phase&nbsp;2 backend swap.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="Sources wired" value="8" />
          <StatPill label="Golden questions" value="12" />
          <StatPill label="Grounded answers" value="100%" />
          <StatPill label="Avg. response" value="2.1s" />
        </div>

        {/* Readiness areas */}
        <h2 className="mt-8 mb-3 text-[13px] font-bold uppercase tracking-wide text-[var(--color-fg-muted)]">
          Readiness tracks
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {AREAS.map((a) => {
            const Icon = a.icon;
            const meta = STATUS_META[a.status];
            return (
              <div
                key={a.title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition-colors duration-150 hover:border-[var(--color-border-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
                  </div>
                  <span
                    className={cx(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      meta.cls
                    )}
                  >
                    <span className={cx("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                  </span>
                </div>
                <h3 className="mt-3 text-[15px] font-bold text-[var(--color-fg)]">
                  {a.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
                  {a.desc}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-8 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-4 py-3 text-center text-[12.5px] text-[var(--color-fg-subtle)]">
          Placeholder section — drop detailed readiness criteria, sign-offs, and
          rollout notes here.
        </p>
      </div>
    </div>
  );
}
