import type { Language, SourceType } from "../types";

export const LANGUAGES: { id: Language; label: string; native: string }[] = [
  { id: "en", label: "English", native: "EN" },
  { id: "zh", label: "Chinese", native: "中文" },
  { id: "ja", label: "Japanese", native: "日本語" },
];

/** Short tag shown on knowledge-base rows. */
export const LANG_TAG: Record<Language, string> = {
  en: "EN",
  zh: "中文",
  ja: "日本語",
};

export const SOURCE_META: Record<
  SourceType,
  { label: string; short: string }
> = {
  catalog: { label: "PDF catalog", short: "Catalog" },
  internal: { label: "Internal doc", short: "Internal" },
  wechat: { label: "WeChat export", short: "WeChat" },
};

/** Localized copy for the empty chat state + input, keyed by UI language. */
export const COPY: Record<
  Language,
  {
    emptyTitle: string;
    emptyBody: string;
    inputPlaceholder: string;
    suggestedLabel: string;
    thinking: string;
  }
> = {
  en: {
    emptyTitle: "Ask about any product, spec, or policy",
    emptyBody:
      "Get cited answers pulled straight from manufacturer catalogs, internal policy docs, and WeChat exports. Every answer links back to its source page.",
    inputPlaceholder: "Ask a technical or commercial question…",
    suggestedLabel: "Suggested questions",
    thinking: "Searching the knowledge base…",
  },
  zh: {
    emptyTitle: "询问任何产品、规格或政策",
    emptyBody:
      "从厂商目录、内部政策文档和微信记录中获取带引用的答案。每个回答都可追溯到来源页面。",
    inputPlaceholder: "输入技术或商务问题…",
    suggestedLabel: "推荐问题",
    thinking: "正在检索知识库…",
  },
  ja: {
    emptyTitle: "製品・仕様・ポリシーについて質問",
    emptyBody:
      "メーカーカタログ、社内ポリシー文書、WeChat エクスポートから出典付きの回答を取得します。すべての回答は出典ページにリンクされます。",
    inputPlaceholder: "技術・商談に関する質問を入力…",
    suggestedLabel: "質問の候補",
    thinking: "ナレッジベースを検索中…",
  },
};

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
