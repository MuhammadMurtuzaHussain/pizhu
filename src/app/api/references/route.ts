import { z } from "zod";
import { mastra } from "@/mastra";
import { splitEssay } from "@/lib/paragraphs";
import { clientIp, rateLimited } from "@/lib/server/limits";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({ text: z.string().min(1).max(60_000), script: z.enum(["zh-Hans", "zh-Hant"]).default("zh-Hans") });

export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) return Response.json({ error: "rate_limited" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });

  const { paragraphs, references } = splitEssay(parsed.data.text);
  if (references.length === 0) return Response.json({ error: "no_references" }, { status: 422 });

  const run = await mastra.getWorkflow("referencesWorkflow").createRun();
  const result = await run.start({
    inputData: { body: paragraphs.join("\n\n"), references: references.slice(0, 40), script: parsed.data.script },
  });
  if (result.status !== "success") {
    console.error("[references]", result);
    return Response.json({ error: "workflow_failed" }, { status: 500 });
  }
  return Response.json(result.result);
}
