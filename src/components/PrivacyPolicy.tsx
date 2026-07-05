import { useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="text-[14px] font-bold text-[var(--color-fg)]">{title}</h3>
      <div className="mt-1.5 space-y-2 text-[13.5px] leading-relaxed text-[var(--color-fg-muted)]">
        {children}
      </div>
    </section>
  );
}

export function PrivacyPolicy({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="anim-fade-up relative flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-pop)] sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.9} aria-hidden />
            </div>
            <div>
              <h2
                id="privacy-title"
                className="text-[17px] font-extrabold tracking-tight text-[var(--color-fg)]"
              >
                Privacy Policy
              </h2>
              <p className="mt-0.5 text-[12px] text-[var(--color-fg-subtle)]">
                Gainwise Sales Copilot · Last updated 5 July 2026
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close privacy policy"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--color-fg-subtle)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="scroll-quiet overflow-y-auto px-5 py-5">
          <p className="rounded-lg bg-[var(--color-surface-2)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-fg-subtle)]">
            Gainwise Sales Copilot is an internal tool for sales teams. This
            policy explains what it processes when you ask a question and view a
            source. It is a plain-language summary, not legal advice.
          </p>

          <Section title="1. What we process">
            <p>To answer your questions, the app processes:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong className="font-semibold text-[var(--color-fg)]">
                  Your questions
                </strong>{" "}
                — the text you type or the suggested prompt you click.
              </li>
              <li>
                <strong className="font-semibold text-[var(--color-fg)]">
                  Ingested documents
                </strong>{" "}
                — the manufacturer catalogs and internal files added to the
                knowledge base, and text excerpts retrieved from them.
              </li>
              <li>
                <strong className="font-semibold text-[var(--color-fg)]">
                  Basic usage data
                </strong>{" "}
                — response times and which sources were cited, used to improve
                answer quality.
              </li>
            </ul>
          </Section>

          <Section title="2. How your question is answered">
            <p>
              When you ask a question, the app retrieves the most relevant
              passages from the indexed documents and sends{" "}
              <strong className="font-semibold text-[var(--color-fg)]">
                your question together with those passages
              </strong>{" "}
              to a third-party large-language-model provider (DeepSeek) to
              compose a grounded, cited answer. Only the retrieved excerpts —
              not your entire document library — are shared for a given query.
            </p>
          </Section>

          <Section title="3. Third-party processing">
            <p>
              Answer generation relies on the DeepSeek API. Your question and the
              retrieved excerpts are transmitted to DeepSeek solely to produce a
              response and are subject to DeepSeek&rsquo;s own terms and privacy
              practices. No payment details, passwords, or account credentials
              are ever sent.
            </p>
          </Section>

          <Section title="4. Storage & retention">
            <p>
              The document index is stored locally alongside the application.
              Questions are held in your current session to display the
              conversation and are not persisted to an external database by this
              app. Uploaded documents remain until an administrator removes them
              from the knowledge base.
            </p>
          </Section>

          <Section title="5. What we don't do">
            <ul className="ml-4 list-disc space-y-1">
              <li>We don&rsquo;t sell or rent your data.</li>
              <li>
                We don&rsquo;t use your questions to advertise to you or to
                profile you.
              </li>
              <li>
                We don&rsquo;t ask for or store financial, payment, or
                government-ID information.
              </li>
            </ul>
          </Section>

          <Section title="6. Security">
            <p>
              Access is intended for authorized team members only. Document
              downloads are served from the indexed source files. Keep API keys
              and internal catalogs confidential; treat generated answers as
              internal information until verified against the cited source page.
            </p>
          </Section>

          <Section title="7. Accuracy & your responsibility">
            <p>
              Answers are generated from the indexed documents and can contain
              mistakes. Every answer links to its source page — verify important
              figures (pricing, MOQ, certifications, specifications) against the
              cited document before sharing them with a client.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              Questions about this policy or a request to remove a document can
              go to your workspace administrator.
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-[var(--color-border)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-[13px] font-semibold text-[var(--color-primary-fg)] transition-opacity duration-150 hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
