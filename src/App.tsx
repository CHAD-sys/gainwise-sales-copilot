import { useCallback, useEffect, useMemo, useState } from "react";
import { PanelLeft, PanelLeftOpen, X } from "lucide-react";
import { TopBar, type View } from "./components/TopBar";
import { KnowledgeBaseSidebar } from "./components/KnowledgeBaseSidebar";
import { ChatPanel } from "./components/ChatPanel";
import { SourcePanel } from "./components/SourcePanel";
import { ProductionReadiness } from "./components/ProductionReadiness";
import type { ChatMessage, Citation, KnowledgeSource, Language } from "./types";
import { getSuggestedQuestions, ask, listSources } from "./mock/mockApi";
import { cx } from "./lib/ui";

let idSeq = 0;
const nextId = (p: string) => `${p}-${Date.now()}-${idSeq++}`;

interface ActiveCitation {
  messageId: string;
  index: number;
  citation: Citation;
}

export default function App() {
  const [view, setView] = useState<View>("copilot");
  const [dark, setDark] = useState(false);
  const [language, setLanguage] = useState<Language>("en");

  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop fold
  const [active, setActive] = useState<ActiveCitation | null>(null);

  // Theme init + sync.
  useEffect(() => {
    const prefersDark =
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    setDark(prefersDark);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Load knowledge base sources once.
  useEffect(() => {
    let alive = true;
    listSources().then((s) => {
      if (alive) {
        setSources(s);
        setLoadingSources(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const suggested = useMemo(
    () => getSuggestedQuestions(language),
    [language]
  );

  const sourceById = useMemo(() => {
    const m = new Map<string, KnowledgeSource>();
    for (const s of sources) m.set(s.id, s);
    return m;
  }, [sources]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const userMsg: ChatMessage = {
        id: nextId("u"),
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };
      const pendingId = nextId("a");
      const pendingMsg: ChatMessage = {
        id: pendingId,
        role: "assistant",
        text: "",
        pending: true,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, pendingMsg]);
      setBusy(true);

      const { answer } = await ask(trimmed);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, pending: false, answer, text: answer.text }
            : m
        )
      );
      setBusy(false);
    },
    [busy]
  );

  const openCitation = useCallback(
    (messageId: string, index: number, citation: Citation) => {
      setActive({ messageId, index, citation });
    },
    []
  );

  const isCopilot = view === "copilot";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--color-canvas)] text-[var(--color-fg)]">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[var(--color-primary)] focus:px-3 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-[var(--color-primary-fg)]"
      >
        Skip to content
      </a>

      <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:border-b-0">
        {isCopilot && (
          <>
            {/* Mobile: open drawer */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open knowledge base"
              className="ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--color-fg-muted)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] lg:hidden"
            >
              <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
            </button>
            {/* Desktop: expand when folded */}
            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                aria-label="Expand knowledge base"
                title="Show knowledge base"
                className="ml-2 hidden h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--color-fg-muted)] transition-colors duration-150 hover:bg-[var(--color-surface-3)] lg:grid"
              >
                <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
              </button>
            )}
          </>
        )}
        <div className="min-w-0 flex-1">
          <TopBar
            view={view}
            onViewChange={setView}
            dark={dark}
            onToggleDark={() => setDark((d) => !d)}
          />
        </div>
      </div>

      <main id="main" className="flex min-h-0 flex-1 overflow-hidden">
        {isCopilot ? (
          <>
            {/* Sidebar — static (foldable) on lg, drawer below */}
            <div
              className={cx(
                "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out lg:block",
                sidebarCollapsed ? "lg:w-0" : "lg:w-[300px]"
              )}
            >
              <div className="h-full w-[300px]">
                <KnowledgeBaseSidebar
                  sources={sources}
                  loading={loadingSources}
                  onCollapse={() => setSidebarCollapsed(true)}
                />
              </div>
            </div>

            {/* Mobile sidebar drawer */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden
                />
                <div className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] anim-slide-in">
                  <div className="relative h-full">
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(false)}
                      aria-label="Close knowledge base"
                      className="absolute right-2 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-surface)] text-[var(--color-fg-muted)] shadow-sm"
                    >
                      <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                    <KnowledgeBaseSidebar
                      sources={sources}
                      loading={loadingSources}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Chat */}
            <ChatPanel
              messages={messages}
              language={language}
              onLanguageChange={setLanguage}
              suggested={suggested}
              onSend={handleSend}
              busy={busy}
              activeCitation={
                active
                  ? { messageId: active.messageId, index: active.index }
                  : null
              }
              onOpenCitation={openCitation}
            />

            {/* Source panel — static on xl, drawer below */}
            {active && (
              <>
                <div className="hidden w-[380px] shrink-0 xl:block">
                  <SourcePanel
                    citation={active.citation}
                    source={sourceById.get(active.citation.sourceId)}
                    onClose={() => setActive(null)}
                  />
                </div>
                <div className="fixed inset-0 z-40 xl:hidden">
                  <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setActive(null)}
                    aria-hidden
                  />
                  <div className="absolute inset-y-0 right-0 w-[92%] max-w-[420px]">
                    <SourcePanel
                      citation={active.citation}
                      source={sourceById.get(active.citation.sourceId)}
                      onClose={() => setActive(null)}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className={cx("min-w-0 flex-1")}>
            <ProductionReadiness />
          </div>
        )}
      </main>
    </div>
  );
}
