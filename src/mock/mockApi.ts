// ────────────────────────────────────────────────────────────────────────────
// DATA SERVICE LAYER
//
// Phase 2: these three functions now talk to the real RAG backend mounted on
// the dev server (see server/api.ts). The exported signatures are unchanged
// from Phase 1, so the UI did not need to change.
//
//   listSources()            -> GET  /api/sources   (real ingested catalogs
//                                                     + mocked internal/WeChat)
//   ask(question)            -> POST /api/ask        (BM25 retrieval + Claude)
//   getSuggestedQuestions()  -> curated fixed prompts (local, unchanged)
// ────────────────────────────────────────────────────────────────────────────

import type {
  Answer,
  KnowledgeSource,
  Language,
  SuggestedQuestion,
} from "../types";
import questionBank from "./questions.json";

const suggested = questionBank.suggested as SuggestedQuestion[];

/** List every ingested knowledge-base source. */
export async function listSources(): Promise<KnowledgeSource[]> {
  const res = await fetch("/api/sources");
  if (!res.ok) throw new Error(`Failed to load sources (${res.status})`);
  const data = (await res.json()) as { sources: KnowledgeSource[] };
  return data.sources;
}

/** Suggested questions filtered by the active UI language. */
export function getSuggestedQuestions(language: Language): SuggestedQuestion[] {
  return suggested.filter((q) => q.language === language);
}

export interface AskResult {
  answer: Answer;
  /** Wall-clock latency of this call, ms. */
  elapsedMs: number;
}

/**
 * Ask the copilot a question. Retrieval + generation happen on the backend;
 * unmatched / out-of-corpus questions come back with `notFound: true`.
 */
export async function ask(question: string): Promise<AskResult> {
  const started = performance.now();
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  const elapsedMs = Math.round(performance.now() - started);

  if (!res.ok) {
    // Surface backend/config errors as a graceful "not found"-style state
    // rather than crashing the UI.
    let detail = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      /* ignore parse errors */
    }
    return {
      answer: {
        text: detail,
        responseSeconds: elapsedMs / 1000,
        citations: [],
        notFound: true,
      },
      elapsedMs,
    };
  }

  const data = (await res.json()) as { answer: Answer };
  return { answer: data.answer, elapsedMs };
}
