import { Mastra } from "@mastra/core/mastra";
import { tutorAgent } from "./agents/tutor";
import { librarianAgent } from "./agents/librarian";
import { referencesWorkflow } from "./workflows/references";

export const mastra = new Mastra({
  agents: { tutorAgent, librarianAgent },
  workflows: { referencesWorkflow },
});
