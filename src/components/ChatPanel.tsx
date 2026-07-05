import { useEffect, useRef, useState } from "react";
import { ArrowUp, ShieldCheck } from "lucide-react";
import type {
  ChatMessage,
  Citation,
  Language,
  SuggestedQuestion,
} from "../types";
import { COPY, LANGUAGES, cx } from "../lib/ui";
import { MessageBubble } from "./MessageBubble";
import { SuggestedQuestions } from "./SuggestedQuestions";

function EmptyState({ language }: { language: Language }) {
  const copy = COPY[language];
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[var(--shadow-panel)]">
        <ShieldCheck className="h-7 w-7" strokeWidth={1.8} aria-hidden />
      </div>
      <h2 className="mt-4 text-[19px] font-extrabold tracking-tight text-[var(--color-fg)]">
        {copy.emptyTitle}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-fg-muted)]">
        {copy.emptyBody}
      </p>
    </div>
  );
}

function LanguageSelector({
  language,
  onChange,
}: {
  language: Language;
  onChange: (l: Language) => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-[var(--color-surface-3)] p-0.5"
      role="group"
      aria-label="Answer language"
    >
      {LANGUAGES.map((l) => {
        const active = language === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onChange(l.id)}
            aria-pressed={active}
            title={l.label}
            className={cx(
              "rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors duration-150",
              active
                ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-sm"
                : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
            )}
          >
            {l.native}
          </button>
        );
      })}
    </div>
  );
}

export function ChatPanel({
  messages,
  language,
  onLanguageChange,
  suggested,
  onSend,
  busy,
  activeCitation,
  onOpenCitation,
}: {
  messages: ChatMessage[];
  language: Language;
  onLanguageChange: (l: Language) => void;
  suggested: SuggestedQuestion[];
  onSend: (text: string) => void;
  busy: boolean;
  activeCitation: { messageId: string; index: number } | null;
  onOpenCitation: (messageId: string, index: number, citation: Citation) => void;
}) {
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const copy = COPY[language];
  const empty = messages.length === 0;

  // Autoscroll to newest message.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-grow textarea.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [draft]);

  function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    onSend(text);
    setDraft("");
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-[var(--color-canvas)]">
      {/* Thread */}
      <div
        ref={threadRef}
        className="scroll-quiet flex-1 overflow-y-auto"
        aria-live="polite"
        aria-relevant="additions"
      >
        {empty ? (
          <div className="flex min-h-full items-center justify-center">
            <EmptyState language={language} />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-5 px-3 py-5 sm:px-4">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                thinkingCopy={copy.thinking}
                activeCitation={activeCitation}
                onOpenCitation={onOpenCitation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto w-full max-w-3xl">
          <SuggestedQuestions
            questions={suggested}
            label={copy.suggestedLabel}
            onPick={(q) => onSend(q.text)}
            disabled={busy}
          />

          <div className="p-3 sm:p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)] transition-colors duration-150 focus-within:border-[var(--color-ring)]">
              <label htmlFor="composer" className="sr-only">
                Ask a question
              </label>
              <textarea
                id="composer"
                ref={taRef}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={copy.inputPlaceholder}
                className="scroll-quiet max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-[14.5px] leading-relaxed text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none"
              />
              <button
                type="button"
                onClick={submit}
                disabled={busy || draft.trim().length === 0}
                aria-label="Send question"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-accent)] text-white shadow-sm transition-all duration-150 hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-fg-subtle)]"
              >
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className="hidden text-[11.5px] font-medium text-[var(--color-fg-subtle)] sm:inline">
                  Answer in
                </span>
                <LanguageSelector
                  language={language}
                  onChange={onLanguageChange}
                />
              </div>
              <p className="text-[11px] text-[var(--color-fg-subtle)]">
                <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1 py-0.5 font-sans text-[10px] font-semibold">
                  Enter
                </kbd>{" "}
                to send ·{" "}
                <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1 py-0.5 font-sans text-[10px] font-semibold">
                  Shift+Enter
                </kbd>{" "}
                new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
