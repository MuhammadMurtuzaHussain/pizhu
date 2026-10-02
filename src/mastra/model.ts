import { createOllama } from "ollama-ai-provider-v2";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// One switch decides where Gemma runs. Same open weights either way:
//   ollama → on the student's own laptop; the essay never leaves it.
//   google → Google AI Studio serving Gemma, so judges can try the hosted demo.

export type Mode = "local" | "hosted";

type ProviderOptions = { google?: { thinkingConfig: { thinkingLevel: "minimal" | "low" | "medium" | "high" } } };

export function getModelConfig() {
  const provider = (process.env.MODEL_PROVIDER ?? "ollama").toLowerCase();
  if (provider === "google") {
    const modelId = process.env.GOOGLE_MODEL ?? "gemma-4-26b-a4b-it";
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
    // Gemma 4 thinks at length by default (~30s per paragraph); for margin notes
    // "minimal" gives the same quality in a fraction of the time.
    return {
      mode: "hosted" as Mode,
      modelId,
      model: google(modelId),
      providerOptions: { google: { thinkingConfig: { thinkingLevel: "minimal" } } } as ProviderOptions,
    };
  }
  const modelId = process.env.OLLAMA_MODEL ?? "gemma4:e4b";
  const ollama = createOllama({ baseURL: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/api" });
  return { mode: "local" as Mode, modelId, model: ollama(modelId), providerOptions: {} as ProviderOptions };
}
