// Answer generation. Given the retrieved chunks, ask Claude to answer ONLY from
// them, force a structured result, and rebuild citations from the *real* chunk
// text (never the model's paraphrase) so the source panel always shows a true
// quote.

import type { Scored } from "./bm25.ts";
import { corpusCoverage, type QueryLang } from "./rag.ts";

// DeepSeek (OpenAI-compatible API). deepseek-chat = DeepSeek-V3.
const MODEL = "deepseek-chat";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MAX_CONTEXT_CHUNKS = 8;
const EXCERPT_CHARS = 380;

// Extractive (no-API-key) fallback thresholds for surfacing "not found":
// - below this BM25 score the top hit is essentially noise, and
// - below this coverage the query's key terms don't appear in the corpus at all
//   (e.g. a payment/discount question against product spec catalogs).
// The LLM path ignores both and judges grounding semantically instead.
const MIN_RELEVANCE = 2.2;
const MIN_COVERAGE = 0.45;

export interface OutCitation {
  sourceId: string;
  filename: string;
  page: number;
  excerpt: string;
  section?: string;
}

export interface OutAnswer {
  text: string;
  responseSeconds: number;
  citations: OutCitation[];
  notFound?: boolean;
  mode: "llm" | "extractive";
}

const NOT_FOUND: Record<QueryLang, string> = {
  en: "I couldn't find this in the indexed documents. I searched the ingested catalogs but none of them cover this. Rather than guess, please rephrase, check the model name, or add the relevant document to the knowledge base.",
  zh: "我在已索引的文档中找不到相关内容。我检索了已导入的产品目录，但都没有涉及这个问题。为避免臆测，请尝试换个说法、确认型号名称，或将相关文档加入知识库。",
  ja: "インデックス済みの文書内で該当する情報が見つかりませんでした。取り込んだカタログを検索しましたが、この件を扱ったものはありません。推測は避けますので、表現を変える、型番を確認する、または該当文書をナレッジベースに追加してください。",
};

const EXTRACTIVE_PREFIX: Record<QueryLang, string> = {
  en: "**Most relevant indexed passage** (LLM synthesis is off — set DEEPSEEK_API_KEY to enable full answers):",
  zh: "**最相关的检索段落**（未启用 LLM 合成 —— 设置 DEEPSEEK_API_KEY 可生成完整回答）：",
  ja: "**最も関連性の高い検索結果**（LLM 合成は無効 —— DEEPSEEK_API_KEY を設定すると完全な回答が有効になります）：",
};

/** Strip any inline "(SOURCE 3)" / "SOURCE 3" markers the model may leak. */
function stripSourceMarkers(text: string): string {
  return text
    .replace(/\s*[（(【]\s*(?:source|来源|ソース)\s*[#:：]?\s*\d+\s*[)）】]/gi, "")
    .replace(/\s*(?:source|来源|ソース)\s*[#:：]?\s*\d+\b/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanExcerpt(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > EXCERPT_CHARS ? t.slice(0, EXCERPT_CHARS).trimEnd() + "…" : t;
}

function toCitation(
  scored: Scored,
  sourceIdByFilename: Map<string, string>
): OutCitation {
  const { chunk } = scored;
  return {
    sourceId: sourceIdByFilename.get(chunk.filename) ?? chunk.filename,
    filename: chunk.filename,
    page: chunk.page,
    excerpt: cleanExcerpt(chunk.text),
  };
}

/** Collapse citations that point at the same file+page (keep first excerpt). */
function dedupeCitations(cites: OutCitation[], limit = 3): OutCitation[] {
  const seen = new Set<string>();
  const out: OutCitation[] = [];
  for (const c of cites) {
    const key = `${c.filename}#${c.page}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

/** Extractive fallback used when no API key is configured. */
function extractiveAnswer(
  question: string,
  retrieved: Scored[],
  language: QueryLang,
  seconds: number,
  sourceIdByFilename: Map<string, string>
): OutAnswer {
  const best = retrieved[0];
  if (!best || best.score < MIN_RELEVANCE || corpusCoverage(question) < MIN_COVERAGE) {
    return {
      text: NOT_FOUND[language],
      responseSeconds: seconds,
      citations: [],
      notFound: true,
      mode: "extractive",
    };
  }
  const cites = dedupeCitations(
    retrieved.map((s) => toCitation(s, sourceIdByFilename))
  );
  return {
    text: `${EXTRACTIVE_PREFIX[language]}\n\n${cleanExcerpt(best.chunk.text)}`,
    responseSeconds: seconds,
    citations: cites,
    mode: "extractive",
  };
}

const LANG_NAME: Record<QueryLang, string> = {
  en: "English",
  zh: "Chinese (简体中文)",
  ja: "Japanese (日本語)",
};

const SYSTEM_PROMPT = (language: QueryLang) => `You are Gainwise Sales Copilot, an assistant for a Hong Kong B2B trading company. Sales reps ask you technical and commercial questions about products; you answer strictly from the retrieved catalog passages provided in the user message.

Hard rules:
- Answer ONLY using facts stated in the numbered SOURCES. Never use outside knowledge or guess.
- Every factual claim must be grounded in a source you cite. Only cite sources you actually used.
- If the SOURCES do not contain enough information to answer, you MUST set "found" to false. Do not fabricate a partial answer.
- Answer in ${LANG_NAME[language]}, regardless of the language of the sources. Translate facts from the source language into ${LANG_NAME[language]} as needed.
- Be concise and factual, like an internal tool — no marketing tone. Use **bold** for the key figure or answer.
- Do NOT write source references such as "SOURCE 3", "(SOURCE 5)" or file names inside the answer text — the sources are reported separately in source_numbers.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{"found": boolean, "answer": string, "source_numbers": number[]}
where:
- "found" is true only if the SOURCES actually answer the question,
- "answer" is the grounded answer in ${LANG_NAME[language]} (empty string if found is false),
- "source_numbers" lists the 1-based SOURCE numbers you actually used (empty array if found is false).`;

function buildContext(retrieved: Scored[]): string {
  return retrieved
    .map(
      (s, i) =>
        `[SOURCE ${i + 1}] file="${s.chunk.filename}" page=${s.chunk.page} lang=${s.chunk.language}\n${s.chunk.text}`
    )
    .join("\n\n---\n\n");
}

interface ParsedAnswer {
  found?: boolean;
  answer?: string;
  source_numbers?: number[];
}

/** Call DeepSeek (JSON mode) and return the parsed structured answer. */
async function callDeepSeek(
  apiKey: string,
  system: string,
  user: string
): Promise<ParsedAnswer> {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as ParsedAnswer;
  } catch {
    return {};
  }
}

export async function generateAnswer(opts: {
  question: string;
  retrieved: Scored[];
  language: QueryLang;
  apiKey?: string;
  sourceIdByFilename: Map<string, string>;
}): Promise<OutAnswer> {
  const { question, language, apiKey, sourceIdByFilename } = opts;
  const retrieved = opts.retrieved.slice(0, MAX_CONTEXT_CHUNKS);
  const started = Date.now();

  // No key → extractive fallback (keeps the app fully clickable offline).
  if (!apiKey) {
    return extractiveAnswer(
      question,
      retrieved,
      language,
      (Date.now() - started) / 1000,
      sourceIdByFilename
    );
  }

  if (retrieved.length === 0) {
    return {
      text: NOT_FOUND[language],
      responseSeconds: (Date.now() - started) / 1000,
      citations: [],
      notFound: true,
      mode: "llm",
    };
  }

  const input = await callDeepSeek(
    apiKey,
    SYSTEM_PROMPT(language),
    `QUESTION: ${question}\n\nSOURCES:\n\n${buildContext(retrieved)}`
  );

  const seconds = (Date.now() - started) / 1000;

  if (!input.found || !input.answer) {
    return {
      text: NOT_FOUND[language],
      responseSeconds: seconds,
      citations: [],
      notFound: true,
      mode: "llm",
    };
  }

  // Rebuild citations from the real retrieved chunks the model referenced.
  const nums = Array.from(new Set(input.source_numbers ?? []))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= retrieved.length)
    .slice(0, 3);

  const citations = dedupeCitations(
    nums.map((n) => toCitation(retrieved[n - 1], sourceIdByFilename))
  );

  // Grounding safety net: an answer with no valid citation is treated as
  // not-found rather than shown ungrounded.
  if (citations.length === 0) {
    return {
      text: NOT_FOUND[language],
      responseSeconds: seconds,
      citations: [],
      notFound: true,
      mode: "llm",
    };
  }

  return {
    text: stripSourceMarkers(input.answer),
    responseSeconds: seconds,
    citations,
    mode: "llm",
  };
}
