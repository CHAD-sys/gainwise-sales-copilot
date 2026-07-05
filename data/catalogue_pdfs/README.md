# Source catalogs

Drop the PDF catalogs / documents you want the copilot to answer from **into
this folder**, then build the index:

```bash
npm run ingest        # first build
npm run reingest      # rebuild after adding/removing files
```

- Mixed **English / 中文 / 日本語** PDFs are supported.
- Text-layer and scanned/image PDFs both work (scanned pages fall back to
  vision OCR — see the root `README.md`).
- The generated index is written to `../index/` (git-ignored).

The vendor catalogs used during development are **not committed** — they're
third-party copyrighted material. Bring your own.
