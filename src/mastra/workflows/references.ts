import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { librarianAgent, extractedRefSchema, extractedRefsSchema, type ExtractedRef } from "../agents/librarian";
import { searchScholar } from "../tools/scholar";
import { getModelConfig } from "../model";
import { extractInText, matchCitations } from "@/lib/citations";

// Reference check as a Mastra workflow:
//   extract (Gemma)  →  match (deterministic)  →  verify (SerpApi Google Scholar)

const inText = z.object({ raw: z.string(), surname: z.string(), year: z.string() });

const inputSchema = z.object({
  body: z.string(),
  references: z.array(z.string()),
  script: z.enum(["zh-Hans", "zh-Hant"]),
});

const extractStep = createStep({
  id: "extract",
  inputSchema,
  outputSchema: z.object({ body: z.string(), references: z.array(z.string()), parsed: z.array(extractedRefSchema) }),
  execute: async ({ inputData }) => {
    const { body, references, script } = inputData;
    if (references.length === 0) return { body, references, parsed: [] };
    const scriptName = script === "zh-Hant" ? "Traditional Chinese (繁體中文)" : "Simplified Chinese (简体中文)";
    const list = references.map((r, i) => `[${i}] ${r}`).join("\n");
    const res = await librarianAgent.generate(`Write tips_zh in ${scriptName}.\n\n<reference_list>\n${list}\n</reference_list>`, {
      structuredOutput: { schema: extractedRefsSchema, jsonPromptInjection: getModelConfig().mode === "hosted" },
      modelSettings: { temperature: 0.1, maxOutputTokens: 4096 },
      providerOptions: getModelConfig().providerOptions,
    });
    // Small models sometimes write "No issues" as a hint; an empty list means the same thing.
    const noIssue = /^(no (visible )?(issues?|problems?)|none|looks (fine|good|correct)|没有|沒有|无|無)/i;
    const parsed = ((res.object as z.infer<typeof extractedRefsSchema> | undefined)?.references ?? [])
      .filter((r) => r.index >= 0 && r.index < references.length)
      .map((r) => {
        const keep = r.tips_en.map((t) => !noIssue.test(t.trim()));
        return { ...r, tips_en: r.tips_en.filter((_, i) => keep[i]), tips_zh: r.tips_zh.filter((_, i) => keep[i] ?? true).filter((t) => !noIssue.test(t.trim())) };
      });
    return { body, references, parsed };
  },
});

const matchStep = createStep({
  id: "match",
  inputSchema: extractStep.outputSchema,
  outputSchema: z.object({
    references: z.array(z.string()),
    parsed: z.array(extractedRefSchema),
    citedNotListed: z.array(inText),
    listedNotCited: z.array(z.number()),
    citedCount: z.record(z.string(), z.number()),
  }),
  execute: async ({ inputData }) => {
    const { body, references, parsed } = inputData;
    const report = matchCitations(
      extractInText(body),
      parsed.map((p) => ({ index: p.index, surnames: p.surnames, year: p.year })),
    );
    const citedCount = Object.fromEntries(Object.entries(report.matches).map(([k, v]) => [k, v.length]));
    return { references, parsed, citedNotListed: report.citedNotListed, listedNotCited: report.listedNotCited, citedCount };
  },
});

export const refStatus = z.enum(["found", "mismatch", "not_found", "unchecked"]);

const checkedRef = z.object({
  index: z.number(),
  raw: z.string(),
  surnames: z.array(z.string()),
  year: z.string().nullable(),
  title: z.string(),
  tips_en: z.array(z.string()),
  tips_zh: z.array(z.string()),
  status: refStatus,
  issues: z.array(z.enum(["year", "author"])),
  match: z.object({ title: z.string(), link: z.string().nullable(), summary: z.string() }).nullable(),
  citedInText: z.number(),
});
export type CheckedRef = z.infer<typeof checkedRef>;

export const referencesOutputSchema = z.object({
  scholarConfigured: z.boolean(),
  refs: z.array(checkedRef),
  citedNotListed: z.array(inText),
  listedNotCited: z.array(z.number()),
});
export type ReferencesResult = z.infer<typeof referencesOutputSchema>;

const STOP = new Set(["the", "and", "for", "with", "from", "into", "its", "their", "how", "what", "why", "a", "an", "of", "in", "on", "to"]);
const tokens = (s: string) =>
  new Set(
    s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)),
  );

const dice = (a: string, b: string) => {
  const x = tokens(a);
  const y = tokens(b);
  if (!x.size || !y.size) return 0;
  let inter = 0;
  for (const w of x) if (y.has(w)) inter++;
  return (2 * inter) / (x.size + y.size);
};

const mainTitle = (t: string) => t.split(/[:?.]/)[0];

/**
 * 1 = same title. Compares full titles and main titles (before a colon), since
 * Scholar often drops subtitles: "Understanding media" vs "Understanding Media:
 * The Extensions of Man".
 */
export function titleSimilarity(ref: string, result: string): number {
  const full = dice(ref, result);
  const main = tokens(mainTitle(ref)).size >= 2 ? dice(mainTitle(ref), mainTitle(result)) : 0;
  return Math.max(full, main);
}

async function verify(ref: ExtractedRef, raw: string, cited: number): Promise<{ configured: boolean; checked: CheckedRef }> {
  const base = { ...ref, raw, citedInText: cited, issues: [] as ("year" | "author")[], match: null };
  if (!ref.title.trim()) return { configured: true, checked: { ...base, status: "unchecked" } };
  // Ask Scholar with its author: operator first (finds the work itself, not reviews
  // of it); fall back to a title-only search if that finds nothing similar.
  const first = ref.surnames[0];
  const withAuthor = first && /[a-z]/.test(first.slice(1)) ? await searchScholar(`${ref.title} author:"${first}"`) : null;
  const strongIn = (r: { title: string }[]) => r.some((x) => titleSimilarity(ref.title, x.title) >= 0.6);
  const { configured, results } =
    withAuthor && withAuthor.configured && strongIn(withAuthor.results) ? withAuthor : await searchScholar(`${ref.title} ${first ?? ""}`.trim());
  if (!configured) return { configured, checked: { ...base, status: "unchecked" } };

  const ranked = results.map((r) => ({ r, score: titleSimilarity(ref.title, r.title) })).sort((a, b) => b.score - a.score);
  const strong = ranked.filter((x) => x.score >= 0.6);
  if (!strong.length) return { configured, checked: { ...base, status: "not_found", match: ranked[0]?.r ?? null } };

  // Any strong match can confirm the details (the top hit is sometimes a review of the work).
  const year = ref.year?.match(/\d{4}/)?.[0];
  const firstLc = first?.toLowerCase();
  const text = (x: (typeof strong)[number]) => `${x.r.summary} ${x.r.title}`.toLowerCase();
  // Scholar often lists a reprint or a later indexing year, so ±1 year still counts as a match.
  const nearYear = (x: (typeof strong)[number]) =>
    !year || (text(x).match(/\b(1[89]|20)\d{2}\b/g) ?? []).some((y) => Math.abs(Number(y) - Number(year)) <= 1);
  const yearOk = strong.some(nearYear);
  // Only check individual surnames; organisations (Ofcom, WHO) are often listed differently.
  const authorOk = !firstLc || /^[A-Z]{2,}$/.test(ref.surnames[0]) || strong.some((x) => text(x).includes(firstLc));
  // Prefer a hit whose metadata line (not its title) names the author and year: the work itself, not a review of it.
  const meta = (x: (typeof strong)[number]) => x.r.summary.toLowerCase();
  const best =
    strong.find((x) => nearYear(x) && (!firstLc || meta(x).includes(firstLc))) ??
    strong.find((x) => nearYear(x) && (!firstLc || text(x).includes(firstLc))) ??
    strong[0];
  const issues: ("year" | "author")[] = [...(yearOk ? [] : ["year" as const]), ...(authorOk ? [] : ["author" as const])];
  return { configured, checked: { ...base, status: issues.length ? "mismatch" : "found", issues, match: best.r } };
}

const verifyStep = createStep({
  id: "verify",
  inputSchema: matchStep.outputSchema,
  outputSchema: referencesOutputSchema,
  execute: async ({ inputData }) => {
    const { references, parsed, citedNotListed, listedNotCited, citedCount } = inputData;
    const limit = Math.min(parsed.length, 20); // keep SerpApi usage sane
    let configured = true;
    const refs: CheckedRef[] = [];
    for (let i = 0; i < parsed.length; i += 4) {
      const batch = parsed.slice(i, i + 4);
      const done = await Promise.all(
        batch.map((p, j) =>
          i + j < limit
            ? verify(p, references[p.index], citedCount[String(p.index)] ?? 0)
            : Promise.resolve({ configured, checked: { ...p, raw: references[p.index], citedInText: citedCount[String(p.index)] ?? 0, status: "unchecked" as const, issues: [], match: null } }),
        ),
      );
      for (const d of done) {
        configured &&= d.configured;
        refs.push(d.checked);
      }
    }
    return { scholarConfigured: configured, refs, citedNotListed, listedNotCited };
  },
});

export const referencesWorkflow = createWorkflow({
  id: "check-references",
  inputSchema,
  outputSchema: referencesOutputSchema,
})
  .then(extractStep)
  .then(matchStep)
  .then(verifyStep)
  .commit();
