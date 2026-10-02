"use client";

import { motion, useReducedMotion } from "motion/react";
import { CheckCircle, Circle, CircleHalf, Lightbulb, Quotes, Target } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import type { RunState } from "@/lib/useAnalysis";
import { Momo } from "./Momo";

const STATUS = {
  met: { cls: "bg-ok-bg text-ok", Icon: CheckCircle },
  partly: { cls: "bg-worth-bg text-worth", Icon: CircleHalf },
  missing: { cls: "bg-must-bg text-must", Icon: Circle },
} as const;

/** Mòmo's read of the whole paper: the argument as understood, priorities, and the brief. */
export function OverviewCard({ overview }: { overview: NonNullable<RunState["overview"]> }) {
  const { t, explain } = useI18n();
  const reduce = useReducedMotion();
  const o = t.overview;
  const en = explain !== "zh";
  const zh = explain !== "en";

  if (overview.status === "pending") {
    return (
      <div className="mb-8 flex items-center gap-4 rounded-[1.75rem] border-2 border-dashed border-taro-2/60 bg-card/60 p-5">
        <Momo state="reading" size={56} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p aria-live="polite" className="text-sm font-semibold text-taro">
            {o.reading}
          </p>
          <div className="reading mt-2 h-3 w-2/3 rounded-full" />
        </div>
      </div>
    );
  }
  if (overview.status === "error" || !overview.data) {
    return <p className="mb-8 rounded-2xl bg-paper-2 px-4 py-3 text-sm text-ink-3">{o.failed}</p>;
  }

  const d = overview.data;
  return (
    <motion.section
      aria-label={o.title}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-10 rounded-[2rem] bg-taro-soft p-5 sm:p-7"
    >
      <header className="mb-5 flex items-center gap-3">
        <Momo state="happy" size={52} className="shrink-0" />
        <h2 className="text-xl font-bold tracking-tight text-ink">{o.title}</h2>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-[1.25rem] bg-card p-4">
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-taro">
              <Quotes size={14} weight="fill" aria-hidden />
              {o.argument}
            </p>
            {en && <p className="font-serif text-[17px] leading-relaxed text-ink">{d.argument_en}</p>}
            {zh && <p className={`font-kai text-[16px] leading-relaxed ${en ? "mt-1.5 text-ink-2" : "text-ink"}`}>{d.argument_zh}</p>}
          </div>
          <div className="rounded-[1.25rem] bg-card p-4">
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-ok">
              <CheckCircle size={14} weight="fill" aria-hidden />
              {o.strength}
            </p>
            {en && <p className="text-sm leading-relaxed text-ink">{d.strength_en}</p>}
            {zh && <p className={`font-kai text-[15px] leading-relaxed ${en ? "mt-1 text-ink-2" : "text-ink"}`}>{d.strength_zh}</p>}
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-card p-4">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-taro">
            <Lightbulb size={14} weight="fill" aria-hidden />
            {o.priorities}
          </p>
          <ol className="space-y-3">
            {d.priorities.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-paper">{i + 1}</span>
                <div className="min-w-0">
                  <span className="mb-0.5 inline-block rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                    {t.results.dimensions[p.dimension]}
                  </span>
                  {en && <p className="leading-relaxed text-ink">{p.en}</p>}
                  {zh && <p className={`font-kai text-[15px] leading-relaxed ${en ? "text-ink-2" : "text-ink"}`}>{p.zh}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {d.criteria.length > 0 && (
        <div className="mt-4 rounded-[1.25rem] bg-card p-4">
          <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-taro">
            <Target size={14} weight="fill" aria-hidden />
            {o.criteria}
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {d.criteria.map((c, i) => {
              const S = STATUS[c.status];
              return (
                <li key={i} className="rounded-2xl border border-rule p-3 text-sm">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="font-semibold leading-snug text-ink">{c.criterion}</span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${S.cls}`}>
                      <S.Icon size={13} weight="fill" aria-hidden />
                      {o.status[c.status]}
                    </span>
                  </div>
                  {en && <p className="leading-relaxed text-ink-2">{c.en}</p>}
                  {zh && <p className={`font-kai text-[15px] leading-relaxed ${en ? "mt-1 text-ink-2" : "text-ink"}`}>{c.zh}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </motion.section>
  );
}
