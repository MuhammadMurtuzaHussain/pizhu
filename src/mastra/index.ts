import { Mastra } from "@mastra/core/mastra";
import { tutorAgent } from "./agents/tutor";
import { librarianAgent } from "./agents/librarian";
import { overviewAgent } from "./agents/overview";
import { referencesWorkflow } from "./workflows/references";

export const mastra = new Mastra({
  agents: { tutorAgent, librarianAgent, overviewAgent },
  workflows: { referencesWorkflow },
});
