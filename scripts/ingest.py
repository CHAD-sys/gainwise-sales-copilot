#!/usr/bin/env python3
"""
Gainwise Sales Copilot — ingestion (Phase 2).

For each PDF in data/catalogue_pdfs/:
  1. Extract text per page with PyMuPDF.
  2. If a page's text layer is empty/near-empty (scanned/image page — common in
     JP/CN catalogs), render the page to a PNG and ask the Claude API (vision)
     to transcribe the visible text verbatim, preserving language.
  3. Chunk each page into ~300-500 token sections split on paragraph breaks.
  4. Write:
        data/index/chunks.json   — [{ id, text, filename, page, language }]
        data/index/sources.json  — one entry per (deduped) source file

Run:  python3 scripts/ingest.py           (text layer only; no key needed)
      ANTHROPIC_API_KEY=... python3 scripts/ingest.py   (enables OCR fallback)

Output is cached to disk so we don't reparse on every app start. Re-run to
rebuild; pass --force to ignore the cache.
"""

import base64
import hashlib
import json
import os
import re
import sys
import time

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("PyMuPDF is required:  python3 -m pip install pymupdf")

PDF_DIR = os.path.join("data", "catalogue_pdfs")
INDEX_DIR = os.path.join("data", "index")
CHUNKS_PATH = os.path.join(INDEX_DIR, "chunks.json")
SOURCES_PATH = os.path.join(INDEX_DIR, "sources.json")

# A page with fewer than this many characters of extractable text is treated
# as scanned/image and routed to vision OCR.
MIN_TEXT_CHARS = 24

# Chunking budget in characters. ~1500 chars ≈ 350-450 tokens for latin text
# and a comparable amount for CJK; we split on paragraph/line boundaries and
# never mid-line. A small overlap preserves context across chunk boundaries.
CHUNK_TARGET_CHARS = 1500
CHUNK_MAX_CHARS = 2100
CHUNK_OVERLAP_CHARS = 160

VISION_MODEL = "claude-sonnet-5"

CJK = r"぀-ヿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ"
HAN = r"㐀-䶿一-鿿豈-﫿"
KANA = r"぀-ゟ゠-ヿｦ-ﾟ"


def detect_language(text: str) -> str:
    """Return 'ja' | 'zh' | 'en' from script content."""
    if re.search(f"[{KANA}]", text):
        return "ja"
    if re.search(f"[{HAN}]", text):
        return "zh"
    return "en"


def slugify(name: str) -> str:
    base = os.path.splitext(name)[0]
    base = re.sub(r"[^\w一-鿿]+", "-", base, flags=re.UNICODE)
    return base.strip("-").lower() or "src"


def kind_for(filename: str, language: str) -> str:
    return "Manufacturer catalog"


def human_size(num_bytes: int) -> str:
    mb = num_bytes / (1024 * 1024)
    if mb >= 1:
        return f"{mb:.1f} MB"
    return f"{num_bytes / 1024:.0f} KB"


# ── OCR fallback ────────────────────────────────────────────────────────────

_anthropic_client = None


def get_anthropic():
    global _anthropic_client
    if _anthropic_client is not None:
        return _anthropic_client
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None
    try:
        import anthropic
    except ImportError:
        print("  ! ANTHROPIC_API_KEY set but 'anthropic' package missing; "
              "run: python3 -m pip install anthropic  (skipping OCR)")
        return None
    _anthropic_client = anthropic.Anthropic()
    return _anthropic_client


def ocr_page(page) -> str:
    """Render a page to PNG and transcribe it with Claude vision."""
    client = get_anthropic()
    if client is None:
        return ""
    pix = page.get_pixmap(dpi=170)
    png = pix.tobytes("png")
    b64 = base64.standard_b64encode(png).decode("ascii")
    try:
        msg = client.messages.create(
            model=VISION_MODEL,
            max_tokens=2048,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {
                        "type": "base64", "media_type": "image/png", "data": b64}},
                    {"type": "text", "text": (
                        "Transcribe ALL visible text from this catalog page "
                        "verbatim. Preserve the original language (English, "
                        "Chinese, or Japanese) exactly — do not translate. "
                        "Keep tables as readable lines. Output only the "
                        "transcribed text, no commentary.")},
                ],
            }],
        )
        return "".join(b.text for b in msg.content if b.type == "text").strip()
    except Exception as e:  # noqa: BLE001
        print(f"  ! OCR failed on a page: {e}")
        return ""


# ── Chunking ────────────────────────────────────────────────────────────────

def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_page_text(text: str):
    """Split a page's text into ~CHUNK_TARGET_CHARS pieces on line boundaries."""
    text = normalize_text(text)
    if not text:
        return []
    lines = [ln.strip() for ln in text.split("\n")]
    chunks, buf, size = [], [], 0

    def flush():
        nonlocal buf, size
        if buf:
            chunks.append("\n".join(buf).strip())
            buf, size = [], 0

    for ln in lines:
        if not ln:
            continue
        # Hard-split pathologically long single lines (dense tables).
        while len(ln) > CHUNK_MAX_CHARS:
            head, ln = ln[:CHUNK_MAX_CHARS], ln[CHUNK_MAX_CHARS:]
            if buf:
                flush()
            chunks.append(head)
        if size + len(ln) + 1 > CHUNK_TARGET_CHARS and buf:
            flush()
        buf.append(ln)
        size += len(ln) + 1
    flush()

    # Add overlap tail from the previous chunk for context continuity.
    if CHUNK_OVERLAP_CHARS and len(chunks) > 1:
        with_overlap = [chunks[0]]
        for i in range(1, len(chunks)):
            tail = chunks[i - 1][-CHUNK_OVERLAP_CHARS:]
            with_overlap.append((tail + "\n" + chunks[i]).strip())
        chunks = with_overlap
    return [c for c in chunks if len(c.strip()) >= 12]


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    force = "--force" in sys.argv
    if not os.path.isdir(PDF_DIR):
        sys.exit(f"Missing {PDF_DIR}")
    os.makedirs(INDEX_DIR, exist_ok=True)

    if os.path.exists(CHUNKS_PATH) and not force:
        print(f"Index already exists at {CHUNKS_PATH}. Use --force to rebuild.")
        return

    pdfs = sorted(f for f in os.listdir(PDF_DIR) if f.lower().endswith(".pdf"))
    seen_hashes = {}
    all_chunks = []
    sources = []
    ocr_pages = 0

    for filename in pdfs:
        path = os.path.join(PDF_DIR, filename)
        digest = hashlib.md5(open(path, "rb").read()).hexdigest()
        if digest in seen_hashes:
            print(f"↷ skip duplicate: {filename} (same as {seen_hashes[digest]})")
            continue
        seen_hashes[digest] = filename

        doc = fitz.open(path)
        slug = slugify(filename)
        file_lang_votes = {"en": 0, "zh": 0, "ja": 0}
        file_chunk_count = 0
        print(f"→ {filename} ({doc.page_count}pp)")

        for pno in range(doc.page_count):
            page = doc[pno]
            text = page.get_text("text").strip()
            if len(text) < MIN_TEXT_CHARS:
                ocr_text = ocr_page(page)
                if ocr_text:
                    ocr_pages += 1
                    text = ocr_text
                    print(f"    · page {pno + 1}: OCR ({len(text)} chars)")
                else:
                    continue

            page_lang = detect_language(text)
            file_lang_votes[page_lang] += 1
            for ci, chunk_text in enumerate(chunk_page_text(text)):
                all_chunks.append({
                    "id": f"{slug}-p{pno + 1}-c{ci}",
                    "text": chunk_text,
                    "filename": filename,
                    "page": pno + 1,
                    "language": detect_language(chunk_text),
                })
                file_chunk_count += 1

        file_lang = max(file_lang_votes, key=file_lang_votes.get)
        sources.append({
            "id": f"src-{slug}",
            "filename": filename,
            "type": "catalog",
            "language": file_lang,
            "status": "indexed",
            "kind": kind_for(filename, file_lang),
            "pages": doc.page_count,
            "sizeLabel": human_size(os.path.getsize(path)),
            "updatedLabel": "Indexed",
            "chunkCount": file_chunk_count,
        })
        doc.close()

    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=1)
    with open(SOURCES_PATH, "w", encoding="utf-8") as f:
        json.dump(sources, f, ensure_ascii=False, indent=2)

    print(f"\n✓ {len(sources)} sources, {len(all_chunks)} chunks "
          f"({ocr_pages} OCR pages) → {CHUNKS_PATH}")


if __name__ == "__main__":
    t0 = time.time()
    main()
    print(f"  done in {time.time() - t0:.1f}s")
