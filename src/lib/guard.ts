import type { Annotation, GuardStats, ModelAnnotation } from "./schema";

// The "annotate, don't rewrite" guardrail. The prompt asks Gemma to behave,
// but this is where the rule is actually enforced:
//   1. every span must exist in the student's paragraph, or the note is dropped;
//   2. a nudge may only change a few words of its span, or it is stripped and
//      the student keeps just the hint.

export const NUDGE_MIN_WORDS = 4;
export const NUDGE_MAX_RATIO = 0.3;
const MAX_SPAN_WORDS_FOR_NUDGE = 25;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

/** Word-level Levenshtein distance. */
export function wordEditDistance(a: string, b: string): number {
  const x = words(a.toLowerCase());
  const y = words(b.toLowerCase());
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[y.length];
}

export function nudgeBudget(span: string): number {
  return Math.max(NUDGE_MIN_WORDS, Math.ceil(words(span).length * NUDGE_MAX_RATIO));
}

/** True when the nudge is a small, local edit of the span. */
export function nudgeAllowed(span: string, nudge: string): boolean {
  const n = nudge.trim();
  if (!n || n === span.trim()) return false;
  if (words(span).length > MAX_SPAN_WORDS_FOR_NUDGE) return false;
  // A span that crosses a sentence boundary is about structure; the student restructures it.
  if (/[.!?]\s+\S/.test(span.trim().replace(/\b(e\.g|i\.e|et al|etc|p|pp|vs)\./gi, ""))) return false;
  return wordEditDistance(span, n) <= nudgeBudget(span);
}

// Models often "tidy" quotes, dashes or spacing when copying a span. Normalise
// both sides with a 1:1 character mapping so offsets still line up.
const normChar = (c: string) =>
  c === "‘" || c === "’" || c === "ʼ" ? "'"
  : c === "“" || c === "”" ? '"'
  : c === "–" || c === "—" ? "-"
  : /\s/.test(c) ? " "
  : c.toLowerCase();
const norm = (s: string) => s.split("").map(normChar).join("");

/** Find where the span sits in the paragraph, tolerating quote/case/whitespace drift. */
export function locateSpan(paragraph: string, span: string, from = 0): { start: number; end: number } | null {
  if (!span.trim()) return null;
  const exact = paragraph.indexOf(span, from);
  if (exact !== -1) return { start: exact, end: exact + span.length };

  // Index per UTF-16 unit so offsets match String.slice on the original.
  const p = paragraph.split("").map(normChar).join("");
  const s = norm(span.trim()).replace(/ +/g, " ");
  const collapsed = collapseSpaces(p);
  const fromIdx = collapsed.map.findIndex((i) => i >= from);
  if (fromIdx === -1) return null;
  const idx = collapsed.text.indexOf(s, fromIdx);
  if (idx === -1) return null;
  const start = collapsed.map[idx];
  const end = collapsed.map[idx + s.length - 1] + 1;
  return { start, end };
}

function collapseSpaces(s: string): { text: string; map: number[] } {
  let text = "";
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === " " && text.endsWith(" ")) continue;
    text += s[i];
    map.push(i);
  }
  return { text, map };
}

export function emptyStats(): GuardStats {
  return { proposed: 0, kept: 0, droppedUnlocated: 0, droppedOverlap: 0, nudgesProposed: 0, nudgesStripped: 0 };
}

export function addStats(a: GuardStats, b: GuardStats): GuardStats {
  return {
    proposed: a.proposed + b.proposed,
    kept: a.kept + b.kept,
    droppedUnlocated: a.droppedUnlocated + b.droppedUnlocated,
    droppedOverlap: a.droppedOverlap + b.droppedOverlap,
    nudgesProposed: a.nudgesProposed + b.nudgesProposed,
    nudgesStripped: a.nudgesStripped + b.nudgesStripped,
  };
}

/** Models sometimes add markdown emphasis; cards render plain text. */
export const plain = (s: string) => s.replace(/\*\*?([^*]+)\*\*?/g, "$1").replace(/`([^`]+)`/g, "$1").trim();

export function guardParagraph(
  paragraph: string,
  raw: ModelAnnotation[],
  idPrefix: string,
): { annotations: Annotation[]; stats: GuardStats } {
  const stats = emptyStats();
  const out: Annotation[] = [];

  for (const a of raw) {
    stats.proposed++;
    // If the same phrase appears twice, prefer an occurrence not already annotated.
    let loc = locateSpan(paragraph, a.span);
    while (loc && out.some((o) => o.start === loc!.start && o.end === loc!.end)) {
      loc = locateSpan(paragraph, a.span, loc.start + 1);
    }
    if (!loc) {
      stats.droppedUnlocated++;
      continue;
    }
    // Keep highlights readable: no overlapping spans. First (model-prioritised) wins.
    if (out.some((o) => loc!.start < o.end && o.start < loc!.end)) {
      stats.droppedOverlap++;
      continue;
    }

    let nudge = a.nudge?.trim() || null;
    let nudgeStripped = false;
    if (nudge) {
      stats.nudgesProposed++;
      const span = paragraph.slice(loc.start, loc.end);
      if (!nudgeAllowed(span, nudge)) {
        nudge = null;
        nudgeStripped = true;
        stats.nudgesStripped++;
      }
    }

    out.push({
      ...a,
      explanation_en: plain(a.explanation_en),
      explanation_zh: plain(a.explanation_zh),
      l1_note: plain(a.l1_note),
      hint: plain(a.hint),
      nudge,
      nudgeStripped,
      id: `${idPrefix}-${out.length}`,
      start: loc.start,
      end: loc.end,
    });
    stats.kept++;
  }

  out.sort((x, y) => x.start - y.start);
  return { annotations: out, stats };
}
