import type { Annotation } from "./schema";
import type { ParaState } from "./useAnalysis";
import { CATEGORIES } from "./taxonomy";

// "Download for Word": the student's own text, unchanged, with every note as a
// real Word comment in the margin (Word comments are literally margin notes).

export type DocxLabels = {
  title: string;
  intro: string;
  severity: Record<Annotation["severity"], string>;
  why: string;
  hint: string;
  nudge: string;
};

export async function buildDocx(
  paragraphs: ParaState[],
  opts: { explain: "both" | "en" | "zh"; zh: "zh-Hans" | "zh-Hant"; hidden: Set<string>; labels: DocxLabels },
): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, CommentRangeStart, CommentRangeEnd, CommentReference, HeadingLevel } = await import("docx");
  const { explain, zh, hidden, labels } = opts;
  const showEn = explain !== "zh";
  const showZh = explain !== "en";

  const comments: { id: number; author: string; initials: string; date: Date; children: InstanceType<typeof Paragraph>[] }[] = [];
  let nextId = 0;

  const commentBody = (a: Annotation) => {
    const c = CATEGORIES[a.category];
    const out = [
      new Paragraph({ children: [new TextRun({ text: `${labels.severity[a.severity]} · ${c.label.en} · ${c.label[zh]}`, bold: true })] }),
    ];
    if (showEn) out.push(new Paragraph({ children: [new TextRun(a.explanation_en)] }));
    if (showZh) out.push(new Paragraph({ children: [new TextRun(a.explanation_zh)] }));
    if (showZh && a.l1_note) out.push(new Paragraph({ children: [new TextRun({ text: `${labels.why}: `, bold: true }), new TextRun(a.l1_note)] }));
    if (a.hint) out.push(new Paragraph({ children: [new TextRun({ text: `${labels.hint}: `, bold: true }), new TextRun(a.hint)] }));
    if (a.nudge) out.push(new Paragraph({ children: [new TextRun({ text: `${labels.nudge}: `, bold: true }), new TextRun(`${a.span} → ${a.nudge}`)] }));
    return out;
  };

  const body = paragraphs.map((p) => {
    if (p.status === "skipped") return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(p.text)] });
    const notes = p.annotations.filter((a) => !hidden.has(a.id)).sort((a, b) => a.start - b.start);
    const runs: (InstanceType<typeof TextRun> | InstanceType<typeof CommentRangeStart> | InstanceType<typeof CommentRangeEnd>)[] = [];
    let pos = 0;
    for (const a of notes) {
      if (a.start < pos) continue;
      if (a.start > pos) runs.push(new TextRun(p.text.slice(pos, a.start)));
      const id = nextId++;
      comments.push({ id, author: "Mòmo · Pīzhù", initials: "MM", date: new Date(), children: commentBody(a) });
      runs.push(new CommentRangeStart(id), new TextRun(p.text.slice(a.start, a.end)), new CommentRangeEnd(id), new TextRun({ children: [new CommentReference(id)] }));
      pos = a.end;
    }
    if (pos < p.text.length) runs.push(new TextRun(p.text.slice(pos)));
    return new Paragraph({ children: runs, spacing: { after: 240, line: 360 } });
  });

  const doc = new Document({
    creator: "Pīzhù 批注",
    title: labels.title,
    comments: { children: comments },
    styles: { default: { document: { run: { font: "Times New Roman", size: 24 } } } },
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: labels.title, bold: true, size: 28, font: "Arial" })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: labels.intro, italics: true, color: "6F6680", size: 20, font: "Arial" })], spacing: { after: 360 } }),
          ...body,
        ],
      },
    ],
  });
  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
