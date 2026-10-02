import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Looks a reference up on Google Scholar through SerpApi. Only the reference's
// title (and first author) is sent — never the student's essay text.

const resultSchema = z.object({
  title: z.string(),
  link: z.string().nullable(),
  summary: z.string(),
});

export const scholarOutputSchema = z.object({
  configured: z.boolean(),
  results: z.array(resultSchema),
  error: z.string().nullable(),
});
export type ScholarOutput = z.infer<typeof scholarOutputSchema>;

export async function searchScholar(query: string, signal?: AbortSignal): Promise<ScholarOutput> {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) return { configured: false, results: [], error: null };
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_scholar");
  url.searchParams.set("q", query);
  url.searchParams.set("num", "3");
  url.searchParams.set("api_key", key);
  try {
    const res = await fetch(url, { signal });
    const data = await res.json();
    if (!res.ok || data.error) return { configured: true, results: [], error: String(data.error ?? res.statusText) };
    const results = (data.organic_results ?? []).slice(0, 3).map((r: { title?: string; link?: string; publication_info?: { summary?: string } }) => ({
      title: r.title ?? "",
      link: r.link ?? null,
      summary: r.publication_info?.summary ?? "",
    }));
    return { configured: true, results, error: null };
  } catch (e) {
    return { configured: true, results: [], error: e instanceof Error ? e.message : "SerpApi request failed" };
  }
}

export const scholarTool = createTool({
  id: "google-scholar-search",
  description: "Search Google Scholar (via SerpApi) for a reference title to check that the source exists and its details match.",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: scholarOutputSchema,
  execute: async ({ query }, ctx) => searchScholar(query, ctx?.abortSignal),
});
