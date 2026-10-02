import { describe, expect, it } from "vitest";
import { guardParagraph, locateSpan, nudgeAllowed, wordEditDistance } from "@/lib/guard";
import type { ModelAnnotation } from "@/lib/schema";

const base: Omit<ModelAnnotation, "span" | "nudge"> = {
  category: "articles",
  severity: "must_fix",
  explanation_en: "",
  explanation_zh: "",
  l1_note: "",
  hint: "",
};

describe("wordEditDistance", () => {
  it("counts word edits", () => {
    expect(wordEditDistance("the society is", "society is")).toBe(1);
    expect(wordEditDistance("make a research", "conduct research")).toBe(2);
  });
});

describe("nudgeAllowed", () => {
  it("accepts a small local edit", () => {
    expect(nudgeAllowed("Many researches show", "Much research shows")).toBe(true);
  });
  it("rejects a rewrite", () => {
    expect(
      nudgeAllowed(
        "With the development of society, more and more people use phones",
        "Smartphone ownership has grown rapidly across the UK in the past decade",
      ),
    ).toBe(false);
  });
  it("rejects nudges that span sentences", () => {
    expect(nudgeAllowed("It is popular. Students use it", "It is popular; students use it")).toBe(false);
  });
  it("does not treat et al. as a sentence end", () => {
    expect(nudgeAllowed("Smith et al. argue", "Smith et al. argues")).toBe(true);
  });
  it("rejects a no-op", () => {
    expect(nudgeAllowed("the media", "the media")).toBe(false);
  });
});

describe("locateSpan", () => {
  const p = "In a word, the “new media” has changed  the society.";
  it("finds exact spans", () => {
    expect(locateSpan(p, "In a word")).toEqual({ start: 0, end: 9 });
  });
  it("tolerates quote and whitespace drift", () => {
    const loc = locateSpan(p, '"new media" has changed the society')!;
    expect(p.slice(loc.start, loc.end)).toBe("“new media” has changed  the society");
  });
  it("returns null for invented text", () => {
    expect(locateSpan(p, "everyone knows")).toBeNull();
  });
});

describe("guardParagraph", () => {
  const p = "Many researches show that social media is important, it affects students.";
  it("drops unlocatable spans, strips oversized nudges, keeps good ones", () => {
    const { annotations, stats } = guardParagraph(
      p,
      [
        { ...base, span: "Many researches show", nudge: "Much research shows" },
        { ...base, span: "is important, it affects students", nudge: "is important because it affects how students study and live their daily lives" },
        { ...base, span: "this sentence is not there", nudge: null },
      ],
      "p0",
    );
    expect(stats).toMatchObject({ proposed: 3, kept: 2, droppedUnlocated: 1, nudgesProposed: 2, nudgesStripped: 1 });
    expect(annotations[0].nudge).toBe("Much research shows");
    expect(annotations[1].nudge).toBeNull();
    expect(annotations[1].nudgeStripped).toBe(true);
  });
  it("drops overlapping spans", () => {
    const { stats } = guardParagraph(p, [
      { ...base, span: "social media is important", nudge: null },
      { ...base, span: "media is", nudge: null },
    ], "p0");
    expect(stats.droppedOverlap).toBe(1);
  });
});

import { mergeAnnotations, spellingAnnotations } from "@/lib/spelling";

describe("spellingAnnotations", () => {
  it("flags US spellings with case-matched UK nudges and skips overlaps", () => {
    const p = "Organizations analyze consumer behavior in the center.";
    const rules = spellingAnnotations(p, "p0", "zh-Hans");
    expect(rules.map((r) => r.nudge)).toEqual(["Organisations", "analyse", "behaviour", "centre"]);
    const model = guardParagraph(p, [{ ...base, span: "consumer behavior", nudge: null }], "p0").annotations;
    expect(mergeAnnotations(model, rules)).toHaveLength(4);
  });
});
