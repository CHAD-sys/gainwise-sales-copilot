// Shared domain types for Gainwise Sales Copilot.
// Phase 2 note: these are the contracts the real pipeline must satisfy.
// Keep them stable so the UI never needs to change when the mock layer is
// swapped for a live backend.

export type Language = "en" | "zh" | "ja";

export type SourceType = "catalog" | "internal" | "wechat";

export type IngestStatus = "indexed" | "processing" | "queued";

export interface KnowledgeSource {
  id: string;
  filename: string;
  type: SourceType;
  language: Language;
  status: IngestStatus;
  /** Human label e.g. "Manufacturer catalog" */
  kind: string;
  pages: number;
  sizeLabel: string;
  updatedLabel: string;
  /** 0–100, only meaningful while status === "processing" */
  progress?: number;
}

export interface Citation {
  sourceId: string;
  filename: string;
  page: number;
  /** Realistic excerpt shown in the right-side source panel */
  excerpt: string;
  /** Optional heading/section context for the excerpt */
  section?: string;
}

export interface Answer {
  /** Rendered as the assistant bubble body (supports simple **bold**) */
  text: string;
  /** Displayed response time in seconds, e.g. 2.3 -> "Answered in 2.3s" */
  responseSeconds: number;
  citations: Citation[];
  /** true = graceful "not in the knowledge base" state (amber, not error) */
  notFound?: boolean;
}

export interface SuggestedQuestion {
  id: string;
  language: Language;
  text: string;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  /** Present on assistant messages once resolved */
  answer?: Answer;
  /** Present while the assistant message is streaming/thinking */
  pending?: boolean;
  timestamp: number;
}
