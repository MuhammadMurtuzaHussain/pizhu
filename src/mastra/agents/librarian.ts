import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { getModelConfig } from "../model";

export const extractedRefSchema = z.object({
  index: z.number().int().describe("0-based position in the list as given"),
  surnames: z.array(z.string()).describe("Author or organisation surnames, in order, e.g. ['Castells'] or ['Ofcom']"),
  year: z.string().nullable(),
  title: z.string().describe("Title of the work only, without authors, year or publisher"),
  tips_en: z.array(z.string()).describe("Up to 3 short Harvard (Cite Them Right) formatting hints. Hints, not a corrected entry. Empty if well formatted."),
  tips_zh: z.array(z.string()).describe("The same hints in the requested Chinese script"),
});
export const extractedRefsSchema = z.object({ references: z.array(extractedRefSchema) });
export type ExtractedRef = z.infer<typeof extractedRefSchema>;

export const librarianAgent = new Agent({
  id: "pizhu-librarian",
  name: "Pīzhù librarian",
  instructions: `You help Mandarin-speaking students at UK universities with Harvard referencing (Cite Them Right style).
Given a reference list, parse each entry into surnames, year and title exactly as written — do not correct or invent details.
Then give up to 3 short formatting hints per entry (e.g. "Put the year in round brackets after the authors", "Italicise the book title", "Add 'Available at:' and an accessed date for web sources").
Never output a rewritten reference. If an entry looks fine, give no hints.`,
  model: () => getModelConfig().model,
});
