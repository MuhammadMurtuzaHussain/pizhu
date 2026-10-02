import { describe, expect, it } from "vitest";
import { extractInText, matchCitations } from "@/lib/citations";
import { splitEssay } from "@/lib/paragraphs";

describe("extractInText", () => {
  it("finds parenthetical, multi and narrative citations", () => {
    const body = "Media shape opinion (McLuhan, 1964; Castells, 2009: p. 12). Hall (1980) argues otherwise, as do Couldry and Hepp (2017) and Jenkins et al. (2013).";
    const got = extractInText(body).map((c) => `${c.surname} ${c.year}`);
    expect(got).toEqual(expect.arrayContaining(["McLuhan 1964", "Castells 2009", "Hall 1980", "Couldry 2017", "Jenkins 2013"]));
  });
});

describe("matchCitations", () => {
  it("reports missing and unused references", () => {
    const cites = extractInText("(Hall, 1980) and (Smith, 2021).");
    const r = matchCitations(cites, [
      { index: 0, surnames: ["Hall"], year: "1980" },
      { index: 1, surnames: ["Castells"], year: "2009" },
    ]);
    expect(r.citedNotListed.map((c) => c.surname)).toEqual(["Smith"]);
    expect(r.listedNotCited).toEqual([1]);
  });
});

describe("splitEssay", () => {
  it("separates the reference list", () => {
    const s = splitEssay("Intro para.\n\nSecond para.\n\nReferences\nHall, S. (1980) Encoding/decoding.\nCastells, M. (2009) Communication Power.");
    expect(s.paragraphs).toHaveLength(2);
    expect(s.references).toHaveLength(2);
  });
});
