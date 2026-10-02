import { createOllama } from "ollama-ai-provider-v2";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// One switch decides where Gemma runs. Same open weights either way:
//   ollama → on the student's own laptop; the essay never leaves it.
//   google → Google AI Studio serving Gemma, so judges can try the hosted demo.

export type Mode = "local" | "hosted";

export function getModelConfig() {
  const provider = (process.env.MODEL_PROVIDER ?? "ollama").toLowerCase();
  if (provider === "google") {
    const modelId = process.env.GOOGLE_MODEL ?? "gemma-4-31b-it";
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
    return { mode: "hosted" as Mode, modelId, model: google(modelId) };
  }
  const modelId = process.env.OLLAMA_MODEL ?? "gemma4:e4b";
  const ollama = createOllama({ baseURL: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/api" });
  return { mode: "local" as Mode, modelId, model: ollama(modelId) };
}
