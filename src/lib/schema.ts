import { z } from "zod";
import { CATEGORY_IDS, DIMENSIONS, SEVERITIES } from "./taxonomy";

// What we ask Gemma to return for one paragraph. Deliberately has no field for
// a rewritten paragraph: the only text the model may propose is a short `nudge`,
// which guard.ts then checks.
export const modelAnnotationSchema = z.object({
  span: z.string().describe("Exact substring copied character-for-character from the paragraph; the shortest part that shows the problem."),
  category: z.enum(CATEGORY_IDS),
  severity: z.enum(SEVERITIES),
  explanation_en: z.string().describe("1-2 sentences: what is off and why, in UK academic terms."),
  explanation_zh: z.string().describe("The same explanation in natural Chinese, in the requested script."),
  l1_note: z.string().describe("Chinese: why a Mandarin speaker might write it this way. Empty string if not relevant."),
  hint: z.string().describe("A guiding question or rule that helps the student fix it themselves. Never the full answer."),
  nudge: z.string().nullable().describe("Optional minimal fix of the span only, changing at most a few words. null when the student should decide."),
});

export const modelParagraphSchema = z.object({
  annotations: z.array(modelAnnotationSchema),
  summary: z.object({
    dimension: z.enum(DIMENSIONS).describe("Which UK marking dimension most holds this paragraph back."),
    strength_en: z.string(),
    strength_zh: z.string(),
    focus_en: z.string().describe("The single most useful thing to work on in this paragraph."),
    focus_zh: z.string(),
  }),
});

export type ModelAnnotation = z.infer<typeof modelAnnotationSchema>;
export type ModelParagraph = z.infer<typeof modelParagraphSchema>;

/** An annotation after the guard has located it in the paragraph. */
export type Annotation = ModelAnnotation & {
  id: string;
  start: number;
  end: number;
  nudgeStripped: boolean;
};

export type GuardStats = {
  proposed: number;
  kept: number;
  droppedUnlocated: number;
  droppedOverlap: number;
  nudgesProposed: number;
  nudgesStripped: number;
};

export const contextSchema = z.object({
  discipline: z.string().max(60).default("Global Mass Communication"),
  task: z.enum(["essay", "report", "reflective", "dissertation", "literature_review"]).default("essay"),
  level: z.enum(["foundation", "undergraduate", "postgraduate"]).default("postgraduate"),
  variety: z.enum(["uk", "ireland"]).default("uk"),
  script: z.enum(["zh-Hans", "zh-Hant"]).default("zh-Hans"),
});
export type EssayContext = z.infer<typeof contextSchema>;

// Streamed from /api/analyze as newline-delimited JSON.
export type AnalyzeEvent =
  | { type: "meta"; mode: "local" | "hosted"; model: string; paragraphs: { id: string; text: string }[]; truncated: boolean }
  | { type: "paragraph"; id: string; annotations: Annotation[]; summary: ModelParagraph["summary"] | null; stats: GuardStats; ms: number }
  | { type: "error"; id?: string; message: string }
  | { type: "done"; stats: GuardStats; ms: number };
