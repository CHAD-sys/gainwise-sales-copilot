// Tokenizer shared by indexing and querying.
//
// - Latin/number terms: whitespace/word tokenization (lowercased).
// - CJK (Chinese/Japanese) text: character BIGRAMS, not whitespace — CJK has no
//   spaces, so bigrams give BM25 meaningful units and let a query in one CJK
//   language retrieve source chunks in another (shared Han characters overlap).
//
// Because both scripts feed the same token space, a mixed query like
// "Eaton 的 RoHS 认证" produces latin tokens ("eaton","rohs") AND Han bigrams,
// so it can match an English source chunk and a Chinese one alike.

const CJK_CHAR = /[぀-ヿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ]/;
const CJK_RUN = /[぀-ヿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ]+/g;
const LATIN_TERM = /[a-z0-9]+(?:[-_.\/][a-z0-9]+)*/g;

export function hasCJK(text: string): boolean {
  return CJK_CHAR.test(text);
}

export function tokenize(input: string): string[] {
  const text = input.toLowerCase();
  const tokens: string[] = [];

  // Latin / numeric terms (model numbers like "db-12" or "3000rpm" survive).
  const latin = text.match(LATIN_TERM);
  if (latin) {
    for (const w of latin) {
      if (w.length >= 2 || /\d/.test(w)) tokens.push(w);
    }
  }

  // CJK runs → character bigrams (single-char runs kept as unigrams).
  const runs = text.match(CJK_RUN);
  if (runs) {
    for (const run of runs) {
      if (run.length === 1) {
        tokens.push(run);
      } else {
        for (let i = 0; i < run.length - 1; i++) {
          tokens.push(run.slice(i, i + 2));
        }
      }
    }
  }

  return tokens;
}
