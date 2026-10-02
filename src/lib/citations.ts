// Deterministic Harvard citation matching: no model involved, so the result is
// exact and explainable. Finds in-text citations in the body and checks them
// against surnames + years in the reference list.

export type InText = { raw: string; surname: string; year: string };

const YEAR = String.raw`(\d{4}[a-z]?|n\.d\.)`;
const NAME = String.raw`[A-Z][A-Za-z'’\-]+`;

/** Extract (Surname, 2020), (Surname and Other, 2020: p. 4), Surname et al. (2020), (A, 2019; B, 2020). */
export function extractInText(body: string): InText[] {
  const out: InText[] = [];
  // Parenthetical groups, possibly several citations separated by ';'
  for (const m of body.matchAll(/\(([^()]*?\d{4}[a-z]?[^()]*?)\)/g)) {
    for (const part of m[1].split(";")) {
      const c = part.match(new RegExp(String.raw`(${NAME})(?:\s+(?:and|&)\s+${NAME}|\s+et al\.?)?,?\s+${YEAR}`));
      if (c) out.push({ raw: part.trim(), surname: c[1], year: c[2] });
    }
  }
  // Narrative: Surname (2020), Surname and Other (2020), Surname et al. (2020)
  for (const m of body.matchAll(new RegExp(String.raw`(${NAME})(?:\s+(?:and|&)\s+${NAME}|\s+et al\.?)?\s+\(${YEAR}[^)]*\)`, "g"))) {
    out.push({ raw: m[0], surname: m[1], year: m[2] });
  }
  const seen = new Set<string>();
  return out.filter((c) => {
    const k = `${c.surname.toLowerCase()}|${c.year}|${c.raw}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export type RefKey = { index: number; surnames: string[]; year: string | null };

export type MatchReport = {
  citedNotListed: InText[];
  listedNotCited: number[];
  matches: Record<number, InText[]>;
};

export function matchCitations(cites: InText[], refs: RefKey[]): MatchReport {
  const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'");
  const matches: Record<number, InText[]> = {};
  const citedNotListed: InText[] = [];
  for (const c of cites) {
    const hit = refs.find(
      (r) => r.surnames.some((s) => norm(s) === norm(c.surname)) && (r.year ?? "").replace(/[a-z]$/, "") === c.year.replace(/[a-z]$/, ""),
    );
    if (hit) (matches[hit.index] ??= []).push(c);
    else citedNotListed.push(c);
  }
  const listedNotCited = refs.filter((r) => !matches[r.index]).map((r) => r.index);
  return { citedNotListed, listedNotCited, matches };
}
