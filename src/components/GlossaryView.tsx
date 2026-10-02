"use client";

import { useI18n } from "@/lib/i18n/context";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/taxonomy";
import { CategoryIcon } from "./CategoryIcon";

export function GlossaryView() {
  const { t, locale, script } = useI18n();
  const zh = locale === "en" ? script : locale;
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-ink">{t.glossary.title}</h2>
      <p className="mb-8 max-w-[65ch] text-base leading-relaxed text-ink-2">{t.glossary.intro}</p>
      <div className="space-y-4">
        {CATEGORY_IDS.map((id) => {
          const c = CATEGORIES[id];
          return (
            <article key={id} className="rounded-[1.25rem] border border-rule bg-card p-5">
              <h3 className="mb-3 flex items-baseline gap-2">
                <CategoryIcon id={id} size={20} className="self-center text-taro" />
                <span className="font-medium text-ink">{c.label.en}</span>
                <span className="text-ink-2">{c.label[zh]}</span>
              </h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="mb-0.5 text-xs font-medium text-ink-3">{t.glossary.rule}</dt>
                  <dd className="text-ink">{c.rule.en}</dd>
                  <dd className="mt-1 font-kai text-[15px] text-ink-2">{c.rule[zh]}</dd>
                </div>
                <div>
                  <dt className="mb-0.5 text-xs font-medium text-ink-3">{t.glossary.why}</dt>
                  <dd className="font-kai text-[15px] leading-relaxed text-ink-2">{c.why[zh]}</dd>
                </div>
              </dl>
              <div className="mt-3 rounded-xl bg-paper-2 px-3 py-2 font-serif text-[15px]">
                <span className="text-ink-3 line-through">{c.example.wrong}</span>
                <span className="mx-2 text-ink-3">→</span>
                <span className="text-ink">{c.example.better}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
