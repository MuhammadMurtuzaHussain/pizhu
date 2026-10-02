"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, DownloadSimple, SkipForward, X } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import { useMomo } from "@/lib/momo";
import type { Annotation } from "@/lib/schema";
import { CATEGORIES, type CategoryId } from "@/lib/taxonomy";
import { CategoryIcon } from "./CategoryIcon";
import { saveNodeAsPng } from "@/lib/snapshot";
import { Momo } from "./Momo";

// One note at a time, full screen. Progress is a row of tapioca pearls.

const sevStyle = { must_fix: "bg-must-bg text-must", worth_fixing: "bg-worth-bg text-worth", style: "bg-style-bg text-style" } as const;

/** The sentence around a span, so the student sees it in context. */
function sentenceAround(text: string, start: number, end: number) {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const s = Math.max(before.lastIndexOf(". "), before.lastIndexOf("? "), before.lastIndexOf("! "));
  const m = after.search(/[.!?](\s|$)/);
  const from = s === -1 ? 0 : s + 2;
  const to = m === -1 ? text.length : end + m + 1;
  return { pre: text.slice(from, start), span: text.slice(start, end), post: text.slice(end, to) };
}

export function LessonMode({
  notes,
  paragraphText,
  resolved,
  onResolve,
  onDismiss,
  onClose,
}: {
  notes: Annotation[];
  paragraphText: (noteId: string) => string;
  resolved: Set<string>;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
  onClose: () => void;
}) {
  const { t, locale, explain, script } = useI18n();
  const { react } = useMomo();
  const reduce = useReducedMotion();
  // Freeze the list for the lesson so dismissing a note doesn't shift the order.
  const [list] = useState(notes);
  const [i, setI] = useState(() => Math.max(0, list.findIndex((n) => !resolved.has(n.id))));
  const [dir, setDir] = useState(1);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [mood, setMood] = useState<"reading" | "happy" | "stamp">("reading");
  const done = i >= list.length;
  const zh = locale === "en" ? script : locale;

  const go = useCallback(
    (to: number) => {
      setDir(to > i ? 1 : -1);
      setI(Math.max(0, Math.min(list.length, to)));
    },
    [i, list.length],
  );

  const gotIt = useCallback(() => {
    if (done) return;
    const n = list[i];
    if (!resolved.has(n.id)) onResolve(n.id);
    setMood("happy");
    react("happy");
    setTimeout(() => setMood("reading"), 700);
    go(i + 1);
  }, [done, list, i, resolved, onResolve, react, go]);

  const skip = useCallback(() => {
    if (done) return;
    setSkipped((s) => new Set(s).add(list[i].id));
    go(i + 1);
  }, [done, list, i, go]);

  useEffect(() => {
    if (done) setMood("stamp"); // eslint-disable-line react-hooks/set-state-in-effect
  }, [done]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "Enter") gotIt();
      else if (e.key === "ArrowRight") skip();
      else if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gotIt, skip, go, i, onClose]);

  const handledCount = list.filter((n) => resolved.has(n.id)).length;
  const topHabits = useMemo(() => {
    const c = new Map<CategoryId, number>();
    for (const n of list) c.set(n.category, (c.get(n.category) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
  }, [list]);

  const note = done ? null : list[i];
  const ctx = note ? sentenceAround(paragraphText(note.id), note.start, note.end) : null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t.lesson.start}
      className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-paper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-4 pb-8 sm:px-6">
        {/* top bar: close, pearls, counter */}
        <div className="sticky top-0 z-10 flex items-center gap-4 bg-paper/90 py-4 backdrop-blur">
          <button onClick={onClose} aria-label={t.lesson.close} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-paper-2">
            <X size={20} aria-hidden />
          </button>
          <Pearls total={list.length} current={i} isDone={(k) => resolved.has(list[k].id)} isSkipped={(k) => skipped.has(list[k].id)} />
          <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-2">{t.lesson.of(Math.min(i + 1, list.length), list.length)}</span>
        </div>

        <div className="flex flex-1 flex-col justify-center py-6">
          <AnimatePresence mode="wait" custom={dir}>
            {note && ctx ? (
              <motion.div
                key={note.id}
                custom={dir}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 * dir }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40 * dir }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              >
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="sticker inline-flex -rotate-2 items-center gap-1.5 rounded-full bg-taro-soft px-3.5 py-1 text-sm font-semibold text-taro">
                    <CategoryIcon id={note.category} size={16} />
                    {locale === "en" ? CATEGORIES[note.category].label.en : CATEGORIES[note.category].label[zh]}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sevStyle[note.severity]}`}>{t.card.severity[note.severity]}</span>
                </div>

                <div className="grid-paper shadow-soft rounded-[1.75rem] p-6 sm:p-8">
                  <p className="font-serif text-2xl leading-[1.7] text-ink sm:text-[26px]">
                    <span className="text-ink-2">{ctx.pre}</span>
                    <mark data-sev={note.severity} data-active="true" className="mark text-inherit">
                      {ctx.span}
                    </mark>
                    <span className="text-ink-2">{ctx.post}</span>
                  </p>
                </div>

                <div className="mt-5 space-y-4 px-1">
                  {explain !== "zh" && <p className="text-lg leading-relaxed text-ink">{note.explanation_en}</p>}
                  {explain !== "en" && <p className="font-kai text-xl leading-relaxed text-ink">{note.explanation_zh}</p>}
                  {note.l1_note && explain !== "en" && (
                    <div className="rounded-2xl bg-taro-soft px-4 py-3">
                      <div className="mb-0.5 text-xs font-semibold text-taro">{t.card.why}</div>
                      <p className="font-kai text-[17px] leading-relaxed text-ink">{note.l1_note}</p>
                    </div>
                  )}
                  {note.hint && (
                    <p className="text-base text-ink-2">
                      <span className="mr-2 font-semibold text-ink">{t.card.hint}</span>
                      {note.hint}
                    </p>
                  )}
                  {note.nudge && (
                    <p className="text-base">
                      <span className="mr-2 font-semibold text-ink">{t.card.nudge}</span>
                      <span className="font-serif text-ink-2">
                        <s>{note.span}</s> → <span className="text-ink">{note.nudge}</span>
                      </span>
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <Momo state="stamp" size={170} className="mx-auto" />
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">{t.lesson.doneTitle}</h2>
                <p className="mx-auto mt-2 max-w-md text-ink-2">{t.lesson.doneBody(handledCount, list.length)}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {topHabits.map((id, k) => (
                    <span
                      key={id}
                      className={`sticker inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-sm font-medium text-ink ${k % 2 ? "rotate-2" : "-rotate-2"}`}
                    >
                      <CategoryIcon id={id} size={15} className="text-taro" />
                      {locale === "en" ? CATEGORIES[id].label.en : CATEGORIES[id].label[zh]}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <ShareButton handled={handledCount} habits={topHabits} />
                  <button onClick={onClose} className="rounded-full border-2 border-taro-2 px-5 py-3 font-semibold text-taro hover:bg-taro-soft">
                    {t.lesson.backToDraft}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {note && (
          <div className="sticky bottom-0 flex items-center gap-3 bg-paper/90 pb-2 pt-3 backdrop-blur">
            <div className="hidden sm:block">
              <Momo state={mood} size={64} />
            </div>
            <button onClick={() => go(i - 1)} disabled={i === 0} aria-label={t.lesson.back} className="grid h-12 w-12 place-items-center rounded-full border border-rule text-ink-2 disabled:opacity-30">
              <ArrowLeft size={18} aria-hidden />
            </button>
            <button
              onClick={() => {
                onDismiss(note.id);
                go(i + 1);
              }}
              className="hidden rounded-full px-4 py-3 text-sm text-ink-3 hover:bg-paper-2 sm:block"
            >
              {t.card.notError}
            </button>
            <span className="hidden flex-1 text-center text-xs text-ink-3 lg:block">{t.lesson.keys}</span>
            <div className="ml-auto flex gap-2">
              <button onClick={skip} className="inline-flex items-center gap-1.5 rounded-full border-2 border-rule px-5 py-3 font-semibold text-ink-2 active:scale-[0.98]">
                <SkipForward size={16} aria-hidden />
                {t.lesson.skip}
              </button>
              <button
                onClick={gotIt}
                className="inline-flex items-center gap-2 rounded-full bg-taro px-7 py-3 font-semibold text-on-taro shadow-lift transition-transform active:scale-[0.97]"
              >
                <Check size={18} weight="bold" aria-hidden />
                {t.lesson.gotIt}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Progress as tapioca pearls: filled when handled, ringed when current. */
function Pearls({ total, current, isDone, isSkipped }: { total: number; current: number; isDone: (i: number) => boolean; isSkipped: (i: number) => boolean }) {
  if (total > 24) {
    return (
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-paper-2">
        <motion.div className="h-full rounded-full bg-taro" animate={{ width: `${(current / total) * 100}%` }} />
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-wrap items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, k) => (
        <motion.span
          key={k}
          layout
          className={`block rounded-full ${
            isDone(k) ? "bg-ink" : isSkipped(k) ? "bg-taro-2" : "bg-paper-2"
          } ${k === current ? "h-4 w-4 ring-2 ring-taro ring-offset-2 ring-offset-paper" : "h-3 w-3"}`}
          animate={isDone(k) ? { scale: [1.4, 1] } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        />
      ))}
    </div>
  );
}

/** A 3:4 progress card for 小红书 / Instagram. No essay text, just habits and a count. */
function ShareButton({ handled, habits }: { handled: number; habits: CategoryId[] }) {
  const { t, locale, script } = useI18n();
  const node = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const zh = locale === "en" ? script : locale;

  const make = async () => {
    if (!node.current) return;
    setBusy(true);
    try {
      await saveNodeAsPng(node.current, "pizhu-progress.png");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={make} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-taro px-6 py-3 font-semibold text-on-taro shadow-lift active:scale-[0.98] disabled:opacity-60">
        <DownloadSimple size={18} aria-hidden />
        {busy ? t.lesson.sharing : t.lesson.share}
      </button>
      {/* Off-screen card that becomes the image. Fixed colours so it looks the same in dark mode. */}
      <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0">
        <div ref={node} style={{ width: 540, height: 720, background: "#eee8ff", color: "#2a2233", fontFamily: "var(--font-ui), sans-serif" }} className="relative overflow-hidden p-10">
          {/* A few tapioca pearls tucked into the bottom corners, behind the content. */}
          {[
            [18, 640, 22], [46, 668, 16], [14, 686, 12],
            [500, 632, 20], [474, 662, 14], [506, 684, 11],
          ].map(([left, top, size], k) => (
            <span key={k} className="absolute rounded-full" style={{ left, top, width: size, height: size, background: "#2a2233", opacity: 0.1 }} />
          ))}
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl text-white [writing-mode:vertical-rl]" style={{ background: "#7353cf", fontFamily: "var(--font-kai)" }}>
              批注
            </div>
            <div className="text-xl font-semibold">Pīzhù</div>
          </div>
          <div className="mt-6 flex justify-center">
            <Momo state="stamp" size={190} />
          </div>
          <p className="mt-4 text-center text-[30px] font-bold leading-tight" style={{ fontFamily: locale === "en" ? undefined : "var(--font-kai)" }}>
            {t.lesson.cardTitle(handled)}
          </p>
          <p className="mt-6 text-center text-sm font-semibold" style={{ color: "#7353cf" }}>
            {t.lesson.cardHabits}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {habits.map((id, k) => (
              <span key={id} className="rounded-full bg-white px-4 py-2 text-base font-medium" style={{ transform: `rotate(${k % 2 ? 2 : -2}deg)`, border: "3px solid #fff", boxShadow: "0 6px 14px -6px rgba(42,34,51,.3)" }}>
                {CATEGORIES[id].label.en} · {CATEGORIES[id].label[zh]}
              </span>
            ))}
          </div>
          <p className="absolute bottom-8 left-0 right-0 text-center text-sm" style={{ color: "#857c92" }}>
            pizhu.onrender.com · margin notes, not rewrites
          </p>
        </div>
      </div>
    </>
  );
}
