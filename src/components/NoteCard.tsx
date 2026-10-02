"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import type { Annotation } from "@/lib/schema";
import { CATEGORIES } from "@/lib/taxonomy";
import { CategoryIcon } from "./CategoryIcon";

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
  flat = false,
}: {
  a: Annotation;
  active: boolean;
  resolved: boolean;
  onActivate: () => void;
  onResolve: () => void;
  onDismiss: () => void;
  /** In the mobile sheet the card is always open and sits without its own frame. */
  flat?: boolean;
}) {
  const { t, locale, explain, script } = useI18n();
  const reduce = useReducedMotion();
  const cat = CATEGORIES[a.category];
  const zhLabel = cat.label[locale === "en" ? script : locale];
  const showEn = explain !== "zh";
  const showZh = explain !== "en";
  const open = active || flat;

  return (
    <article
      id={flat ? undefined : `card-${a.id}`}
      onClick={onActivate}
      className={
        flat
          ? "relative"
          : `relative cursor-pointer rounded-[1.25rem] border bg-card p-4 transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              active ? "border-ink-3/40 shadow-soft" : "border-rule hover:border-ink-3/30"
            }`
      }
    >
      {/* A small vermilion seal lands on handled notes. */}
      <AnimatePresence>
        {resolved && (
          <motion.span
            initial={reduce ? false : { scale: 1.8, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="absolute -top-2 right-3 grid h-8 w-8 place-items-center rounded-md border-2 border-vermilion bg-card text-vermilion"
            aria-label={t.card.resolved}
          >
            <Check size={16} weight="bold" aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>

      <header className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-0.5 font-medium ${sevStyle[a.severity]}`}>{t.card.severity[a.severity]}</span>
        <span className="inline-flex items-center gap-1.5 text-ink-2">
          <CategoryIcon id={a.category} size={15} />
          {locale === "en" ? cat.label.en : zhLabel}
          <span className="text-ink-3">{locale === "en" ? zhLabel : cat.label.en}</span>
        </span>
      </header>

      <p className={`mb-2.5 font-serif text-[15px] leading-snug ${resolved ? "text-ink-3 line-through decoration-rule" : "text-ink"}`}>
        “{a.span}”
      </p>

      {showEn ? (
        <p className="text-sm leading-relaxed text-ink">{a.explanation_en}</p>
      ) : (
        <p className="font-kai text-[15.5px] leading-relaxed text-ink">{a.explanation_zh}</p>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              {showEn && showZh && <p className="font-kai text-[15.5px] leading-relaxed text-ink-2">{a.explanation_zh}</p>}
              {a.l1_note && showZh && (
                <div className="rounded-xl bg-vermilion-soft/70 px-3.5 py-2.5">
                  <div className="mb-0.5 text-xs font-medium text-vermilion">{t.card.why}</div>
                  <p className="font-kai text-[15px] leading-relaxed text-ink">{a.l1_note}</p>
                </div>
              )}
              {a.hint && (
                <p className="text-sm">
                  <span className="mr-1.5 font-medium text-ink">{t.card.hint}</span>
                  <span className="text-ink-2">{a.hint}</span>
                </p>
              )}
              {a.nudge ? (
                <p className="text-sm">
                  <span className="mr-1.5 font-medium text-ink">{t.card.nudge}</span>
                  <span className="font-serif text-ink-2">
                    <s className="decoration-ink-3">{a.span}</s> <span className="text-ink-3">→</span> <span className="text-ink">{a.nudge}</span>
                  </span>
                </p>
              ) : (
                <p className="text-xs text-ink-3">{t.card.nudgeHidden}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper transition-transform active:scale-[0.97]"
                >
                  <Check size={14} weight="bold" aria-hidden />
                  {resolved ? t.card.resolved : t.card.gotIt}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-xs text-ink-2 transition-transform hover:bg-paper-2 active:scale-[0.97]"
                >
                  <X size={14} aria-hidden />
                  {t.card.notError}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
