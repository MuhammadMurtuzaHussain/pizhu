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
    });
    const parsed = ((res.object as z.infer<typeof extractedRefsSchema> | undefined)?.references ?? []).filter(
      (r) => r.index >= 0 && r.index < references.length,
    );
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

const tokens = (s: string) =>
  new Set(s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2));

/** Dice coefficient over word sets: 1 = same words. */
export function titleSimilarity(a: string, b: string): number {
  const x = tokens(a);
  const y = tokens(b);
  if (!x.size || !y.size) return 0;
  let inter = 0;
  for (const w of x) if (y.has(w)) inter++;
  return (2 * inter) / (x.size + y.size);
}

async function verify(ref: ExtractedRef, raw: string, cited: number): Promise<{ configured: boolean; checked: CheckedRef }> {
  const base = { ...ref, raw, citedInText: cited, issues: [] as ("year" | "author")[], match: null };
  if (!ref.title.trim()) return { configured: true, checked: { ...base, status: "unchecked" } };
  const q = `${ref.title} ${ref.surnames[0] ?? ""}`.trim();
  const { configured, results } = await searchScholar(q);
  if (!configured) return { configured, checked: { ...base, status: "unchecked" } };

  const best = results
    .map((r) => ({ r, score: titleSimilarity(ref.title, r.title) }))
    .sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 0.6) return { configured, checked: { ...base, status: "not_found", match: best?.r ?? null } };

  const issues: ("year" | "author")[] = [];
  const year = ref.year?.match(/\d{4}/)?.[0];
  if (year && !best.r.summary.includes(year)) issues.push("year");
  const first = ref.surnames[0];
  // Scholar abbreviates names ("M Castells"); only check individuals, not organisations.
  if (first && ref.surnames.length > 0 && best.r.summary && !best.r.summary.toLowerCase().includes(first.toLowerCase()) && /[a-z]/.test(first.slice(1))) {
    issues.push("author");
  }
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
