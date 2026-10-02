import { analyzeParagraph } from "@/mastra/analyze";
import { contextSchema } from "@/lib/schema";
import { SAMPLE_ESSAY } from "@/lib/sample";

const p = SAMPLE_ESSAY.split("\n\n")[Number(process.argv[2] ?? 0)];
const t0 = Date.now();
const r = await analyzeParagraph(contextSchema.parse({}), p, 0, 3, "p0");
console.log(JSON.stringify(r, null, 2));
console.log("ms", Date.now() - t0);
