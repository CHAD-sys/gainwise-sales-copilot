// Loads the on-disk index and exposes retrieval + source listing to the API.

import fs from "node:fs";
import path from "node:path";
import { BM25, type Chunk, type Scored } from "./bm25.ts";
import { tokenize, hasCJK } from "./tokenize.ts";

const ROOT = process.cwd();
const CHUNKS_PATH = path.join(ROOT, "data", "index", "chunks.json");
const SOURCES_PATH = path.join(ROOT, "data", "index", "sources.json");
const EXTRA_PATH = path.join(ROOT, "server", "extraSources.json");

export type QueryLang = "en" | "zh" | "ja";

let engine: BM25 | null = null;
let chunks: Chunk[] = [];
let vocab: Set<string> = new Set();

// Generic terms that carry no topical signal — excluded from coverage scoring.
const STOP = new Set(
  "the a an and or of for to in on at is are do does you your what which how with we can could as be by from have has our their they it this that".split(
    " "
  )
);

function readJson<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

/** Build (or rebuild) the in-memory index from disk. Safe to call repeatedly. */
export function loadIndex(): { chunkCount: number; ok: boolean } {
  chunks = readJson<Chunk[]>(CHUNKS_PATH, []);
  engine = chunks.length > 0 ? new BM25(chunks) : null;
  vocab = new Set();
  for (const c of chunks) for (const t of tokenize(c.text)) vocab.add(t);
  return { chunkCount: chunks.length, ok: chunks.length > 0 };
}

/**
 * Fraction of the query's *significant* terms that occur anywhere in the corpus
 * (0–1). A low value means the question is about something the catalogs simply
 * don't mention — used by the no-API-key fallback to still surface "not found".
 * The LLM path does not need this; it judges grounding semantically.
 */
export function corpusCoverage(query: string): number {
  const sig = new Set(
    tokenize(query).filter(
      (t) => hasCJK(t) || (t.length >= 3 && !STOP.has(t))
    )
  );
  if (sig.size === 0) return 1;
  let present = 0;
  for (const t of sig) if (vocab.has(t)) present++;
  return present / sig.size;
}

export function indexReady(): boolean {
  return engine !== null;
}

/** Real ingested catalogs + mocked internal/WeChat placeholders. */
export function listAllSources() {
  const real = readJson<Record<string, unknown>[]>(SOURCES_PATH, []);
  const extra = readJson<Record<string, unknown>[]>(EXTRA_PATH, []);
  // Real catalogs first, then the mocked extras (incl. the processing entry).
  return [...real, ...extra];
}

export function retrieve(query: string, k = 8): Scored[] {
  if (!engine) return [];
  return engine.search(query, k);
}

/** Detect the language to answer in from the question's script. */
export function detectLanguage(text: string): QueryLang {
  if (/[぀-ゟ゠-ヿｦ-ﾟ]/.test(text)) return "ja"; // kana ⇒ Japanese
  if (/[㐀-䶿一-鿿豈-﫿]/.test(text)) return "zh"; // Han only ⇒ Chinese
  return "en";
}
