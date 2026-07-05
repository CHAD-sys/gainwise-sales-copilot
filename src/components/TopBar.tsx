import { MessagesSquare, Library, Moon, Sun, CircleCheck, Lock } from "lucide-react";
import { cx } from "../lib/ui";

export type View = "copilot" | "sources";

export function TopBar({
  view,
  onViewChange,
  dark,
  onToggleDark,
  onOpenPrivacy,
}: {
  view: View;
  onViewChange: (v: View) => void;
  dark: boolean;
  onToggleDark: () => void;
  onOpenPrivacy: () => void;
}) {
  const tabs: { id: View; label: string; icon: typeof MessagesSquare }[] = [
    { id: "copilot", label: "Copilot", icon: MessagesSquare },
    { id: "sources", label: "Sources", icon: Library },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:px-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-sm">
          <MessagesSquare className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-[var(--color-fg)]">
            Gainwise
          </div>
          <div className="-mt-0.5 text-[11px] font-medium text-[var(--color-fg-subtle)]">
            Sales Copilot
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav
        aria-label="Primary"
        className="ml-2 flex items-center gap-1 rounded-xl bg-[var(--color-surface-3)] p-1"
      >
        {tabs.map((t) => {
          const active = view === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onViewChange(t.id)}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors duration-150",
                active
                  ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-sm"
                  : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]"
          aria-label="Privacy policy"
          title="Privacy policy"
        >
          <Lock className="h-[17px] w-[17px]" strokeWidth={1.9} aria-hidden />
        </button>

        <button
          type="button"
          onClick={onToggleDark}
          className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? (
            <Sun className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
          ) : (
            <Moon className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
          )}
        </button>

        <div className="hidden items-center gap-2 border-l border-[var(--color-border)] pl-3 lg:flex">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-accent-soft)] text-[13px] font-bold text-[var(--color-accent-fg)]">
            AM
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1 text-[12px] font-semibold text-[var(--color-fg)]">
              Amine
              <CircleCheck
                className="h-3.5 w-3.5 text-[var(--color-success)]"
                strokeWidth={2.2}
                aria-hidden
              />
            </div>
            <div className="-mt-0.5 text-[11px] text-[var(--color-fg-subtle)]">
              Sales · HK
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
