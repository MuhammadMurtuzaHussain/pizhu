"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/context";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/taxonomy";
import { Momo } from "./Momo";
import { CategoryIcon } from "./CategoryIcon";

/** Shown while Gemma reads: Mòmo, a brush-stroke progress bar, and a rotating habit tip so the wait teaches something. */
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
  const pct = total ? Math.max(6, (done / total) * 100) : 6;

  return (
    <div className="bezel">
      <div className="bezel-core grid items-center gap-5 p-5 sm:grid-cols-[auto_1fr]">
        <Momo state="reading" size={92} className="mx-auto" />
        <div className="min-w-0">
          <p aria-live="polite" className="text-sm font-medium text-ink">{t.reading.status(Math.min(done + 1, total || 1), total || 1)}</p>
          {/* A brush stroke fills as paragraphs finish. */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-paper-2">
            <motion.div
              className="h-full rounded-full bg-vermilion"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 18 }}
            />
          </div>
          <div className="mt-4 min-h-[4.5rem]">
            <p className="mb-1 text-xs text-ink-3">{t.reading.tipLabel}</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={tip}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-3"
              >
                <CategoryIcon id={c.id} size={22} className="mt-0.5 shrink-0 text-vermilion" />
                <div className="text-sm leading-relaxed">
                  <span className="font-medium text-ink">{c.label.en}</span>
                  <span className="text-ink-3"> · {c.label[zh]}</span>
                  <p className="font-kai text-[15px] text-ink-2">{c.why[zh]}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
