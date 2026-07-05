// Minimal, dependency-free BM25 (Okapi) over an in-memory chunk set.
// Small corpus (a few hundred chunks) so a linear scan per query is instant and
// avoids pulling in a vector DB or search service.

import { tokenize } from "./tokenize.ts";

export interface Chunk {
  id: string;
  text: string;
  filename: string;
  page: number;
  language: string;
}

export interface Scored {
  chunk: Chunk;
  score: number;
}

const K1 = 1.5;
const B = 0.75;

export class BM25 {
  private chunks: Chunk[];
  private docTokens: string[][];
  private docLen: number[];
  private avgdl: number;
  private idf: Map<string, number>;

  constructor(chunks: Chunk[]) {
    this.chunks = chunks;
    this.docTokens = chunks.map((c) => tokenize(c.text));
    this.docLen = this.docTokens.map((t) => t.length);
    const totalLen = this.docLen.reduce((a, b) => a + b, 0);
    this.avgdl = totalLen / Math.max(1, chunks.length);

    // Document frequency per term.
    const df = new Map<string, number>();
    for (const tokens of this.docTokens) {
      for (const term of new Set(tokens)) {
        df.set(term, (df.get(term) ?? 0) + 1);
      }
    }
    const N = chunks.length;
    this.idf = new Map();
    for (const [term, freq] of df) {
      // BM25 idf with +1 to keep it non-negative.
      this.idf.set(term, Math.log(1 + (N - freq + 0.5) / (freq + 0.5)));
    }
  }

  search(query: string, k = 8): Scored[] {
    const qTerms = tokenize(query);
    if (qTerms.length === 0) return [];
    const qSet = new Set(qTerms);

    const results: Scored[] = [];
    for (let i = 0; i < this.chunks.length; i++) {
      const tokens = this.docTokens[i];
      if (tokens.length === 0) continue;

      // Term frequencies for this doc, limited to query terms.
      const tf = new Map<string, number>();
      for (const t of tokens) {
        if (qSet.has(t)) tf.set(t, (tf.get(t) ?? 0) + 1);
      }
      if (tf.size === 0) continue;

      let score = 0;
      const dl = this.docLen[i];
      for (const [term, freq] of tf) {
        const idf = this.idf.get(term) ?? 0;
        const denom = freq + K1 * (1 - B + (B * dl) / this.avgdl);
        score += idf * ((freq * (K1 + 1)) / denom);
      }
      if (score > 0) results.push({ chunk: this.chunks[i], score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }
}
