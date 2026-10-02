import { tutorAgent } from "./agents/tutor";
import { paragraphPrompt } from "./agents/prompts";
import { getModelConfig } from "./model";
import { modelParagraphSchema, type EssayContext, type ModelParagraph } from "@/lib/schema";
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
  const { mode } = getModelConfig();

  const attempt = async (inject: boolean): Promise<ModelParagraph> => {
    const res = await tutorAgent.generate(prompt, {
      structuredOutput: { schema: modelParagraphSchema, jsonPromptInjection: inject },
      modelSettings: { temperature: 0.2, maxOutputTokens: 4096 },
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
