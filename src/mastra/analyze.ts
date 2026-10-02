import { tutorAgent } from "./agents/tutor";
import { overviewPrompt, paragraphPrompt } from "./agents/prompts";
import { overviewAgent } from "./agents/overview";
import { getModelConfig } from "./model";
import { modelParagraphSchema, overviewSchema, type EssayContext, type ModelParagraph, type Overview } from "@/lib/schema";
import { guardParagraph } from "@/lib/guard";
import { mergeAnnotations, spellingAnnotations } from "@/lib/spelling";

/**
 * Ask Gemma for annotations on one paragraph, then run the no-rewrite guard.
 * Locally we use Ollama's native JSON-schema mode; if a model ignores it (or the
 * hosted endpoint doesn't support it) we retry once with the schema injected
 * into the prompt instead.
 */
export async function analyzeParagraph(ctx: EssayContext, paragraph: string, index: number, total: number, id: string) {
  const prompt = paragraphPrompt(ctx, paragraph, index, total);
  const { mode, providerOptions } = getModelConfig();

  const attempt = async (inject: boolean): Promise<ModelParagraph> => {
    const res = await tutorAgent.generate(prompt, {
      structuredOutput: { schema: modelParagraphSchema, jsonPromptInjection: inject },
      modelSettings: { temperature: 0.2, maxOutputTokens: 4096 },
      providerOptions,
    });
    if (!res.object) throw new Error("Model returned no structured output");
    return res.object as ModelParagraph;
  };

  let parsed: ModelParagraph;
  try {
    parsed = await attempt(mode === "hosted");
  } catch {
    parsed = await attempt(true);
  }
  const { annotations, stats } = guardParagraph(paragraph, parsed.annotations, id);
  // Spelling is a lookup, not a judgement: a word list catches it every time.
  return { annotations: mergeAnnotations(annotations, spellingAnnotations(paragraph, id, ctx.script)), summary: parsed.summary, stats };
}

/** Whole-paper overview: one pass over every paragraph (and the brief, if given). */
export async function analyzeOverview(ctx: EssayContext, paragraphs: string[], brief?: string): Promise<Overview> {
  const { mode, providerOptions } = getModelConfig();
  // Ollama's default context window is small; a dissertation chapter needs room.
  const options = mode === "local" ? { ollama: { options: { num_ctx: 32768 } } } : providerOptions;
  const prompt = overviewPrompt(ctx, paragraphs, brief);
  const attempt = async (inject: boolean) => {
    const res = await overviewAgent.generate(prompt, {
      structuredOutput: { schema: overviewSchema, jsonPromptInjection: inject },
      modelSettings: { temperature: 0.2, maxOutputTokens: 4096 },
      providerOptions: options as typeof providerOptions,
    });
    if (!res.object) throw new Error("Model returned no overview");
    return res.object as Overview;
  };
  let o: Overview;
  try {
    o = await attempt(mode === "hosted");
  } catch {
    o = await attempt(true);
  }
  return { ...o, priorities: o.priorities.slice(0, 3), criteria: brief?.trim() ? o.criteria.slice(0, 6) : [] };
}
