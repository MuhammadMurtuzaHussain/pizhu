// Usage: pnpm eval            (uses MODEL_PROVIDER / model from env)
//        OLLAMA_MODEL=gemma4:12b pnpm eval
import { analyzeParagraph } from "@/mastra/analyze";
import { getModelConfig } from "@/mastra/model";
import { contextSchema } from "@/lib/schema";
import { addStats, emptyStats } from "@/lib/guard";
import { FIXTURES } from "./fixtures";
import { writeFileSync, mkdirSync } from "node:fs";

const ctx = contextSchema.parse({});
const { modelId, mode } = getModelConfig();
let hits = 0;
let expected = 0;
let cleanMustFix = 0;
let stats = emptyStats();
let ms = 0;
const rows: unknown[] = [];

for (const f of FIXTURES) {
  const t0 = Date.now();
  try {
    const r = await analyzeParagraph(ctx, f.text, 0, 1, f.id);
    const took = Date.now() - t0;
    ms += took;
    stats = addStats(stats, r.stats);
    const found = new Set(r.annotations.map((a) => a.category));
    const caught = f.expect.filter((c) => found.has(c));
    hits += caught.length;
    expected += f.expect.length;
    const must = r.annotations.filter((a) => a.severity === "must_fix").length;
    if (f.clean) cleanMustFix += must;
    rows.push({ id: f.id, caught, missed: f.expect.filter((c) => !found.has(c)), extra: [...found].filter((c) => !f.expect.includes(c)), must, ms: took });
    console.log(`${f.id.padEnd(16)} caught ${caught.length}/${f.expect.length}${f.clean ? `  (clean: ${must} must-fix)` : ""}  ${(took / 1000).toFixed(1)}s`);
  } catch (e) {
    rows.push({ id: f.id, error: String(e) });
    console.log(`${f.id.padEnd(16)} ERROR ${e}`);
  }
}

const summary = {
  model: modelId,
  mode,
  recall: +(hits / expected).toFixed(3),
  cleanParagraphMustFix: cleanMustFix,
  avgSecondsPerParagraph: +(ms / FIXTURES.length / 1000).toFixed(1),
  guard: stats,
};
console.log("\n", summary);
mkdirSync("eval/results", { recursive: true });
writeFileSync(`eval/results/${modelId.replace(/[^a-z0-9.-]/gi, "_")}.json`, JSON.stringify({ summary, rows }, null, 2));
