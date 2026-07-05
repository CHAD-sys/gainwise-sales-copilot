// Vite plugin that mounts the RAG API on the dev server itself — so a single
// `npm run dev` runs the whole app (frontend + retrieval + generation) with no
// second process, proxy, or CORS. The handlers run in Vite's Node context.

import type { Connect, Plugin, ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import {
  loadIndex,
  indexReady,
  listAllSources,
  retrieve,
  detectLanguage,
} from "./rag.ts";
import { generateAnswer } from "./generate.ts";

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(json);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
  });
}

export function ragApiPlugin(apiKey?: string): Plugin {
  return {
    name: "gainwise-rag-api",
    configureServer(server: ViteDevServer) {
      const { chunkCount, ok } = loadIndex();
      if (!ok) {
        server.config.logger.warn(
          "[gainwise] No index found. Run:  npm run ingest"
        );
      } else {
        server.config.logger.info(
          `[gainwise] RAG index loaded: ${chunkCount} chunks · generation: ${
            apiKey ? "DeepSeek API" : "extractive fallback (no DEEPSEEK_API_KEY)"
          }`
        );
      }

      const filenameToId = new Map<string, string>();
      for (const s of listAllSources() as { id: string; filename: string }[]) {
        filenameToId.set(s.filename, s.id);
      }

      server.middlewares.use(
        "/api/sources",
        (_req: Connect.IncomingMessage, res: ServerResponse) => {
          send(res, 200, { sources: listAllSources() });
        }
      );

      // Stream an ingested catalog for download. Only serves files that exist
      // inside data/catalogue_pdfs/ (path-traversal safe via basename).
      const PDF_DIR = path.join(process.cwd(), "data", "catalogue_pdfs");
      server.middlewares.use(
        "/api/source-file",
        (req: Connect.IncomingMessage, res: ServerResponse) => {
          const url = new URL(req.url ?? "", "http://localhost");
          const requested = url.searchParams.get("f") ?? "";
          const name = path.basename(requested); // strip any directory parts
          const full = path.join(PDF_DIR, name);
          if (!name || !full.startsWith(PDF_DIR) || !fs.existsSync(full)) {
            return send(res, 404, { error: "File not available for download." });
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename*=UTF-8''${encodeURIComponent(name)}`
          );
          fs.createReadStream(full).pipe(res);
        }
      );

      server.middlewares.use(
        "/api/ask",
        async (req: Connect.IncomingMessage, res: ServerResponse) => {
          if (req.method !== "POST") return send(res, 405, { error: "POST only" });
          try {
            const { question } = JSON.parse((await readBody(req)) || "{}");
            if (!question || typeof question !== "string") {
              return send(res, 400, { error: "Missing 'question'." });
            }
            if (!indexReady()) {
              return send(res, 503, {
                error: "Index not built. Run `npm run ingest` first.",
              });
            }

            const language = detectLanguage(question);
            const retrieved = retrieve(question, 8);
            const answer = await generateAnswer({
              question,
              retrieved,
              language,
              apiKey,
              sourceIdByFilename: filenameToId,
            });
            send(res, 200, { answer });
          } catch (err) {
            server.config.logger.error(`[gainwise] /api/ask failed: ${err}`);
            send(res, 500, {
              error: "Generation failed. See server logs.",
              detail: String(err),
            });
          }
        }
      );
    },
  };
}
