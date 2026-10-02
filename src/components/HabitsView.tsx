"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { clearHabits, loadHabits, totals, type HabitSession } from "@/lib/habits";
import { CATEGORIES } from "@/lib/taxonomy";
import { Momo } from "./Momo";
import { CategoryIcon } from "./CategoryIcon";

export function HabitsView() {
  const { t, locale, script } = useI18n();
  // Only mounted after the user opens this tab, so reading localStorage here is hydration-safe.
  const [sessions, setSessions] = useState<HabitSession[]>(() => (typeof window === "undefined" ? [] : loadHabits()));

  const top = totals(sessions);
  const max = top[0]?.[1] ?? 1;
  const L = locale === "en" ? "en" : locale;
  const zh = locale === "en" ? script : locale;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pizhu-habits.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{t.habits.title}</h2>
          <p className="text-sm text-ink-3">{t.habits.intro}</p>
        </div>
        {sessions.length > 0 && (
          <div className="ml-auto flex gap-2 text-xs">
            <span className="self-center text-ink-3">{t.habits.sessions(sessions.length)}</span>
            <button onClick={exportJson} className="rounded-full border border-rule bg-card px-3 py-1.5 text-ink-2 hover:bg-paper-2">
              {t.habits.export}
            </button>
            <button
              onClick={() => {
                if (confirm(t.habits.confirmClear)) {
                  clearHabits();
                  setSessions([]);
                }
              }}
              className="rounded-full border border-rule bg-card px-3 py-1.5 text-ink-2 hover:bg-paper-2"
            >
              {t.habits.clear}
            </button>
          </div>
        )}
      </div>

      {top.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Momo state="sleepy" size={120} />
          <p className="text-sm text-ink-3">{t.habits.empty}</p>
        </div>
      ) : (
        <>
          <ul className="mb-10 space-y-2">
            {top.map(([id, n]) => (
              <li key={id} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3 text-sm">
                <span className="inline-flex min-w-0 items-center gap-2 text-ink-2">
                  <CategoryIcon id={id} size={15} className="shrink-0" />
                  <span className="truncate">{CATEGORIES[id].label[L]}</span>
                </span>
                <span className="h-2 rounded-full bg-paper-2">
                  <span className="block h-2 rounded-full bg-vermilion/70" style={{ width: `${(n / max) * 100}%` }} />
                </span>
                <span className="tabular-nums text-ink-3">{n}</span>
              </li>
            ))}
          </ul>

          <h3 className="mb-3 text-sm font-medium text-ink-2">{t.habits.top}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {top.slice(0, 3).map(([id]) => {
              const c = CATEGORIES[id];
              return (
                <article key={id} className="rounded-[1.25rem] border border-rule bg-card p-4 text-sm">
                  <h4 className="mb-2 font-medium text-ink">
                    {c.label.en} <span className="text-ink-3">· {c.label[zh]}</span>
                  </h4>
                  <p className="mb-2 text-ink-2">{c.rule[L]}</p>
                  <p className="font-serif text-ink-3">
                    <s>{c.example.wrong}</s>
                  </p>
                  <p className="font-serif text-ink">{c.example.better}</p>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
