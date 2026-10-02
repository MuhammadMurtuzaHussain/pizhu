"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle, Cloud, FileDoc, Keyboard, Lock, PencilSimple, PlayCircle, Smiley, Sparkle, UploadSimple } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import { useMomo } from "@/lib/momo";
import type { Annotation, EssayContext } from "@/lib/schema";
import { SAMPLE_ESSAY } from "@/lib/sample";
import { wordCount } from "@/lib/paragraphs";
import { CATEGORIES, type CategoryId } from "@/lib/taxonomy";
import { recordHandled } from "@/lib/habits";
import { buildDocx, downloadBlob } from "@/lib/exportDocx";
import type { useAnalysis, ParaState } from "@/lib/useAnalysis";
import { AnnotatedText } from "./AnnotatedText";
import { NoteSheet } from "./NoteSheet";
import { Confetti } from "./Celebrate";
import { ContextSentence } from "./ContextSentence";
import { ReadingPanel } from "./ReadingPanel";
import { CategoryIcon } from "./CategoryIcon";
import { DemoHero } from "./DemoHero";
import { MarginPaper } from "./MarginPaper";
import { LessonMode } from "./LessonMode";
import { Momo } from "./Momo";
import { MarkersEye } from "./MarkersEye";

type Analysis = ReturnType<typeof useAnalysis>;
type Status = { mode: "local" | "hosted"; model: string; ready: boolean; maxWords: number | null } | null;

function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 1024px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

export function WriteView({
  text,
  setText,
  context,
  setContext,
  analysis,
  status,
  onLessonChange,
}: {
  text: string;
  setText: (s: string) => void;
  context: Omit<EssayContext, "script">;
  setContext: (c: Omit<EssayContext, "script">) => void;
  analysis: Analysis;
  status: Status;
  onLessonChange: (open: boolean) => void;
}) {
  const { script } = useI18n();
  const { run, analyze, recheck, reset } = analysis;
  const fullCtx: EssayContext = { ...context, script };

  if (run.status === "idle") {
    return <Composer text={text} setText={setText} context={context} setContext={setContext} status={status} onCheck={() => analyze(text, fullCtx)} />;
  }
  return (
    <Results
      run={run}
      maxWords={status?.maxWords ?? null}
      onBack={reset}
      onRecheck={(id, txt) => recheck(id, txt, fullCtx)}
      onRetry={() => analyze(text, fullCtx)}
      onLessonChange={onLessonChange}
    />
  );
}

/* Composer: the live demo hero, then the editor. */

function Composer({
  text,
  setText,
  context,
  setContext,
  status,
  onCheck,
}: {
  text: string;
  setText: (s: string) => void;
  context: Omit<EssayContext, "script">;
  setContext: (c: Omit<EssayContext, "script">) => void;
  status: Status;
  onCheck: () => void;
}) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const section = useRef<HTMLElement>(null);
  const [dragging, setDragging] = useState(false);

  const onUpload = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".docx")) return;
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
    setText(value.replace(/\n{3,}/g, "\n\n").trim());
  };

  const toEditor = (sample = false) => {
    if (sample) setText(SAMPLE_ESSAY);
    section.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => area.current?.focus({ preventScroll: true }), 450);
  };

  const chips = [
    status?.mode === "hosted" ? { icon: Cloud, label: t.hero.chips.hosted } : { icon: Lock, label: t.hero.chips.local },
    { icon: Smiley, label: t.hero.chips.noGrades },
    { icon: PencilSimple, label: t.hero.chips.yours },
  ];

  return (
    <div>
      <DemoHero onStart={() => toEditor()} onSample={() => toEditor(true)} />

      <section ref={section} id="composer" className="scroll-mt-6 pt-20">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-3xl font-bold tracking-tight text-ink">{t.demo.yourTurn}</h2>
          <ul className="flex flex-wrap gap-2">
            {chips.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-taro-soft px-3 py-1.5 text-xs font-medium text-taro">
                <Icon size={14} weight="bold" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {status && !status.ready && (
          <div role="alert" className="mb-5 flex items-center gap-4 rounded-[1.5rem] bg-worth-bg p-4 text-sm text-ink">
            <Momo state="thinking" size={56} className="shrink-0" />
            <p>{t.errors.notReady(status.model)}</p>
          </div>
        )}
        <div className="grid-paper shadow-lift rounded-[2rem] p-5 sm:p-8">
          <ContextSentence value={context} onChange={setContext} />
          <div
            className="relative mt-5"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onUpload(f);
            }}
          >
            <label htmlFor="draft" className="sr-only">
              {t.editor.label}
            </label>
            <textarea
              ref={area}
              id="draft"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.editor.placeholder}
              rows={12}
              className="block w-full resize-y rounded-2xl border-2 border-dashed border-taro-2/70 bg-card/80 p-5 font-serif text-[18px] leading-relaxed text-ink transition-colors placeholder:text-ink-3 focus:border-solid focus:border-taro"
            />
            {dragging && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl border-2 border-dashed border-taro bg-taro-soft/90 text-base font-semibold text-taro">
                {t.editor.drop}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              disabled={!text.trim()}
              onClick={onCheck}
              className="group inline-flex items-center gap-3 rounded-full bg-taro py-2.5 pl-6 pr-2.5 text-base font-semibold text-on-taro shadow-lift transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
            >
              {t.editor.check}
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight size={17} weight="bold" aria-hidden />
              </span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-rule bg-card px-4 py-2.5 text-sm font-medium text-ink-2 transition-transform hover:border-taro-2 active:scale-[0.98]"
            >
              <UploadSimple size={16} aria-hidden />
              {t.editor.upload}
            </button>
            <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            <button
              onClick={() => setText(SAMPLE_ESSAY)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium text-taro transition-transform hover:bg-taro-soft active:scale-[0.98]"
            >
              <Sparkle size={16} aria-hidden />
              {t.editor.sample}
            </button>
            {text.trim() && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-ink-3">
                <CheckCircle size={14} weight="fill" className="text-ok" aria-hidden />
                {t.extra.saved}
              </span>
            )}
            <span className={`${text.trim() ? "" : "ml-auto"} text-xs tabular-nums text-ink-3`}>
              {wordCount(text)}
              {status?.maxWords ? ` / ${status.maxWords}` : ""} {t.editor.words}
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">{status?.mode === "hosted" ? t.editor.privacyHosted : t.editor.privacyLocal}</p>
        </div>
      </section>
    </div>
  );
}

/* Results */

function Results({
  run,
  maxWords,
  onBack,
  onRecheck,
  onRetry,
  onLessonChange,
}: {
  run: Analysis["run"];
  maxWords: number | null;
  onBack: () => void;
  onRecheck: (id: string, text: string) => void;
  onRetry: () => void;
  onLessonChange: (open: boolean) => void;
}) {
  const { t, locale, script, explain } = useI18n();
  const momo = useMomo();
  const isDesktop = useIsDesktop();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mustOnly, setMustOnly] = useState(false);
  const [catFilter, setCatFilter] = useState<CategoryId | null>(null);
  const [lesson, setLesson] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [confetti, setConfetti] = useState(0);

  const analysable = run.paragraphs.filter((p) => p.status !== "skipped");
  const done = analysable.filter((p) => p.status === "done" || p.status === "error").length;
  const all = useMemo(() => run.paragraphs.flatMap((p) => p.annotations), [run.paragraphs]);
  const live = useMemo(() => all.filter((a) => !dismissed.has(a.id)), [all, dismissed]);
  const shown = useCallback(
    (a: Annotation) => !dismissed.has(a.id) && (!mustOnly || a.severity === "must_fix") && (!catFilter || a.category === catFilter),
    [dismissed, mustOnly, catFilter],
  );
  const visible = useMemo(() => all.filter(shown), [all, shown]);
  const top = useMemo(() => {
    const c = new Map<CategoryId, number>();
    for (const a of live) c.set(a.category, (c.get(a.category) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [live]);
  const handled = live.filter((a) => resolved.has(a.id)).length;

  const openLesson = useCallback(() => {
    setLesson(true);
    onLessonChange(true);
  }, [onLessonChange]);
  const closeLesson = () => {
    setLesson(false);
    onLessonChange(false);
  };

  // Mòmo narrates the run from the dock.
  const { say, setMood, react } = momo;
  useEffect(() => {
    if (run.status === "running") say(t.dock.reading(Math.min(done + 1, analysable.length || 1), analysable.length || 1), "reading");
  }, [run.status, done, analysable.length, say, t.dock]);
  useEffect(() => {
    if (run.status !== "done") return;
    if (all.length === 0) say(t.dock.doneNone, "happy", 8000);
    else say({ text: t.dock.done(all.length), action: { label: t.dock.lessonCta, onClick: openLesson } }, "idle", 15000);
    setMood(all.length === 0 ? "happy" : "idle");
  }, [run.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (run.status === "error") say(run.error === "rate_limited" ? t.errors.rateLimited : t.errors.generic, "thinking", 8000);
  }, [run.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Celebrate once, when every must-fix note is handled or dismissed.
  const mustTotal = all.filter((a) => a.severity === "must_fix").length;
  const mustOpen = live.filter((a) => a.severity === "must_fix" && !resolved.has(a.id)).length;
  if (run.status === "done" && mustTotal > 0 && mustOpen === 0 && !celebrated) {
    setCelebrated(true);
    setConfetti((c) => c + 1);
  }
  useEffect(() => {
    if (!confetti) return;
    react("stamp", 2600);
    say(`${t.celebrate.title} ${t.celebrate.body}`, undefined, 7000);
  }, [confetti]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = (id: string) => {
    const wasResolved = resolved.has(id);
    setResolved((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    if (!wasResolved) {
      const cat = all.find((a) => a.id === id)?.category;
      if (cat) recordHandled(cat);
      react("happy", 900);
      const count = resolved.size + 1;
      if (count % 3 === 0) say(t.dock.cheers[count % t.dock.cheers.length], undefined, 2200);
    }
  };
  const undismiss = (id: string) =>
    setDismissed((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  const dismiss = (id: string) => {
    if (dismissed.has(id)) return undismiss(id);
    setDismissed((s) => new Set(s).add(id));
    say({ text: t.extra.hidden, action: { label: t.extra.undo, onClick: () => undismiss(id) } }, undefined, 6000);
  };

  const activate = useCallback(
    (id: string, from: "mark" | "card" | "key" = "mark") => {
      setActiveId(id);
      if (!isDesktop) {
        setSheetId(id);
        return;
      }
      if (from === "key") document.querySelector(`[data-mark="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    },
    [isDesktop],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!visible.length) return;
      const i = visible.findIndex((a) => a.id === (sheetId ?? activeId));
      activate(visible[(i + dir + visible.length) % visible.length].id, "key");
    },
    [visible, activeId, sheetId, activate],
  );

  useEffect(() => {
    if (lesson) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j") step(1);
      else if (e.key === "k") step(-1);
      else if (e.key === "Escape") {
        setSheetId(null);
        setActiveId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, lesson]);

  const sheetNote = sheetId ? visible.find((a) => a.id === sheetId) ?? null : null;
  const zh = locale === "en" ? script : locale;
  const paraOf = (noteId: string) => run.paragraphs.find((p) => p.annotations.some((a) => a.id === noteId))?.text ?? "";

  return (
    <section>
      <div className="sticky top-0 z-20 -mx-4 mb-8 bg-paper/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-rule bg-card px-3.5 py-1.5 text-sm font-medium text-ink-2 transition-transform hover:border-taro-2 active:scale-[0.98]"
          >
            <ArrowLeft size={15} aria-hidden />
            {t.editor.edit}
          </button>

          {live.length > 0 && <ProgressRing value={handled} total={live.length} label={t.results.handled(handled, live.length)} />}

          {run.status === "done" && visible.length > 0 && (
            <button
              onClick={openLesson}
              className="inline-flex items-center gap-1.5 rounded-full bg-taro px-4 py-1.5 text-sm font-semibold text-on-taro shadow-soft transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <PlayCircle size={17} weight="fill" aria-hidden />
              {t.lesson.start}
            </button>
          )}

          {run.status === "done" && all.length > 0 && (
            <button
              onClick={async () => {
                const blob = await buildDocx(run.paragraphs, {
                  explain,
                  zh: locale === "en" ? script : locale,
                  hidden: dismissed,
                  labels: { title: t.extra.docxTitle, intro: t.extra.docxIntro, severity: t.card.severity, why: t.card.why, hint: t.card.hint, nudge: t.card.nudge },
                });
                downloadBlob(blob, "pizhu-margin-notes.docx");
              }}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-rule bg-card px-3.5 py-1.5 text-sm font-medium text-ink-2 transition-transform hover:border-taro-2 hover:text-taro active:scale-[0.98]"
            >
              <FileDoc size={16} aria-hidden />
              {t.extra.docx}
            </button>
          )}

          {top.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 text-xs text-ink-3">{t.results.topHabits}</span>
              {top.map(([id, n]) => (
                <button
                  key={id}
                  onClick={() => setCatFilter((c) => (c === id ? null : id))}
                  aria-pressed={catFilter === id}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    catFilter === id ? "bg-ink text-paper" : "bg-taro-soft text-taro hover:bg-taro-2/30"
                  }`}
                >
                  <CategoryIcon id={id} size={13} />
                  {locale === "en" ? CATEGORIES[id].label.en : CATEGORIES[id].label[zh]}
                  <span className="tabular-nums opacity-60">{n}</span>
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-ink-3 xl:inline-flex">
              <Keyboard size={15} aria-hidden />
              {t.results.keys}
            </span>
            <div className="flex rounded-full bg-paper-2 p-0.5 text-xs font-medium">
              {[false, true].map((m) => (
                <button
                  key={String(m)}
                  onClick={() => setMustOnly(m)}
                  aria-pressed={mustOnly === m}
                  className={`rounded-full px-3 py-1 transition-colors ${mustOnly === m ? "bg-card text-ink shadow-soft" : "text-ink-3 hover:text-ink-2"}`}
                >
                  {m ? t.results.filterMust : t.results.filterAll}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {run.status === "running" && (
        <div className="mb-8 max-w-2xl">
          <ReadingPanel done={done} total={analysable.length} />
        </div>
      )}

      {run.error && (
        <div role="alert" className="mb-8 flex max-w-2xl items-center gap-4 rounded-[1.5rem] bg-must-bg p-4">
          <Momo state="thinking" size={64} className="shrink-0" />
          <div>
            <p className="text-sm text-ink">{run.error === "rate_limited" ? t.errors.rateLimited : t.errors.generic}</p>
            <button onClick={onRetry} className="mt-2 rounded-full bg-taro px-4 py-1.5 text-xs font-semibold text-on-taro active:scale-[0.98]">
              {t.errors.retry}
            </button>
          </div>
        </div>
      )}

      {isDesktop ? (
        <MarginPaper
          paragraphs={run.paragraphs}
          shown={shown}
          activeId={activeId}
          resolved={resolved}
          onActivate={activate}
          onResolve={resolve}
          onDismiss={dismiss}
          onRecheck={onRecheck}
        />
      ) : (
        <div className="grid-paper shadow-lift space-y-8 rounded-[1.75rem] p-5">
          {run.paragraphs.map((p) => (
            <MobileParagraph key={p.id} p={p} notes={p.annotations.filter(shown)} activeId={activeId} resolved={resolved} onActivate={activate} />
          ))}
        </div>
      )}

      {run.truncated && <p className="mt-8 text-sm text-ink-3">{t.results.truncated(maxWords ?? 0)}</p>}
      {run.status === "done" && run.stats.nudgesProposed > 0 && (
        <p className="mt-10 text-xs text-ink-3">
          {t.results.guardNote(run.stats.nudgesProposed, run.stats.nudgesStripped)} · {run.model}
        </p>
      )}

      <NoteSheet
        note={sheetNote}
        index={sheetNote ? visible.indexOf(sheetNote) : 0}
        total={visible.length}
        resolved={sheetNote ? resolved.has(sheetNote.id) : false}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onClose={() => setSheetId(null)}
        onResolve={() => sheetNote && resolve(sheetNote.id)}
        onDismiss={() => {
          if (!sheetNote) return;
          dismiss(sheetNote.id);
          setSheetId(null);
        }}
      />

      <AnimatePresence>
        {lesson && <LessonMode notes={visible} paragraphText={paraOf} resolved={resolved} onResolve={resolve} onDismiss={dismiss} onClose={closeLesson} />}
      </AnimatePresence>
      <Confetti fire={confetti} />
    </section>
  );
}

function ProgressRing({ value, total, label }: { value: number; total: number; label: string }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-2" title={label}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="-rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--rule)" strokeWidth="3.5" />
        <motion.circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="var(--taro)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c - (total ? value / total : 0) * c }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </svg>
      <span className="tabular-nums">{label}</span>
    </span>
  );
}

function MobileParagraph({
  p,
  notes,
  activeId,
  resolved,
  onActivate,
}: {
  p: ParaState;
  notes: Annotation[];
  activeId: string | null;
  resolved: Set<string>;
  onActivate: (id: string, from?: "mark" | "card" | "key") => void;
}) {
  const { t } = useI18n();
  if (p.status === "skipped") return <h3 className="text-xl font-semibold tracking-tight text-ink">{p.text}</h3>;
  return (
    <div>
      <p className={`font-serif text-[18px] leading-[1.85] text-ink ${p.status === "pending" ? "reading" : ""}`}>
        <AnnotatedText text={p.text} annotations={notes} activeId={activeId} resolved={resolved} onActivate={(id) => onActivate(id, "mark")} />
      </p>
      <div className="mt-2 flex items-center gap-3">
        {p.status === "done" && notes.length > 0 && (
          <button onClick={() => onActivate(notes[0].id)} className="rounded-full bg-taro px-3.5 py-1.5 text-xs font-semibold text-on-taro">
            {t.results.showNotes(notes.length)}
          </button>
        )}
        {p.status === "done" && p.annotations.length === 0 && (
          <span className="inline-flex items-center gap-2 text-sm text-ok">
            <Momo state="happy" size={30} />
            {t.results.noIssues}
          </span>
        )}
        {p.status === "error" && <span className="text-sm text-must">{t.results.failed}</span>}
      </div>
      {p.status === "done" && p.summary && <MarkersEye summary={p.summary} />}
    </div>
  );
}
