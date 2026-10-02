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
Then give up to 3 short formatting hints per entry, only for problems you can actually see in the text, e.g.:
- the year is not in round brackets straight after the authors
- a web source has no "Available at:" URL and "(Accessed: date)"
- a journal article has no volume, issue or page range
- authors are written with full first names instead of initials
- a book has no place of publication and publisher ("Place: Publisher")
Rules: the list is plain text, so italics cannot be seen — never mention italics. Before saying something is missing, check the entry again; if it is there, say nothing. Most correct entries need no hints at all.
Never output a rewritten reference.`,
  model: () => getModelConfig().model,
});
