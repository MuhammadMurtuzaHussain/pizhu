import { getModelConfig } from "@/mastra/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { mode, modelId } = getModelConfig();
  let ready = true;
  if (mode === "local") {
    // Is Ollama up and is the model pulled?
    try {
      const base = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/api").replace(/\/$/, "");
      const tags = await fetch(`${base}/tags`, { cache: "no-store" }).then((r) => r.json());
      ready = (tags.models ?? []).some((m: { name: string }) => m.name === modelId || m.name === `${modelId}:latest`);
    } catch {
      ready = false;
    }
  } else {
    ready = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
  return Response.json({
    mode,
    model: modelId,
    ready,
    scholar: Boolean(process.env.SERPAPI_API_KEY),
    maxWords: Number(process.env.MAX_WORDS) || null,
  });
}
