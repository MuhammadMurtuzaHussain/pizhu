# Pīzhù 批注

**Margin notes for academic English.** An open-source writing tutor for Mandarin-speaking students at universities in the UK and Ireland, powered by [Gemma 4](https://ai.google.dev/gemma).

Pīzhù **annotates, it doesn't rewrite.** It highlights the exact words a UK marker would hesitate over and explains why — in English and in Chinese (简体 or 繁體) — including *why a Mandarin speaker tends to write it that way*. At most it offers a tiny nudge. The student makes the change, so the work stays theirs.

Built for my friend Joy, who studies Global Mass Communication.

## What it does

- **Annotated feedback** across 12 categories drawn from EAP teaching and Mandarin→English transfer: articles, countability, tense and agreement, comma splices (一逗到底), topic-first sentences, linking words, register, hedging, translated set phrases (“With the development of society…”), collocation, UK/Irish conventions and Harvard referencing.
- **A no-rewrite guardrail in code** ([`src/lib/guard.ts`](src/lib/guard.ts)): every highlighted span must exist verbatim in the student's text, and any suggested fix that changes more than a few words is stripped back to a hint.
- **Reference checker**: matches in-text citations against the reference list and looks each source up on Google Scholar via SerpApi to flag sources that may not exist. Only reference titles are sent — never essay text.
- **My habits**: counts of recurring patterns, stored only in your browser.
- **Bilingual interface**: English, 简体中文, 繁體中文; explanations in English, Chinese or both.

## Run it locally (private — nothing leaves your laptop)

Requires [Node 20+](https://nodejs.org), [pnpm](https://pnpm.io) and [Ollama](https://ollama.com) ≥ 0.35.

```bash
ollama pull gemma4:e4b        # ~6.6 GB; use gemma4:12b or gemma4:26b with 32 GB+ RAM
git clone https://github.com/MuhammadMurtuzaHussain/pizhu && cd pizhu
pnpm install
cp .env.example .env.local    # optional: add SERPAPI_API_KEY for Scholar lookups
pnpm dev                      # http://localhost:3000
```

## Hosted demo mode

Set `MODEL_PROVIDER=google` and `GOOGLE_GENERATIVE_AI_API_KEY` to serve Gemma 4 26B-A4B through Google AI Studio's free tier. [`render.yaml`](render.yaml) deploys this to Render.

## How it's built

| Piece | What it does |
|---|---|
| **Gemma 4** (open weights, Apache 2.0) | The only model. E4B locally via Ollama; 26B-A4B hosted via AI Studio. |
| **Mastra** | `tutorAgent` and `librarianAgent` with Zod-typed structured output; the reference check is a Mastra workflow (extract → match → verify). |
| **SerpApi** | Google Scholar lookups for the reference checker. |
| **Next.js** | UI and streaming API (`/api/analyze` streams paragraph results as NDJSON). |

```
src/
  mastra/agents/       tutor + librarian agents, prompts
  mastra/workflows/    references workflow (Gemma → deterministic match → Scholar)
  mastra/tools/        SerpApi Google Scholar tool
  lib/guard.ts         the no-rewrite guardrail
  lib/citations.ts     Harvard in-text ↔ reference-list matcher
  lib/taxonomy.ts      the 12 categories, in EN / 简 / 繁
eval/                  hand-written fixtures + `pnpm eval` to compare Gemma sizes
```

## Tests and evaluation

```bash
pnpm test                               # guardrail + citation unit tests
pnpm eval                               # recall on eval/fixtures.ts with the configured model
OLLAMA_MODEL=gemma4:12b pnpm eval       # compare another Gemma size
```

## Licence

MIT
