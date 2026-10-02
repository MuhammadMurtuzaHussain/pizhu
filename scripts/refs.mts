import { mastra } from "@/mastra";
import { splitEssay } from "@/lib/paragraphs";
import { SAMPLE_ESSAY } from "@/lib/sample";

const { paragraphs, references } = splitEssay(SAMPLE_ESSAY);
const t0 = Date.now();
const run = await mastra.getWorkflow("referencesWorkflow").createRun();
const r = await run.start({ inputData: { body: paragraphs.join("\n\n"), references, script: "zh-Hans" } });
if (r.status !== "success") { console.log(JSON.stringify(r, null, 2).slice(0, 3000)); process.exit(1); }
for (const ref of r.result.refs) console.log(ref.status.padEnd(10), ref.issues.join(",").padEnd(8), `cited ${ref.citedInText}`, "|", ref.raw.slice(0, 70), "\n           ↳", ref.match?.title ?? "-", "|", ref.tips_en.join(" / "));
console.log("citedNotListed:", r.result.citedNotListed, "listedNotCited:", r.result.listedNotCited, "scholar:", r.result.scholarConfigured, "ms", Date.now() - t0);
