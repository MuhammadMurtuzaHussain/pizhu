"use client";

import { useI18n } from "@/lib/i18n/context";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/taxonomy";

export function GlossaryView() {
  const { t, locale, script } = useI18n();
  const zh = locale === "en" ? script : locale;
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="mb-2 font-serif text-2xl text-ink">{t.glossary.title}</h2>
      <p className="mb-8 font-serif text-lg leading-relaxed text-ink-2">{t.glossary.intro}</p>
      <div className="space-y-4">
        {CATEGORY_IDS.map((id, i) => {
          const c = CATEGORIES[id];
          return (
            <article key={id} className="rounded-xl border border-rule bg-card p-5">
              <h3 className="mb-3 flex items-baseline gap-2">
                <span className="font-serif text-sm text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium text-ink">{c.label.en}</span>
                <span className="text-ink-2">{c.label[zh]}</span>
              </h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="mb-0.5 text-xs font-medium text-ink-3">{t.glossary.rule}</dt>
                  <dd className="text-ink">{c.rule.en}</dd>
                  <dd className="mt-1 text-ink-2">{c.rule[zh]}</dd>
                </div>
                <div>
                  <dt className="mb-0.5 text-xs font-medium text-ink-3">{t.glossary.why}</dt>
                  <dd className="text-ink-2">{c.why[zh]}</dd>
                </div>
              </dl>
              <div className="mt-3 rounded-lg bg-paper-2 px-3 py-2 font-serif text-[15px]">
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
