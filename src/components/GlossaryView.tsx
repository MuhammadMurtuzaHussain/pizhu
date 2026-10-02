"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowDown } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/taxonomy";
import { CategoryIcon } from "./CategoryIcon";

export function GlossaryView() {
  const { t, locale, script } = useI18n();
  const reduce = useReducedMotion();
  const zh = locale === "en" ? script : locale;
  return (
    <section className="mx-auto max-w-5xl">
      <h2 className="text-3xl font-bold tracking-tight text-ink">{t.glossary.title}</h2>
      <p className="mb-10 mt-2 max-w-[65ch] text-base leading-relaxed text-ink-2">{t.glossary.intro}</p>
      <div className="grid gap-5 lg:grid-cols-2">
        {CATEGORY_IDS.map((id, i) => {
          const c = CATEGORIES[id];
          return (
            <motion.article
              key={id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col rounded-[1.75rem] border border-rule bg-card p-6"
            >
              <header className="mb-4 flex items-center gap-3">
                <span className={`sticker grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-taro-soft text-taro ${i % 2 ? "rotate-3" : "-rotate-3"}`}>
                  <CategoryIcon id={id} size={24} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-tight tracking-tight text-ink">{c.label.en}</h3>
                  <p className="font-kai text-[15px] text-ink-3">{c.label[zh]}</p>
                </div>
              </header>
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="mb-0.5 text-xs font-semibold text-taro">{t.glossary.rule}</p>
                  <p className="text-ink">{c.rule.en}</p>
                  {locale !== "en" && <p className="mt-1 font-kai text-[15px] text-ink-2">{c.rule[zh]}</p>}
                </div>
                <div className="rounded-2xl bg-paper-2/70 px-4 py-3">
                  <p className="mb-0.5 text-xs font-semibold text-taro">{t.glossary.why}</p>
                  <p className="font-kai text-[15.5px] text-ink">{c.why[zh]}</p>
                  {locale === "en" && <p className="mt-1 text-ink-2">{c.why.en}</p>}
                </div>
              </div>
              <div className="mt-auto pt-4 font-serif text-[15.5px] leading-snug">
                <p className="rounded-t-xl border-l-4 border-must bg-must-bg/60 px-3 py-2 text-ink-2 line-through decoration-must/60">{c.example.wrong}</p>
                <div className="flex justify-center py-0.5 text-ink-3" aria-hidden>
                  <ArrowDown size={14} />
                </div>
                <p className="rounded-b-xl border-l-4 border-ok bg-ok-bg/60 px-3 py-2 text-ink">{c.example.better}</p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
