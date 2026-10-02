"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DownloadSimple } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import { clearHabits, clearHandled, loadHabits, loadHandled, STAMP_AT, totals, type HabitSession } from "@/lib/habits";
import { saveNodeAsPng } from "@/lib/snapshot";
import { CATEGORIES, CATEGORY_IDS, type CategoryId } from "@/lib/taxonomy";
import { Momo } from "./Momo";
import { CategoryIcon } from "./CategoryIcon";

type Handled = Partial<Record<CategoryId, number>>;

export function HabitsView() {
  const { t, locale, script } = useI18n();
  const reduce = useReducedMotion();
  // Only mounted after the user opens this tab, so reading localStorage here is hydration-safe.
  const [sessions, setSessions] = useState<HabitSession[]>(() => (typeof window === "undefined" ? [] : loadHabits()));
  const [handled, setHandled] = useState<Handled>(() => (typeof window === "undefined" ? {} : loadHandled()));
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const reportRef = useRef<HTMLDivElement>(null);

  const top = totals(sessions);
  const max = top[0]?.[1] ?? 1;
  const L = locale === "en" ? "en" : locale;
  const zh = locale === "en" ? script : locale;
  const earned = CATEGORY_IDS.filter((id) => (handled[id] ?? 0) >= STAMP_AT);
  const recent = sessions.filter((s) => now - new Date(s.at).getTime() < 30 * 86_400_000).length;

  const backup = () => {
    const blob = new Blob([JSON.stringify({ sessions, handled }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pizhu-habits.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const report = async () => {
    if (!reportRef.current) return;
    setBusy(true);
    try {
      await saveNodeAsPng(reportRef.current, "pizhu-habit-report.png");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div className="min-w-0">
          <h2 className="text-3xl font-bold tracking-tight text-ink">{t.habits.title}</h2>
          <p className="mt-1 text-sm text-ink-3">{t.habits.intro}</p>
        </div>
        {(sessions.length > 0 || earned.length > 0) && (
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <button
              onClick={report}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-taro px-4 py-2 font-semibold text-on-taro shadow-soft transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <DownloadSimple size={16} aria-hidden />
              {busy ? t.habits.reportBusy : t.habits.report}
            </button>
            <button onClick={backup} className="rounded-full px-3 py-2 text-ink-3 hover:bg-paper-2 hover:text-ink-2">
              {t.habits.backup}
            </button>
            <button
              onClick={() => {
                if (confirm(t.habits.confirmClear)) {
                  clearHabits();
                  clearHandled();
                  setSessions([]);
                  setHandled({});
                }
              }}
              className="rounded-full px-3 py-2 text-ink-3 hover:bg-paper-2 hover:text-must"
            >
              {t.habits.clear}
            </button>
          </div>
        )}
      </div>

      {/* 集章册: the stamp book */}
      <div className="grid-paper shadow-lift rounded-[2rem] p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xl font-bold tracking-tight text-ink">{t.habits.stamps}</h3>
          <span className="rounded-full bg-taro-soft px-3 py-1 text-xs font-semibold text-taro">{t.habits.earned(earned.length, CATEGORY_IDS.length)}</span>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORY_IDS.map((id, i) => {
            const n = handled[id] ?? 0;
            const done = n >= STAMP_AT;
            const seen = n > 0 || top.some(([c]) => c === id);
            return (
              <motion.li
                key={id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-2 text-center"
                title={CATEGORIES[id].rule[L]}
              >
                <span
                  className={`relative grid h-20 w-20 place-items-center rounded-[1.4rem] transition-transform ${
                    done
                      ? "sticker bg-taro text-on-taro"
                      : seen
                        ? "border-2 border-dashed border-taro-2 bg-card text-taro"
                        : "border-2 border-dashed border-rule bg-card/60 text-ink-3/60"
                  }`}
                  style={done ? { transform: `rotate(${i % 2 ? 4 : -4}deg)` } : undefined}
                >
                  <CategoryIcon id={id} size={30} weight={done ? "fill" : "light"} />
                  {done && (
                    <span className="absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-md bg-must font-kai text-sm text-white shadow-soft">好</span>
                  )}
                </span>
                <span className="text-sm font-semibold leading-tight text-ink">{CATEGORIES[id].label.en}</span>
                <span className="-mt-1.5 text-xs text-ink-3">{CATEGORIES[id].label[zh]}</span>
                {!done && (
                  <span className="flex gap-1" aria-label={`${n} / ${STAMP_AT}`}>
                    {Array.from({ length: STAMP_AT }, (_, k) => (
                      <span key={k} className={`h-2 w-2 rounded-full ${k < n ? "bg-ink" : "bg-paper-2"}`} />
                    ))}
                  </span>
                )}
              </motion.li>
            );
          })}
        </ul>
        <p className="mt-6 text-center text-sm text-ink-3">{t.habits.stampsIntro(STAMP_AT)}</p>
      </div>

      {top.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Momo state="sleepy" size={110} />
          <p className="text-sm text-ink-3">{t.habits.empty}</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="text-lg font-bold tracking-tight text-ink">{t.habits.patterns}</h3>
              <span className="text-xs text-ink-3">{t.habits.sessions(recent)}</span>
            </div>
            <ul className="space-y-3">
              {top.map(([id, n]) => (
                <li key={id} className="grid grid-cols-[minmax(0,190px)_1fr_auto] items-center gap-3 text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2 text-ink-2">
                    <CategoryIcon id={id} size={16} className="shrink-0 text-taro" />
                    <span className="truncate">{CATEGORIES[id].label[L]}</span>
                  </span>
                  <span className="h-2.5 rounded-full">
                    <motion.span
                      className="block h-2.5 rounded-full bg-taro-2"
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${(n / max) * 100}%` }}
                      transition={{ type: "spring", stiffness: 70, damping: 18 }}
                    />
                  </span>
                  <span className="tabular-nums text-ink-3">{n}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-bold tracking-tight text-ink">{t.habits.top}</h3>
            <div className="space-y-3">
              {top.slice(0, 3).map(([id], k) => {
                const c = CATEGORIES[id];
                return (
                  <article key={id} className="rounded-[1.25rem] border border-rule bg-card p-4 text-sm">
                    <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-ink">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-paper">{k + 1}</span>
                      {c.label.en} <span className="font-normal text-ink-3">· {c.label[zh]}</span>
                    </h4>
                    <p className="text-ink-2">{c.rule[L]}</p>
                    <p className="mt-2 font-serif text-ink-3">
                      <s>{c.example.wrong}</s>
                    </p>
                    <p className="font-serif text-ink">{c.example.better}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Off-screen habit report that becomes the PNG. Fixed colours so it looks the same in dark mode. */}
      <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0">
        <div ref={reportRef} style={{ width: 540, height: 720, background: "#faf8ff", color: "#2a2233", fontFamily: "var(--font-ui), sans-serif" }} className="relative overflow-hidden p-9">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(rgba(115,83,207,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(115,83,207,.07) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl text-white [writing-mode:vertical-rl]" style={{ background: "#7353cf", fontFamily: "var(--font-kai)" }}>
                批注
              </div>
              <div>
                <div className="text-2xl font-bold">{t.habits.reportTitle}</div>
                <div className="text-sm" style={{ color: "#857c92" }}>
                  {t.habits.reportPeriod(recent)}
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {top.slice(0, 5).map(([id, n]) => (
                <div key={id} className="rounded-2xl bg-white p-3" style={{ boxShadow: "0 6px 14px -8px rgba(42,34,51,.25)" }}>
                  <div className="flex items-center justify-between text-[15px] font-semibold">
                    <span>
                      {CATEGORIES[id].label.en} <span style={{ color: "#857c92", fontWeight: 400 }}>· {CATEGORIES[id].label[zh]}</span>
                    </span>
                    <span style={{ color: "#7353cf" }}>{n}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full" style={{ background: "#eee8ff" }}>
                    <div className="h-2 rounded-full" style={{ width: `${(n / max) * 100}%`, background: "#7353cf" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2">
              {CATEGORY_IDS.map((id) => (
                <span
                  key={id}
                  className="grid h-8 w-8 place-items-center rounded-lg"
                  style={(handled[id] ?? 0) >= STAMP_AT ? { background: "#7353cf", color: "#fff" } : { border: "2px dashed #b8a4f2", color: "#b8a4f2" }}
                >
                  <CategoryIcon id={id} size={16} />
                </span>
              ))}
            </div>
            <div className="mt-2 text-sm font-semibold" style={{ color: "#7353cf" }}>
              {t.habits.reportStamps(earned.length)}
            </div>
          </div>
          <div className="absolute bottom-6 right-6">
            <Momo state="happy" size={120} />
          </div>
          <p className="absolute bottom-8 left-9 text-sm" style={{ color: "#857c92" }}>
            pizhu.onrender.com
          </p>
        </div>
      </div>
    </section>
  );
}
