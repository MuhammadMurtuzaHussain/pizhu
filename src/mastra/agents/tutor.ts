import { Agent } from "@mastra/core/agent";
import { getModelConfig } from "../model";
import { TUTOR_INSTRUCTIONS } from "./prompts";

export const tutorAgent = new Agent({
  id: "pizhu-tutor",
  name: "Pīzhù tutor",
  instructions: TUTOR_INSTRUCTIONS,
  model: () => getModelConfig().model,
});
