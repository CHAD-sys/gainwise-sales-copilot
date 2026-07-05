import { Sparkles, ArrowUpRight } from "lucide-react";
import type { SuggestedQuestion } from "../types";

export function SuggestedQuestions({
  questions,
  label,
  onPick,
  disabled,
}: {
  questions: SuggestedQuestion[];
  label: string;
  onPick: (q: SuggestedQuestion) => void;
  disabled?: boolean;
}) {
  if (questions.length === 0) return null;

  return (
    <div className="px-3 pt-3 sm:px-4">
      <div className="mb-1.5 flex items-center gap-1.5 px-0.5">
        <Sparkles
          className="h-3.5 w-3.5 text-[var(--color-accent)]"
          strokeWidth={2}
          aria-hidden
        />
        <span className="text-[11.5px] font-bold uppercase tracking-wide text-[var(--color-fg-subtle)]">
          {label}
        </span>
      </div>
      <div
        className="scroll-quiet flex gap-2 overflow-x-auto pb-1"
        role="list"
        aria-label={label}
      >
        {questions.map((q) => (
          <button
            key={q.id}
            type="button"
            role="listitem"
            disabled={disabled}
            onClick={() => onPick(q)}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-3.5 pr-3 text-[13px] font-medium text-[var(--color-fg-muted)] shadow-[var(--shadow-card)] transition-all duration-150 hover:border-[var(--color-ring)] hover:text-[var(--color-fg)] focus:outline-none focus-visible:border-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="whitespace-nowrap">{q.text}</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 text-[var(--color-fg-subtle)] transition-colors duration-150 group-hover:text-[var(--color-accent)]"
              strokeWidth={2.2}
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
}
