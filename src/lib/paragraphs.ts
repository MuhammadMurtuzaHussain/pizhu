// Splits an essay into paragraphs and separates the reference list, so the
// tutor sees prose and the reference checker sees references.

const REF_HEADING = /^\s*(references?( list)?|bibliography|works cited|sources|参考文献|參考文獻)\s*:?\s*$/i;

export type SplitEssay = { paragraphs: string[]; references: string[] };

export function splitEssay(text: string): SplitEssay {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const refStart = lines.findIndex((l) => REF_HEADING.test(l));
  const body = refStart === -1 ? lines : lines.slice(0, refStart);
  const refs = refStart === -1 ? [] : lines.slice(refStart + 1);

  // Pasted essays use either blank lines or single newlines between paragraphs.
  const hasBlankLines = /\n\s*\n/.test(body.join("\n").trim());
  const paragraphs = (hasBlankLines ? body.join("\n").split(/\n\s*\n/) : body)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter((p) => p.length > 0);

  const references = refs.map((r) => r.trim()).filter((r) => r.length > 0);
  return { paragraphs, references };
}

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** A heading-like line (short, no final punctuation) gets no feedback. */
export const isHeading = (p: string) => wordCount(p) <= 8 && !/[.!?:;,)]$/.test(p.trim());
