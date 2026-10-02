"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/context";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/taxonomy";
import { CategoryIcon } from "./CategoryIcon";

/** While Gemma reads: one pearl per paragraph fills in, and a habit tip rotates so the wait teaches something. */
export function ReadingPanel({ done, total }: { done: number; total: number }) {
  const { t, locale, script } = useI18n();
  const reduce = useReducedMotion();
  const [tip, setTip] = useState(() => Math.floor(Math.random() * CATEGORY_IDS.length));

  useEffect(() => {
    const id = setInterval(() => setTip((i) => (i + 1) % CATEGORY_IDS.length), 7000);
    return () => clearInterval(id);
  }, []);

  const c = CATEGORIES[CATEGORY_IDS[tip]];
  const zh = locale === "en" ? script : locale;

  return (
    <div className="rounded-[1.75rem] bg-taro-soft p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p aria-live="polite" className="text-sm font-semibold text-taro">
          {t.reading.status(Math.min(done + 1, total || 1), total || 1)}
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, k) => (
            <motion.span
              key={k}
              className={`block h-3.5 w-3.5 rounded-full ${k < done ? "bg-ink" : "bg-taro-2/50"}`}
              animate={k < done ? { scale: [1.5, 1] } : k === done && !reduce ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={k === done ? { duration: 1.2, repeat: Infinity } : { type: "spring", stiffness: 400, damping: 15 }}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 min-h-[4.5rem] rounded-2xl bg-card p-4">
        <p className="mb-1.5 text-xs font-medium text-ink-3">{t.reading.tipLabel}</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={tip}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-3"
          >
            <CategoryIcon id={c.id} size={22} className="mt-0.5 shrink-0 text-taro" />
            <div className="text-sm leading-relaxed">
              <span className="font-semibold text-ink">{c.label.en}</span>
              <span className="text-ink-3"> · {c.label[zh]}</span>
              <p className="font-kai text-[15.5px] text-ink-2">{c.why[zh]}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
