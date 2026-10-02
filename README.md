<p align="center">
  <a href="https://pizhu.onrender.com"><img src="https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/src/app/opengraph-image.png" alt="Pīzhù 批注: margin notes, not rewrites. Mòmo the ink panda holding a bubble tea." width="100%" /></a>
</p>

<p align="center">
  <b>Margin notes, not rewrites.</b> An open-source writing tutor for Mandarin-speaking students at UK and Irish universities, powered by open-weight <b>Gemma 4</b>.
</p>

<p align="center">
  <a href="https://pizhu.onrender.com"><b>Live demo</b></a> ·
  <a href="https://dev.to/muhammadmurtuzahussain">DEV post</a> ·
  <a href="#run-it-locally-private-nothing-leaves-your-laptop">Run locally</a> ·
  Built for the <a href="https://dev.to/challenges/hacktoberfest-weekend-2026-10-01">DEV Hacktoberfest Weekend Challenge</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/demo.gif" alt="A Chinglish sentence gets marker-pen underlines and bilingual margin notes" width="760" />
</p>

## Why

My friend Joy is doing an MA in Global Mass Communication in an Irish University. Her ideas are sharp; her marks lose points to a small set of habits that make perfect sense in Chinese and read badly to a British marker: no articles (中文没有冠词), comma splices (一逗到底), exam-template phrases ("With the development of society…"), and confident claims (众所周知).

Grammar tools and chatbots **rewrite** the paragraph. It sounds fluent, it stops sounding like her, she learns nothing, and in an Irish university it is an academic-integrity risk.

Pīzhù does what a good tutor does in the margin: it points at the exact words, explains *why* in English and Chinese (简体 or 繁體), including **why a Mandarin speaker tends to write it that way**, and leaves the fixing to the student.

## What it does

| | |
|---|---|
| **True margin notes** | The essay sits on grid paper; every note floats beside its line, joined to its words by an ink connector. |
| **Never rewrites (enforced in code)** | Every highlighted span must exist verbatim in the student's text, and any suggested fix that changes more than a few words is stripped back to a hint ([`src/lib/guard.ts`](src/lib/guard.ts)). |
| **Word export** | Download your own text, unchanged, with every note as a real Word comment in the margin. |
| **Lesson mode** | One note at a time, tapioca-pearl progress, keyboard controls, and a shareable progress card (no essay text in it). |
| **Mòmo 墨墨** | An ink-panda companion who reads with you, cheers you on and stamps 好 when you are done. |
| **Reference check** | Harvard in-text citations are matched against the reference list, and every source is looked up on Google Scholar via SerpApi to flag ones that may not exist. Only titles are sent. |
| **Stamp book 集章册** | Work through three notes of a habit to earn its stamp; habit counts stay in the browser. |
| **Bilingual by design** | Interface in English, 简体中文 and 繁體中文; explanations in English, Chinese or both; Chinese set in 霞鹜文楷 so it reads like a teacher's handwriting. |

## Screenshots

| Margin notes | Lesson mode |
|---|---|
| <img src="https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/margin-notes.png" alt="Essay on grid paper with notes in the margin" /> | <img src="https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/lesson.png" alt="One note at a time with pearl progress" /> |
| **Stamp book** | **Mobile, dark, 简体中文** |
| <img src="https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/habits.png" alt="The 集章 stamp book" /> | <img src="https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/mobile-sheet-dark.png" width="300" alt="Mobile bottom sheet in dark mode" /> |

## Run it locally (private: nothing leaves your laptop)

Requires [Node 20+](https://nodejs.org), [pnpm](https://pnpm.io) and [Ollama](https://ollama.com) 0.35 or newer.

```bash
ollama pull gemma4:e4b        # ~6.6 GB. With 32 GB+ RAM try gemma4:12b or gemma4:26b
git clone https://github.com/MuhammadMurtuzaHussain/pizhu && cd pizhu
pnpm install
cp .env.example .env.local    # optional: add SERPAPI_API_KEY for Scholar lookups
pnpm dev                      # http://localhost:3000
```

## Hosted demo mode

Set `MODEL_PROVIDER=google` and `GOOGLE_GENERATIVE_AI_API_KEY` to serve **Gemma 4 26B-A4B** through Google AI Studio with thinking set to `minimal` (about 30 s per paragraph instead of 5 minutes). [`render.yaml`](render.yaml) deploys this to Render.

## How it is built

| Piece | Role |
|---|---|
| **Gemma 4** (open weights, Apache 2.0) | The only model. E4B or 12B locally via Ollama; 26B-A4B hosted via AI Studio. |
| **Mastra** | `tutorAgent` and `librarianAgent` with Zod-typed structured output; the reference check is a Mastra workflow (extract → match → verify). |
| **SerpApi** | Google Scholar lookups, using the `author:` operator first so the work itself wins over reviews of it. |
| **Next.js + Motion** | Streaming UI (`/api/analyze` streams paragraph results as NDJSON), margin layout, lesson mode, Mòmo. |

```
src/
  mastra/agents/       tutor + librarian agents and prompts
  mastra/workflows/    reference workflow (Gemma → deterministic match → Scholar)
  lib/guard.ts         the no-rewrite guardrail
  lib/spelling.ts      rule-based British spelling (rules for lookups, Gemma for judgement)
  lib/citations.ts     Harvard in-text ↔ reference-list matcher
  lib/taxonomy.ts      the 12 habits, in EN / 简 / 繁
  components/          MarginPaper, LessonMode, Mòmo, DemoHero, …
eval/                  hand-written fixtures + `pnpm eval` to compare Gemma sizes
```

## Evaluation

Fifteen hand-written paragraphs seeded with known habits, plus two clean ones to catch over-flagging, run through the same pipeline:

| Model (where it runs) | Recall | Must-fix notes on clean paragraphs | Seconds / paragraph |
|---|---|---|---|
| Gemma 4 E4B (laptop, 16 GB) | 84.2% | 1 | 12.8 |
| Gemma 4 12B (laptop, 16 GB) | 94.7% | 0 | 34.1 |
| Gemma 4 26B-A4B (AI Studio) | 89.5% | 0 | 25.4 |

Across these runs Gemma proposed 89 small fixes and the guardrail turned 8 of them back into hints.

```bash
pnpm test                               # guardrail, spelling, citation and Word-export tests
pnpm eval                               # recall on eval/fixtures.ts with the configured model
OLLAMA_MODEL=gemma4:12b pnpm eval       # compare another Gemma size
```

## Privacy

- Local mode: the essay is processed by Gemma on your own machine.
- Hosted demo: text goes to Gemma on Google AI Studio and is not stored by Pīzhù.
- Reference check: only reference titles (and first author) go to SerpApi.
- Drafts, habits and stamps are kept in your browser's local storage; nothing is uploaded.

Pīzhù gives feedback, never grades. Always follow your university's guidance on AI tools.

## Credits

Made by [Muhammad Murtuza Hussain](https://dev.to/muhammadmurtuzahussain) for Joy, for the DEV Hacktoberfest Weekend Challenge (Build for a Friend), October 2026. Built with AI assistance (Claude Code). MIT licensed.
