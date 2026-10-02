---
title: "Pīzhù 批注: a writing tutor that never rewrites your essay, built for my friend Joy (Gemma 4)"
published: false
tags: devchallenge, weekendchallenge, hf26challenge
cover_image: https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/src/app/opengraph-image.png
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

My friend **Joy** is doing an MA in Global Mass Communication in the UK. Her first language is Mandarin. She reads media theory in two languages, argues well, and still gets essays back with comments like *"expression needs work"* and *"be careful with academic tone"*.

[TODO: one or two sentences in your own words: how you know Joy, a moment you saw this happen, and what it did to her confidence.]

I have seen the same thing with a lot of friends from China and Taiwan. The marks they lose are rarely about ideas. They come from a handful of habits that make perfect sense in Chinese and read badly to a British marker:

- **No articles.** Mandarin has no *a* or *the*, so *"The society is changing"* feels natural.
- **一逗到底, "one comma all the way".** A Chinese sentence can run through commas until the thought is complete. In English that is a comma splice.
- **Exam-template English.** *"With the development of society…"*, *"In a word…"* were taught as good style for 高考 and IELTS. A UK marker reads them as filler.
- **Confident claims.** *"This proves…"* and *"Everyone knows…"* (众所周知) persuade in Chinese argumentative writing. In a UK essay they are unsupported.

The usual tools make this worse. Grammar checkers and chatbots **rewrite** the paragraph. It sounds fluent, it stops sounding like the student, she learns nothing, and in a UK university an AI-rewritten essay is an academic-integrity problem.

So I built **Pīzhù (批注)**. The word means *margin notes*: the comments a good teacher writes beside your work. That is the whole product:

- It underlines the **exact words** a UK marker would pause on.
- It explains **why**, in English and in Chinese (简体 or 繁體), including **why a Mandarin speaker tends to write it that way**, framed as a habit, never a mistake in thinking.
- It gives a **hint**, and at most a tiny **nudge** of a few words.
- **It never rewrites.** Joy makes every change herself.

![Pīzhù's live demo: a Chinglish sentence gets marker-pen underlines and bilingual margin notes](https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/demo.gif)

## Demo

**Try it:** [pizhu.onrender.com](https://pizhu.onrender.com). Press **Try a sample**, then **Check my writing**. The sample essay is one I wrote for testing; it is full of these habits and includes one reference I invented on purpose, so you can watch the reference checker catch it. (The demo runs on Render's free tier, so the very first load can take a few seconds to wake up.)

**The essay on grid paper, with notes in the margin.** Every note sits beside its own line, and the open one draws an ink line to its words.

![Margin notes beside the essay](https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/margin-notes.png)

**Lesson mode.** One note at a time, with tapioca pearls as progress. Enter for "got it", the arrow keys to move.

![Lesson mode](https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/lesson.png)

**Back to Word.** Students write in Word, and Word comments are literally margin notes, so one click gives Joy her own document back, every word unchanged, with each note as a comment from Mòmo.

**Reference check.** Google Scholar via SerpApi: three real books found, the invented one flagged.

![Reference check](https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/references.png)

**On a phone, in dark mode, in 简体中文.**

![Mobile, dark mode, Simplified Chinese](https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/mobile-sheet-dark.png)

## Code

{% github MuhammadMurtuzaHussain/pizhu %}

## How I Built It

**Gemma 4 is the only model in Pīzhù.** It is open weights under Apache 2.0, and the same family runs in two places:

| Where | Model | Why |
|---|---|---|
| Joy's laptop (the default) | `gemma4:e4b` or `gemma4:12b` via **Ollama** | Her coursework never leaves her machine |
| Hosted demo | `gemma-4-26b-a4b-it` via **Google AI Studio** | So anyone can try it without installing anything |

One environment variable switches between them.

```
Next.js UI ──► /api/analyze  (streams one paragraph at a time)
                 │
                 ▼
          Mastra tutorAgent ──► Gemma 4  (structured output, Zod schema)
                 │
                 ▼
          guard.ts  ← the "never rewrite" rule, enforced in code
                 │
                 ▼
          + rule-based British spelling  →  margin notes

Reference tab ──► Mastra workflow:
          extract (Gemma) → match citations (code) → verify (SerpApi Google Scholar)
```

### 1. Teaching Gemma to annotate instead of rewrite

The tutor is a [Mastra](https://mastra.ai) agent with a system prompt written like a brief for a university writing-centre tutor. It describes twelve habits, each pairing a UK convention with the Mandarin pattern behind it, and gives Gemma a checklist: check every comma, every *"As for…"*, every bare countable noun.

Gemma returns structured JSON validated with Zod. The schema has **no field for a rewritten paragraph**. The only text Gemma may propose is an optional `nudge`.

### 2. Not trusting the prompt

Prompts are requests, not guarantees. `guard.ts` checks every note before Joy sees it:

1. **The highlighted span must exist in her text** (tolerating curly quotes and spacing). If Gemma "quotes" something she never wrote, the note is dropped.
2. **A nudge may change at most `max(4, 30%)` of the span's words**, measured by word-level edit distance. Anything bigger is stripped back to a hint, and the card says *"Try this one yourself."*
3. **Spans that cross a sentence boundary never get a nudge.** Restructuring is the student's job.

```ts
export function nudgeAllowed(span: string, nudge: string): boolean {
  if (!nudge.trim() || nudge.trim() === span.trim()) return false;
  if (words(span).length > 25) return false;
  if (crossesSentence(span)) return false;
  return wordEditDistance(span, nudge) <= Math.max(4, Math.ceil(words(span).length * 0.3));
}
```

Across my evaluation runs, Gemma proposed 89 nudges and the guard turned 8 of them back into hints. Most came from the smallest model, which is exactly where you want the safety net.

### 3. Rules for what rules do best

The small model was unreliable at spotting American spellings, so I stopped asking it. A word list catches *analyze → analyse* and *behavior → behaviour* every time, and those notes merge with Gemma's. Gemma handles the judgement; the rules handle the lookups.

### 4. Checking references with SerpApi

Fabricated or garbled references are a growing problem, so the reference tab runs a three-step Mastra workflow:

1. **Gemma extracts** each entry (authors, year, title) and offers Harvard formatting *hints*, never a corrected entry.
2. **Plain code matches** in-text citations like `(Hall, 1980)` against the list: cited but missing, or listed but never cited.
3. **SerpApi's Google Scholar engine** looks up every title: ✅ found, ≈ details differ, or ❓ couldn't find it, so check it exists.

Two real-world snags made it better. Scholar often drops subtitles (*"Understanding media"* for *Understanding Media: The Extensions of Man*), and its top hit is sometimes a **book review** rather than the book. Pīzhù compares main titles, searches with Scholar's `author:` operator first, and accepts a one-year drift for reprints. Only titles and first authors are sent, never essay text.

### 5. Designed for Joy, not for a generic user

This is where I spent the second half of the weekend, because a tool you feel judged by is a tool you stop opening.

- **Mòmo 墨墨, the ink panda.** Black and white is literally 墨 ink on paper. Pandas are loved in both mainland China and Taiwan, and a gentle mascot takes the sting out of being corrected. Mòmo reads with you, sips bubble tea, cheers when you fix things, and presses a 好 seal when you finish. A reduplicated name like 墨墨 feels affectionate, the way 团团圆圆 does.
- **A bubble-tea palette.** Taro purple, milk white, strawberry for must-fix, mango for worth-fixing, matcha for all good. Red is the colour of luck and celebration in Chinese culture, so errors are a soft strawberry, never alarm red.
- **Feedback that protects 面子 (face).** Notes are private, never graded, and called *habits*. The "Marker's eye" summary under each paragraph uses UK marking dimensions (argument, structure, language, referencing) and never gives a mark.
- **集章, collecting stamps.** Anyone who grew up with 7-Eleven point cards or station stamp books knows the pull. Work through three notes of a habit and you earn its stamp.
- **Handwriting-style Chinese.** Explanations are set in 霞鹜文楷 (LXGW WenKai), an open-source kai typeface many Chinese and Taiwanese students already love, so they read like a teacher's note.
- **The interface in 简体 and 繁體**, with explanations in English, Chinese or both.

![The stamp book](https://raw.githubusercontent.com/MuhammadMurtuzaHussain/pizhu/main/docs/screenshots/habits.png)

## Why Does Open Innovation Matter?

This project only makes sense with open models.

**1. Privacy and academic integrity.** Pasting unsubmitted coursework into a third-party chatbot means handing it to a server you do not control, and universities increasingly tell students to be careful with exactly that. With Gemma in Ollama, Joy's drafts stay on her laptop, and the app says so in plain words: *🔒 Local. Your essay stays on this laptop.*

**2. Control over behaviour.** Closed chat products are built to produce the answer. I needed the opposite: a model that points and explains but does not fix. With open weights inside my own pipeline, I could enforce that rule in code instead of hoping a prompt holds.

**3. Being able to swap models, and measure it.** I wrote fifteen test paragraphs seeded with known habits, plus two clean ones to catch over-flagging, and ran the same pipeline on three sizes of Gemma:

| Model (where it runs) | Recall on seeded habits | Must-fix notes on clean paragraphs | Seconds per paragraph |
|---|---|---|---|
| Gemma 4 E4B (laptop, 16 GB) | 84.2% | 1 | 12.8 |
| Gemma 4 12B (laptop, 16 GB) | 94.7% | 0 | 34.1 |
| Gemma 4 26B-A4B (AI Studio) | 89.5% | 0 | 25.4 |

Joy can choose her trade-off: E4B for quick checks while drafting, 12B before she submits. Tuning the hosted model taught me something too: Gemma 4 "thinks" at length by default, and one paragraph took **335 seconds**. Setting the thinking level to `minimal` brought it to about **30 seconds** with no visible loss in quality.

**4. Cost.** Running locally costs nothing. International students already pay some of the highest fees in UK higher education; a tool behind a subscription is a tool many of them will not use.

## Handing it to Joy

[TODO: what happened when you gave it to Joy: which draft she tried (no need to share it), which notes surprised her, whether the Chinese explanations helped, what she changed herself, and one direct quote with her permission.]

> [TODO: Joy's quote]

[TODO: anything she asked for that you would add next.]

## My Agent Session

I built Pīzhù with Claude Code over the weekend, from reading the challenge rules, to the PRD, to debugging the reference matcher and the margin-note layout:

[TODO: {% agent_session <id> %}]

## Prize Categories

- **Best Use of Gemma:** Gemma 4 is the only model, running locally (E4B and 12B via Ollama) and hosted (26B-A4B via AI Studio), with a measured size comparison and a guardrail built around its structured output.
- **Best Use of SerpApi:** the Google Scholar engine powers the reference checker that catches sources which may not exist, using the `author:` operator to find the work itself rather than reviews of it.

---

*Built with AI assistance (Claude Code). I reviewed, tested and edited everything, and the evaluation numbers come from real runs of the code in the repo.*
