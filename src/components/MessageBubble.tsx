import {
  Clock,
  FileText,
  AlertTriangle,
  Sparkles,
  Quote,
} from "lucide-react";
import type { ChatMessage, Citation } from "../types";
import { cx } from "../lib/ui";

/** Render a string with **bold** segments — no full markdown engine needed. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-bold text-[var(--color-fg)]">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--color-fg-subtle)]"
          style={{ animation: `gw-blink 1.2s ${i * 0.18}s infinite ease-in-out` }}
        />
      ))}
    </span>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  if (role === "assistant") {
    return (
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-sm">
        <Sparkles className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
      </div>
    );
  }
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-[12px] font-bold text-[var(--color-accent-fg)]">
      LK
    </div>
  );
}

function SourceChip({
  citation,
  index,
  onOpen,
  active,
}: {
  citation: Citation;
  index: number;
  onOpen: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cx(
        "group inline-flex max-w-full items-center gap-1.5 rounded-lg border py-1.5 pl-2 pr-2.5 text-left text-[12px] font-medium transition-colors duration-150 focus:outline-none focus-visible:border-[var(--color-ring)]",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-fg)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent-fg)]"
      )}
      title={`Open source: ${citation.filename} · p.${citation.page}`}
    >
      <span
        className={cx(
          "grid h-4 w-4 shrink-0 place-items-center rounded text-[10px] font-bold",
          active
            ? "bg-[var(--color-accent)] text-white"
            : "bg-[var(--color-surface-3)] text-[var(--color-fg-subtle)] group-hover:bg-[var(--color-accent)] group-hover:text-white"
        )}
      >
        {index + 1}
      </span>
      <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.9} aria-hidden />
      <span className="truncate">{citation.filename}</span>
      <span className="shrink-0 rounded bg-[var(--color-surface-3)] px-1.5 py-px text-[11px] font-semibold text-[var(--color-fg-subtle)] tabnums group-hover:bg-[var(--color-surface)]">
        p.{citation.page}
      </span>
    </button>
  );
}

export function MessageBubble({
  message,
  thinkingCopy,
  activeCitation,
  onOpenCitation,
}: {
  message: ChatMessage;
  thinkingCopy: string;
  activeCitation: { messageId: string; index: number } | null;
  onOpenCitation: (messageId: string, index: number, citation: Citation) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="anim-fade-up flex justify-end gap-2.5">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--color-primary)] px-4 py-2.5 text-[14.5px] leading-relaxed text-[var(--color-primary-fg)] shadow-sm">
          {message.text}
        </div>
        <Avatar role="user" />
      </div>
    );
  }

  const answer = message.answer;
  const notFound = answer?.notFound;

  return (
    <div className="anim-fade-up flex gap-2.5">
      <Avatar role="assistant" />
      <div className="min-w-0 max-w-[85%] flex-1">
        {/* Body */}
        <div
          className={cx(
            "rounded-2xl rounded-tl-sm border px-4 py-3 shadow-[var(--shadow-card)]",
            notFound
              ? "border-[var(--color-warning-border)] bg-[var(--color-warning-soft)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)]"
          )}
        >
          {message.pending ? (
            <div className="flex items-center gap-2 py-0.5 text-[13.5px] text-[var(--color-fg-subtle)]">
              <ThinkingDots />
              <span>{thinkingCopy}</span>
            </div>
          ) : notFound ? (
            <div className="flex gap-2.5">
              <AlertTriangle
                className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--color-warning)]"
                strokeWidth={2}
                aria-hidden
              />
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--color-warning)]">
                  No grounded answer found
                </p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-[var(--color-fg)]">
                  {answer?.text}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[14.5px] leading-relaxed text-[var(--color-fg)]">
              <RichText text={answer?.text ?? ""} />
            </p>
          )}
        </div>

        {/* Meta + citations */}
        {!message.pending && answer && (
          <div className="mt-2 space-y-2 pl-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cx(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabnums",
                  notFound
                    ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                    : "bg-[var(--color-surface-3)] text-[var(--color-fg-subtle)]"
                )}
              >
                <Clock className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                Answered in {answer.responseSeconds.toFixed(1)}s
              </span>
              {!notFound && answer.citations.length > 0 && (
                <span className="text-[11.5px] font-medium text-[var(--color-fg-subtle)]">
                  Grounded in {answer.citations.length}{" "}
                  {answer.citations.length === 1 ? "source" : "sources"}
                </span>
              )}
            </div>

            {answer.citations.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-fg-subtle)]">
                  <Quote className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                  Sources
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {answer.citations.map((c, i) => (
                    <SourceChip
                      key={`${c.sourceId}-${c.page}-${i}`}
                      citation={c}
                      index={i}
                      active={
                        activeCitation?.messageId === message.id &&
                        activeCitation?.index === i
                      }
                      onOpen={() => onOpenCitation(message.id, i, c)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
