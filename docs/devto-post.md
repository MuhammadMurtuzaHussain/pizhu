---
title: "Pīzhù 批注: an open-source writing tutor that annotates and never rewrites, built for my friend Joy"
published: false
tags: devchallenge, weekendchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

My friend **Joy** is doing an MA in Global Mass Communication in the UK. Her first language is Mandarin. She reads theory in two languages, argues well, and still gets essays back with comments like *"expression needs work"* and *"be careful with academic tone"*.

[TODO: one or two sentences in your own words: how you know Joy, a specific moment you saw this happen, and how it affected her confidence.]

I've seen the same pattern with a lot of friends from China and Taiwan. The marks they lose are rarely about ideas. They come from a small set of habits that make perfect sense in Chinese and read badly to a British marker:

- **No articles.** Mandarin has no *a* or *the*, so *"The society is changing"* feels natural.
- **一逗到底 ("one comma all the way").** In Chinese, a sentence can run through commas until the thought is complete. In English that is a comma splice.
- **Exam-template English.** *"With the development of society…"*, *"In a word…"*, *"Last but not least…"* were taught as good style for 高考 and IELTS. A UK marker reads them as filler.
- **Confident claims.** *"This proves…"* and *"Everyone knows…"* (众所周知) are persuasive in Chinese argumentative writing. In a UK essay they are unsupported.

The usual tools make this worse. Grammarly and ChatGPT **rewrite** the paragraph. The result sounds fluent but no longer sounds like the student, they learn nothing, and in a UK university an AI-rewritten essay is an academic-integrity problem.

So I built **Pīzhù (批注)**, which means "margin notes". It's the red-ink comments a good teacher writes beside your work. Pīzhù does exactly that:

- It highlights the **exact words** a UK marker would hesitate over.
- It explains **what's wrong** in English and in Chinese (简体 or 繁體).
- It explains **why a Mandarin speaker tends to write it that way**, kindly and as a habit rather than a mistake.
- It gives a **hint**, and at most a **tiny nudge** of a few words.
- **It never rewrites.** Joy makes every change herself.

It also checks her **reference list** against Google Scholar, flagging sources that can't be found or whose details don't match. It keeps a private record of her **recurring habits**, and it explains the 12 most common habits in a bilingual glossary.

[TODO: screenshot of the annotated view: one paragraph with highlights and an open note card, 双语 mode]

## Demo

- **Live demo (hosted Gemma):** [TODO: Render URL]
- **Video (running fully offline on my laptop):** [TODO: YouTube/Loom embed: paste the sample, show cards streaming in, switch to 简体, open a note, the reference check flagging the fake source]

The sample essay in the app is something I wrote for testing. It's full of these habits, and it includes one reference I invented on purpose so you can watch the checker catch it.

## Code

{% github MuhammadMurtuzaHussain/pizhu %}

## How I Built It

**Gemma 4 is the only model in Pīzhù.** It's open weights under Apache 2.0, and the same model family runs in two places:

| Where | Model | Why |
|---|---|---|
| Joy's laptop (default) | `gemma4:e4b` or `gemma4:12b` via **Ollama** | Her coursework never leaves her machine |
| Hosted demo | `gemma-4-26b-a4b-it` via **Google AI Studio** | So judges can try it without installing anything |

One environment variable switches between them.

```
Next.js UI ──► /api/analyze (streams NDJSON, one paragraph at a time)
                 │
                 ▼
          Mastra tutorAgent ──► Gemma 4 (structured output, Zod schema)
                 │
                 ▼
          guard.ts  ← the "no rewrite" rule, enforced in code
                 │
                 ▼
          + rule-based British spelling notes  →  margin cards

References tab ──► Mastra workflow:
          extract (Gemma) → match citations (deterministic) → verify (SerpApi Google Scholar)
```

### 1. Teaching Gemma to annotate, not rewrite

The tutor is a [Mastra](https://mastra.ai) agent with a long system prompt written like a brief for a writing-centre tutor. It describes 12 categories, each pairing a UK convention with the Mandarin habit behind it, and gives Gemma a checklist to scan for: every comma, every *As for…*, every bare countable noun.

Gemma returns structured JSON validated with Zod. The schema has **no field for a rewritten paragraph**. The only text Gemma can propose is an optional `nudge`.

### 2. Not trusting the prompt: the guardrail

Prompts are requests, not guarantees. So `guard.ts` checks every note before Joy sees it:

1. **The highlighted span must exist in her text**, allowing for curly quotes and whitespace. If Gemma "quotes" something she didn't write, the note is dropped.
2. **A nudge may change at most `max(4, 30%)` of the span's words**, measured by word-level Levenshtein distance. Anything bigger is **stripped back to a hint**, and the card says *"Try this one yourself."*
3. **Spans that cross a sentence boundary never get a nudge.** Restructuring is the student's job.

```ts
export function nudgeAllowed(span: string, nudge: string): boolean {
  if (!nudge.trim() || nudge.trim() === span.trim()) return false;
  if (words(span).length > 25) return false;
  if (crossesSentence(span)) return false;
  return wordEditDistance(span, nudge) <= Math.max(4, Math.ceil(words(span).length * 0.3));
}
```

Across my evaluation runs on three Gemma sizes, Gemma proposed 89 nudges and the guard stripped 8 of them back to hints. Most of those came from the smallest model, which is exactly where you want a safety net. The UI tells the student when this happens.

### 3. Rules for what rules do best

The small model was unreliable at spotting American spellings, so I stopped asking it. A word list catches *analyze → analyse* and *behavior → behaviour* every time, and those notes are merged with Gemma's. The model handles the judgement calls; the rules handle the lookups.

### 4. Checking references (SerpApi)

Fabricated or garbled references are a growing problem, so the References tab runs a three-step Mastra workflow:

1. **Gemma extracts** each entry (authors, year, title) and adds Harvard formatting *hints*, never a corrected entry.
2. **A deterministic matcher** pairs in-text citations like `(Hall, 1980)` and `Couldry and Hepp (2017)` with the list, and reports anything cited but not listed, or listed but never cited.
3. **SerpApi's Google Scholar engine** looks up each title. The result is ✅ found, ≈ found but the year or author differs, or ❓ couldn't find it, so check it exists.

Two real-world snags I hit and fixed: Scholar often drops subtitles (*"Understanding media"* for *Understanding Media: The Extensions of Man*), and the top hit is sometimes a **book review** of the work. The matcher compares main titles and prefers the result whose metadata line names the author and year. Only reference titles are sent to SerpApi, never essay text.

### 5. Built for Joy specifically

- The interface is in **English / 简体 / 繁體**, and the explanation language is set separately (English, 中文 or both).
- Category names are always shown bilingually, e.g. *Articles · 冠词*, so she learns the English grammar term alongside the Chinese.
- The colours are rice paper and **vermilion (朱)**, the ink of traditional 批注. Severities are soft underlines rather than a wall of red pen.
- "Marker's eye" summaries use UK marking dimensions (argument, structure, language, referencing) and **never give a grade**.

## Why Does Open Innovation Matter?

This project only makes sense with open models, for four reasons.

**1. Privacy and academic integrity.** Pasting unsubmitted coursework into a third-party chatbot means handing it to a server you don't control, and many universities' AI guidance warns students to be careful about exactly that. With Gemma running in Ollama, Joy's drafts stay on her laptop. The app shows that with a badge: *🔒 Local: your essay never leaves this laptop.*

**2. Control over behaviour.** Closed chat products are designed to produce the answer. I needed the opposite: a model that points and explains but doesn't fix. With an open model inside my own pipeline, I could enforce that rule in code (the guardrail above) instead of hoping a prompt holds.

**3. Being able to swap models, and measure it.** I wrote 15 test paragraphs, each seeded with known habits, plus two clean ones to catch over-flagging. Then I ran the same pipeline on three sizes of Gemma:

| Model (where it runs) | Recall on seeded habits | Must-fix notes on clean paragraphs | Seconds per paragraph |
|---|---|---|---|
| Gemma 4 E4B (laptop, 16 GB) | 84.2% | 1 | 12.8 |
| Gemma 4 12B (laptop, 16 GB) | 94.7% | 0 | 34.1 |
| Gemma 4 26B-A4B (AI Studio) | 89.5% | 0 | 25.4 |

Joy can choose her trade-off: E4B for quick checks while drafting, 12B before she submits. Finding a hosted setting that worked was its own lesson. Gemma 4 "thinks" at length by default, and one paragraph took **335 seconds** on the free tier. Setting the thinking level to `minimal` brought it down to about **30 seconds** with no visible loss in quality.

**4. Cost.** Running locally costs nothing. International students already pay some of the highest fees in UK higher education, so a tool they need a subscription for is a tool many of them won't use.

## Handing it to Joy

[TODO: what happened when you gave it to Joy: which draft she tried (no need to share it), which notes surprised her, whether the Chinese explanations helped, what she changed herself, and one direct quote with her permission.]

> [TODO: Joy's quote]

[TODO: anything she asked for that you'd add next.]

## My Agent Session

I built Pīzhù with Claude Code. Here's the session, from reading the challenge rules to the PRD to debugging the reference matcher:

[TODO: {% agent_session <id> %}]

## Prize Categories

- **Best Use of Gemma:** Gemma 4 is the only model, running locally (E4B and 12B via Ollama) and hosted (26B-A4B via AI Studio), with a size comparison.
- **Best Use of SerpApi:** the Google Scholar engine powers the reference checker that catches sources which may not exist.

---

*This post and the code were written with AI assistance (Claude Code). I reviewed, tested and edited everything, and the evaluation numbers come from real runs of the code in the repo.*
