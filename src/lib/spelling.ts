import type { Annotation } from "./schema";

// Deterministic US → UK spelling check. A word list is more reliable than a
// small model for this, so rules handle spelling and Gemma handles the
// judgement calls. Words whose US form is also valid UK usage in some senses
// (e.g. "program" for software, "license" as a verb) are left out on purpose.

const US_TO_UK: Record<string, string> = {
  analyze: "analyse", analyzed: "analysed", analyzing: "analysing",
  organize: "organise", organized: "organised", organizing: "organising", organization: "organisation", organizations: "organisations", organizational: "organisational",
  realize: "realise", realized: "realised", realizing: "realising",
  recognize: "recognise", recognized: "recognised", recognizing: "recognising",
  emphasize: "emphasise", emphasized: "emphasised", emphasizes: "emphasises",
  criticize: "criticise", criticized: "criticised", criticizes: "criticises",
  summarize: "summarise", summarized: "summarised", summarizes: "summarises",
  globalization: "globalisation", digitalization: "digitalisation", normalization: "normalisation",
  socialize: "socialise", socialization: "socialisation", characterize: "characterise", characterized: "characterised",
  minimize: "minimise", maximize: "maximise", prioritize: "prioritise", utilize: "utilise", utilized: "utilised",
  categorize: "categorise", categorized: "categorised", legitimize: "legitimise", marginalized: "marginalised",
  behavior: "behaviour", behaviors: "behaviours", behavioral: "behavioural",
  color: "colour", colors: "colours", favor: "favour", favorite: "favourite", favorable: "favourable",
  honor: "honour", humor: "humour", labor: "labour", neighbor: "neighbour", neighborhood: "neighbourhood",
  center: "centre", centers: "centres", centered: "centred", theater: "theatre", fiber: "fibre",
  defense: "defence", offense: "offence",
  catalog: "catalogue", dialog: "dialogue", analog: "analogue",
  traveled: "travelled", traveling: "travelling", modeling: "modelling", modeled: "modelled", labeled: "labelled", labeling: "labelling",
  enrollment: "enrolment", fulfill: "fulfil", skillful: "skilful",
  aging: "ageing", judgment: "judgement",
};

const RE = new RegExp(String.raw`\b(${Object.keys(US_TO_UK).join("|")})\b`, "gi");

const matchCase = (src: string, uk: string) =>
  src === src.toUpperCase() ? uk.toUpperCase() : src[0] === src[0].toUpperCase() ? uk[0].toUpperCase() + uk.slice(1) : uk;

export function spellingAnnotations(paragraph: string, idPrefix: string, script: "zh-Hans" | "zh-Hant"): Annotation[] {
  const out: Annotation[] = [];
  for (const m of paragraph.matchAll(RE)) {
    const us = m[0];
    const uk = matchCase(us, US_TO_UK[us.toLowerCase()]);
    out.push({
      id: `${idPrefix}-sp${out.length}`,
      span: us,
      start: m.index!,
      end: m.index! + us.length,
      category: "uk_conventions",
      severity: "worth_fixing",
      explanation_en: `"${us}" is the American spelling. UK and Irish universities expect British spelling: "${uk}".`,
      explanation_zh:
        script === "zh-Hant"
          ? `「${us}」是美式拼寫。英國和愛爾蘭的大學要求英式拼寫：「${uk}」。`
          : `“${us}”是美式拼写。英国和爱尔兰的大学要求英式拼写：“${uk}”。`,
      l1_note:
        script === "zh-Hant"
          ? "台灣和中國的英文教學多採用美式拼寫，拼字檢查也常預設美式英文。"
          : "中国和台湾的英语教学多采用美式拼写，拼写检查也常默认美式英语。",
      hint: "Set your word processor's language to English (UK) so it flags these for you.",
      nudge: uk,
      nudgeStripped: false,
    });
  }
  return out;
}

/**
 * Add rule-based notes. A rule note replaces an overlapping model note only if
 * that note is optional "style" polish; otherwise Gemma's note wins.
 */
export function mergeAnnotations(model: Annotation[], rules: Annotation[]): Annotation[] {
  let merged = [...model];
  for (const r of rules) {
    const overlaps = merged.filter((m) => r.start < m.end && m.start < r.end);
    if (overlaps.every((m) => m.severity === "style" && m.category !== "uk_conventions")) {
      merged = merged.filter((m) => !overlaps.includes(m));
      merged.push(r);
    }
  }
  return merged.sort((a, b) => a.start - b.start);
}
