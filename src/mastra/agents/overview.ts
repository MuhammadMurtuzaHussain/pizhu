import { Agent } from "@mastra/core/agent";
import { getModelConfig } from "../model";
import { OVERVIEW_INSTRUCTIONS } from "./prompts";

export const overviewAgent = new Agent({
  id: "pizhu-overview",
  name: "Pīzhù whole-paper reader",
  instructions: OVERVIEW_INSTRUCTIONS,
  model: () => getModelConfig().model,
});
