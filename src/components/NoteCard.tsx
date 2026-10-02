"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Annotation } from "@/lib/schema";
import { CATEGORIES } from "@/lib/taxonomy";

const sevStyle = {
  must_fix: "bg-must-bg text-must",
  worth_fixing: "bg-worth-bg text-worth",
  style: "bg-style-bg text-style",
} as const;

export function NoteCard({
  a,
  active,
  resolved,
  onActivate,
  onResolve,
  onDismiss,
}: {
  a: Annotation;
  active: boolean;
  resolved: boolean;
  onActivate: () => void;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const { t, locale, explain, script } = useI18n();
  const cat = CATEGORIES[a.category];
  // Category label: English UI shows "Articles · 冠词" so the Chinese term is always learnt alongside.
  const zhLabel = cat.label[locale === "en" ? script : locale];
  const label = locale === "en" ? `${cat.label.en} · ${zhLabel}` : `${zhLabel} · ${cat.label.en}`;
  const showEn = explain !== "zh";
  const showZh = explain !== "en";

  return (
    <article
      id={`card-${a.id}`}
      onClick={onActivate}
      className={`group cursor-pointer rounded-xl border bg-card p-4 transition-shadow ${
        active ? "border-ink-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)]" : "border-rule"
      } ${resolved ? "opacity-55" : ""}`}
    >
      <header className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${sevStyle[a.severity]}`}>{t.card.severity[a.severity]}</span>
        <span className="text-ink-2">{label}</span>
      </header>

      <p className="mb-3 font-serif text-[15px] leading-snug text-ink">
        <span className="rounded bg-paper-2 px-1">“{a.span}”</span>
      </p>

      {/* Collapsed: one explanation. Open: the second language, the L1 note, hint and nudge. */}
      <p className="text-sm leading-relaxed text-ink">{showEn ? a.explanation_en : a.explanation_zh}</p>

      {active && (
        <div className="mt-2 space-y-3">
          {showEn && showZh && <p className="text-sm leading-relaxed text-ink-2">{a.explanation_zh}</p>}
          {a.l1_note && showZh && (
            <div className="rounded-lg bg-vermilion-soft/60 px-3 py-2 text-sm">
              <div className="mb-0.5 text-xs font-medium text-vermilion">{t.card.why}</div>
              <p className="leading-relaxed text-ink">{a.l1_note}</p>
            </div>
          )}
          {a.hint && (
            <div className="text-sm">
              <span className="mr-1 font-medium text-ink">{t.card.hint}:</span>
              <span className="text-ink-2">{a.hint}</span>
            </div>
          )}
          {a.nudge ? (
            <div className="text-sm">
              <span className="mr-1 font-medium text-ink">{t.card.nudge}:</span>
              <span className="font-serif text-ink-2">
                <s className="decoration-ink-3">{a.span}</s> → <span className="text-ink">{a.nudge}</span>
              </span>
            </div>
          ) : (
            <p className="text-xs italic text-ink-3">{t.card.nudgeHidden}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve();
              }}
              className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:opacity-90"
            >
              {resolved ? t.card.resolved : t.card.gotIt}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="rounded-lg border border-rule px-3 py-1.5 text-xs text-ink-2 hover:bg-paper-2"
            >
              {t.card.notError}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
