import { z } from "zod";
import { analyzeOverview, analyzeParagraph } from "@/mastra/analyze";
import { getModelConfig } from "@/mastra/model";
import { contextSchema, type AnalyzeEvent } from "@/lib/schema";
import { splitEssay, isHeading, wordCount } from "@/lib/paragraphs";
import { addStats, emptyStats } from "@/lib/guard";
import { clientIp, maxWords, rateLimited } from "@/lib/server/limits";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  text: z.string().min(1).max(60_000),
  context: contextSchema,
  // Re-check a single paragraph: the client sends its id so cards can be replaced in place.
  paragraphId: z.string().optional(),
  // Optional assignment brief / marking criteria, used by the whole-paper overview.
  brief: z.string().max(12_000).optional(),
});

export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) return Response.json({ error: "rate_limited" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const { text, context, paragraphId, brief } = parsed.data;

  const { mode, modelId } = getModelConfig();
  const split = paragraphId ? { paragraphs: [text.trim()] } : splitEssay(text);

  // Apply the word cap paragraph by paragraph so we never cut one in half.
  const cap = maxWords();
  let used = 0;
  let truncated = false;
  const paragraphs: { id: string; text: string }[] = [];
  split.paragraphs.forEach((p, i) => {
    if (used + wordCount(p) > cap) {
      truncated = true;
      return;
    }
    used += wordCount(p);
    paragraphs.push({ id: paragraphId ?? `p${i}`, text: p });
  });

  const concurrency = Math.max(1, Number(process.env.ANALYZE_CONCURRENCY) || (mode === "hosted" ? 3 : 1));
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: AnalyzeEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      const t0 = Date.now();
      let total = emptyStats();
      send({ type: "meta", mode, model: modelId, paragraphs, truncated });

      const todo = paragraphs.filter((p) => !isHeading(p.text));
      let next = 0;
      const worker = async () => {
        while (next < todo.length) {
          const p = todo[next++];
          const idx = paragraphs.indexOf(p);
          const started = Date.now();
          try {
            const r = await analyzeParagraph(context, p.text, idx, paragraphs.length, p.id);
            total = addStats(total, r.stats);
            send({ type: "paragraph", id: p.id, annotations: r.annotations, summary: r.summary, stats: r.stats, ms: Date.now() - started });
          } catch (err) {
            console.error("[analyze]", p.id, err);
            send({ type: "error", id: p.id, message: err instanceof Error ? err.message : "Analysis failed" });
          }
        }
      };
      // The whole-paper overview runs alongside the paragraph notes (full checks only).
      const overview =
        !paragraphId && paragraphs.length >= 2
          ? (async () => {
              const started = Date.now();
              try {
                const o = await analyzeOverview(context, paragraphs.map((p) => p.text), brief);
                send({ type: "overview", overview: o, ms: Date.now() - started });
              } catch (err) {
                console.error("[overview]", err);
                send({ type: "overview_error", message: err instanceof Error ? err.message : "Overview failed" });
              }
            })()
          : Promise.resolve();
      await Promise.all([...Array.from({ length: concurrency }, worker), overview]);
      send({ type: "done", stats: total, ms: Date.now() - t0 });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
