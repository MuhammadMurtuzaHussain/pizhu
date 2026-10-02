import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildDocx } from "@/lib/exportDocx";
import type { ParaState } from "@/lib/useAnalysis";
import type { Annotation } from "@/lib/schema";

const note = (id: string, start: number, end: number, span: string): Annotation => ({
  id, start, end, span, category: "set_phrases", severity: "worth_fixing",
  explanation_en: "Vague opener.", explanation_zh: "空泛的开头。", l1_note: "", hint: "What changed?", nudge: null, nudgeStripped: false,
});

const text = "With the development of society, more and more people use TikTok.";
const para: ParaState = {
  id: "p0", text, status: "done", summary: null,
  stats: { proposed: 2, kept: 2, droppedUnlocated: 0, droppedOverlap: 0, nudgesProposed: 0, nudgesStripped: 0 },
  annotations: [note("a", 0, 31, "With the development of society"), note("b", 33, 46, "more and more")],
};
const labels = { title: "Notes", intro: "Unchanged.", severity: { must_fix: "Must fix", worth_fixing: "Worth fixing", style: "Style" }, why: "Why", hint: "Hint", nudge: "Nudge" };

async function unzip(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return { doc: await zip.file("word/document.xml")!.async("string"), comments: await zip.file("word/comments.xml")!.async("string") };
}

describe("buildDocx", () => {
  it("keeps the student's text and adds one Word comment per note", async () => {
    const { doc, comments } = await unzip(await buildDocx([para], { explain: "both", zh: "zh-Hans", hidden: new Set(), labels }));
    expect((comments.match(/<w:comment /g) ?? []).length).toBe(2);
    expect(comments).toContain("Vague opener.");
    expect(comments).toContain("空泛的开头。");
    // Every word of the original sentence is still in the document body.
    const bodyText = (doc.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, "")).join("");
    expect(bodyText).toContain(text);
  });

  it("leaves out hidden notes", async () => {
    const { comments } = await unzip(await buildDocx([para], { explain: "en", zh: "zh-Hans", hidden: new Set(["b"]), labels }));
    expect((comments.match(/<w:comment /g) ?? []).length).toBe(1);
    expect(comments).not.toContain("空泛的开头。");
  });
});
