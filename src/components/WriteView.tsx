"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Cloud, Keyboard, Lock, PencilSimple, Smiley, Sparkle, UploadSimple } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import type { Annotation, EssayContext } from "@/lib/schema";
import { SAMPLE_ESSAY } from "@/lib/sample";
import { wordCount } from "@/lib/paragraphs";
import { CATEGORIES, type CategoryId } from "@/lib/taxonomy";
import type { useAnalysis, ParaState } from "@/lib/useAnalysis";
import { AnnotatedText } from "./AnnotatedText";
import { NoteCard } from "./NoteCard";
import { NoteSheet } from "./NoteSheet";
import { Celebrate } from "./Celebrate";
import { ContextSentence } from "./ContextSentence";
import { ReadingPanel } from "./ReadingPanel";
import { CategoryIcon } from "./CategoryIcon";
import { Momo } from "./Momo";

type Analysis = ReturnType<typeof useAnalysis>;
type Status = { mode: "local" | "hosted"; maxWords: number | null } | null;

const ease = [0.16, 1, 0.3, 1] as const;

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
}: {
  text: string;
  setText: (s: string) => void;
  context: Omit<EssayContext, "script">;
  setContext: (c: Omit<EssayContext, "script">) => void;
  analysis: Analysis;
  status: Status;
}) {
  const { script } = useI18n();
  const { run, analyze, recheck, reset } = analysis;
  const fullCtx: EssayContext = { ...context, script };

  if (run.status === "idle") {
    return <Composer text={text} setText={setText} context={context} setContext={setContext} status={status} onCheck={() => analyze(text, fullCtx)} />;
  }
  return <Results run={run} maxWords={status?.maxWords ?? null} onBack={reset} onRecheck={(id, txt) => recheck(id, txt, fullCtx)} />;
}

/* Composer: hero with Mòmo on the left, the editor on the right. */

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
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onUpload = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".docx")) return;
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
    setText(value.replace(/\n{3,}/g, "\n\n").trim());
  };

  const enter = (i: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: i * 0.08, ease } };

  const chips = [
    status?.mode === "hosted" ? { icon: Cloud, label: t.hero.chips.hosted } : { icon: Lock, label: t.hero.chips.local },
    { icon: Smiley, label: t.hero.chips.noGrades },
    { icon: PencilSimple, label: t.hero.chips.yours },
  ];

  return (
    <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:pt-6">
      <div className="lg:sticky lg:top-8">
        <motion.div {...enter(0)} className="mb-6 flex items-end gap-3">
          <Momo state="idle" size={128} />
          <div className="relative mb-10 max-w-[15rem] rounded-2xl rounded-bl-sm border border-rule bg-card px-4 py-3 text-sm leading-snug text-ink-2 shadow-soft">
            <span className={locale === "en" ? "" : "font-kai text-[15px]"}>{t.hero.momo}</span>
          </div>
        </motion.div>
        <motion.h2 {...enter(1)} className="text-4xl font-semibold leading-[1.08] tracking-tight text-ink md:text-5xl">
          {t.hero.title}
        </motion.h2>
        <motion.p {...enter(2)} className="mt-4 max-w-[44ch] text-base leading-relaxed text-ink-2">
          {t.hero.sub}
        </motion.p>
        <motion.ul {...enter(3)} className="mt-6 flex flex-wrap gap-2">
          {chips.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-card px-3 py-1.5 text-xs text-ink-2">
              <Icon size={14} weight="light" className="text-vermilion" aria-hidden />
              {label}
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.div {...enter(2)} className="bezel">
        <div className="bezel-core p-5 sm:p-6">
          <ContextSentence value={context} onChange={setContext} />

          <div
            className="relative mt-4"
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
              id="draft"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.editor.placeholder}
              rows={11}
              className="block w-full resize-y rounded-2xl border border-transparent bg-paper/70 p-5 font-serif text-[17px] leading-relaxed text-ink transition-colors placeholder:text-ink-3 focus:border-rule focus:bg-card"
            />
            {dragging && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl border-2 border-dashed border-vermilion bg-vermilion-soft/80 text-sm font-medium text-vermilion">
                {t.editor.drop}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              disabled={!text.trim()}
              onClick={onCheck}
              className="group inline-flex items-center gap-3 rounded-full bg-vermilion py-2 pl-5 pr-2 text-sm font-medium text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
            >
              {t.editor.check}
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                <ArrowRight size={16} weight="bold" aria-hidden />
              </span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-2.5 text-sm text-ink-2 transition-transform hover:bg-paper-2 active:scale-[0.98]"
            >
              <UploadSimple size={16} weight="light" aria-hidden />
              {t.editor.upload}
            </button>
            <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            <button
              onClick={() => setText(SAMPLE_ESSAY)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm text-ink-2 transition-transform hover:bg-paper-2 active:scale-[0.98]"
            >
              <Sparkle size={16} weight="light" aria-hidden />
              {t.editor.sample}
            </button>
            <span className="ml-auto text-xs tabular-nums text-ink-3">
              {wordCount(text)}
              {status?.maxWords ? ` / ${status.maxWords}` : ""} {t.editor.words}
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">{status?.mode === "hosted" ? t.editor.privacyHosted : t.editor.privacyLocal}</p>
        </div>
      </motion.div>
    </section>
  );
}

/* Results: summary bar, reading state, annotated paragraphs, mobile sheet, celebration. */

function Results({
  run,
  maxWords,
  onBack,
  onRecheck,
}: {
  run: Analysis["run"];
  maxWords: number | null;
  onBack: () => void;
  onRecheck: (id: string, text: string) => void;
}) {
  const { t, locale, script } = useI18n();
  const isDesktop = useIsDesktop();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mustOnly, setMustOnly] = useState(false);
  const [catFilter, setCatFilter] = useState<CategoryId | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const analysable = run.paragraphs.filter((p) => p.status !== "skipped");
  const done = analysable.filter((p) => p.status === "done" || p.status === "error").length;
  const live = useMemo(() => run.paragraphs.flatMap((p) => p.annotations).filter((a) => !dismissed.has(a.id)), [run.paragraphs, dismissed]);
  const shown = useCallback(
    (a: Annotation) => !dismissed.has(a.id) && (!mustOnly || a.severity === "must_fix") && (!catFilter || a.category === catFilter),
    [dismissed, mustOnly, catFilter],
  );
  const visible = useMemo(() => run.paragraphs.flatMap((p) => p.annotations.filter(shown)), [run.paragraphs, shown]);

  const top = useMemo(() => {
    const c = new Map<CategoryId, number>();
    for (const a of live) c.set(a.category, (c.get(a.category) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [live]);
  const handled = live.filter((a) => resolved.has(a.id)).length;

  // Celebrate once, when every must-fix note is handled or dismissed.
  const mustTotal = run.paragraphs.flatMap((p) => p.annotations).filter((a) => a.severity === "must_fix").length;
  const mustOpen = live.filter((a) => a.severity === "must_fix" && !resolved.has(a.id)).length;
  const shouldCelebrate = run.status === "done" && mustTotal > 0 && mustOpen === 0 && !celebrated;
  if (shouldCelebrate) {
    // Derived trigger during render (React's recommended alternative to an effect for this).
    setCelebrated(true);
    setCelebrate(true);
  }

  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  const activate = useCallback(
    (id: string, from: "mark" | "card" | "key" = "mark") => {
      setActiveId(id);
      if (!isDesktop) {
        setSheetId(id);
        return;
      }
      if (from !== "card") document.getElementById(`card-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      if (from === "key") document.querySelector(`[data-mark="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    },
    [isDesktop],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!visible.length) return;
      const i = visible.findIndex((a) => a.id === (sheetId ?? activeId));
      const next = visible[(i + dir + visible.length) % visible.length];
      activate(next.id, "key");
    },
    [visible, activeId, sheetId, activate],
  );

  // J / K between notes, Esc to close. Ignored while typing.
  useEffect(() => {
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
  }, [step]);

  const sheetNote = sheetId ? visible.find((a) => a.id === sheetId) ?? null : null;
  const zh = locale === "en" ? script : locale;

  return (
    <section>
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-rule bg-paper/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-card px-3.5 py-1.5 text-sm text-ink-2 transition-transform hover:bg-paper-2 active:scale-[0.98]"
          >
            <ArrowLeft size={15} aria-hidden />
            {t.editor.edit}
          </button>

          {live.length > 0 && <ProgressRing value={handled} total={live.length} label={t.results.handled(handled, live.length)} />}

          {top.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-ink-3">{t.results.topHabits}</span>
              {top.map(([id, n]) => (
                <button
                  key={id}
                  onClick={() => setCatFilter((c) => (c === id ? null : id))}
                  aria-pressed={catFilter === id}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    catFilter === id ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink-3/40"
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
              <Keyboard size={15} weight="light" aria-hidden />
              {t.results.keys}
            </span>
            <div className="flex rounded-full border border-rule bg-card p-0.5 text-xs">
              {[false, true].map((m) => (
                <button
                  key={String(m)}
                  onClick={() => setMustOnly(m)}
                  aria-pressed={mustOnly === m}
                  className={`rounded-full px-3 py-1 transition-colors ${mustOnly === m ? "bg-ink text-paper" : "text-ink-3 hover:text-ink-2"}`}
                >
                  {m ? t.results.filterMust : t.results.filterAll}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {run.status === "running" && (
        <div className="mb-10 max-w-2xl">
          <ReadingPanel done={done} total={analysable.length} />
        </div>
      )}

      {run.error && <p className="mb-4 rounded-xl bg-must-bg px-4 py-3 text-sm text-must">{run.error}</p>}

      <div className="space-y-12">
        {run.paragraphs.map((p, i) => (
          <ParagraphRow
            key={p.id}
            index={i}
            p={p}
            notes={p.annotations.filter(shown)}
            hasAny={p.annotations.some((a) => !dismissed.has(a.id))}
            isDesktop={isDesktop}
            activeId={activeId}
            resolved={resolved}
            onActivate={activate}
            onResolve={(id) => setResolved((s) => toggle(s, id))}
            onDismiss={(id) => setDismissed((s) => toggle(s, id))}
            onRecheck={(txt) => onRecheck(p.id, txt)}
          />
        ))}
      </div>

      {run.truncated && <p className="mt-8 text-sm text-ink-3">{t.results.truncated(maxWords ?? 0)}</p>}
      {run.status === "done" && run.stats.nudgesProposed > 0 && (
        <p className="mt-12 border-t border-rule pt-4 text-xs text-ink-3">
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
        onResolve={() => sheetNote && setResolved((s) => toggle(s, sheetNote.id))}
        onDismiss={() => {
          if (!sheetNote) return;
          setDismissed((s) => toggle(s, sheetNote.id));
          setSheetId(null);
        }}
      />
      <Celebrate show={celebrate} onDone={() => setCelebrate(false)} />
    </section>
  );
}

function ProgressRing({ value, total, label }: { value: number; total: number; label: string }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-ink-2" title={label}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="-rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--rule)" strokeWidth="3" />
        <motion.circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="var(--vermilion)"
          strokeWidth="3"
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

function ParagraphRow({
  index,
  p,
  notes,
  hasAny,
  isDesktop,
  activeId,
  resolved,
  onActivate,
  onResolve,
  onDismiss,
  onRecheck,
}: {
  index: number;
  p: ParaState;
  notes: Annotation[];
  /** Any note at all, before filters: "nothing to flag" must not appear just because a filter hides notes. */
  hasAny: boolean;
  isDesktop: boolean;
  activeId: string | null;
  resolved: Set<string>;
  onActivate: (id: string, from?: "mark" | "card" | "key") => void;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
  onRecheck: (text: string) => void;
}) {
  const { t, explain } = useI18n();
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.text);

  if (p.status === "skipped") {
    return <h3 className="text-xl font-semibold tracking-tight text-ink">{p.text}</h3>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-8">
      <div className="self-start lg:sticky lg:top-24">
        <div className="mb-1.5 flex items-center gap-2 text-xs text-ink-3">
          <span>¶ {index + 1}</span>
          {p.status === "done" && notes.length > 0 && <span>· {t.results.notesIn(notes.length)}</span>}
        </div>
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.max(5, Math.ceil(draft.length / 80))}
              className="w-full rounded-2xl border border-ink-3/40 bg-card p-4 font-serif text-[18px] leading-[1.85]"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  onRecheck(draft);
                }}
                className="rounded-full bg-vermilion px-4 py-2 text-xs font-medium text-white active:scale-[0.98]"
              >
                {t.results.recheck}
              </button>
              <button onClick={() => (setEditing(false), setDraft(p.text))} className="rounded-full border border-rule px-4 py-2 text-xs text-ink-2">
                {t.results.cancel}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={`font-serif text-[18px] leading-[1.85] text-ink ${p.status === "pending" ? "reading" : ""}`}>
              <AnnotatedText text={p.text} annotations={notes} activeId={activeId} resolved={resolved} onActivate={(id) => onActivate(id, "mark")} />
            </p>
            {p.status !== "pending" && (
              <div className="mt-2 flex flex-wrap gap-3">
                {!isDesktop && notes.length > 0 && (
                  <button onClick={() => onActivate(notes[0].id)} className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-paper">
                    {t.results.showNotes(notes.length)}
                  </button>
                )}
                <button
                  onClick={() => (setDraft(p.text), setEditing(true))}
                  className="inline-flex items-center gap-1 text-xs text-ink-3 underline-offset-4 hover:text-ink-2 hover:underline"
                >
                  <PencilSimple size={13} aria-hidden />
                  {t.results.editParagraph}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <aside className="space-y-3">
        {p.status === "error" && (
          <div className="flex items-center gap-3 rounded-[1.25rem] bg-must-bg px-4 py-3 text-sm text-must">
            <Momo state="thinking" size={44} />
            {t.results.failed}
          </div>
        )}
        {p.status === "done" && p.summary && (isDesktop || !hasAny) && (
          <div className="rounded-[1.25rem] border border-dashed border-rule px-4 py-3 text-sm">
            <div className="mb-1 flex items-center gap-2 text-xs text-ink-3">
              <span className="font-medium text-ink-2">{t.results.markersEye}</span>
              <span>· {t.results.dimensions[p.summary.dimension]}</span>
            </div>
            <p className="text-ink">
              <span className="text-ok">✓ </span>
              {explain === "zh" ? <span className="font-kai text-[15px]">{p.summary.strength_zh}</span> : p.summary.strength_en}
            </p>
            <p className="mt-1 text-ink">
              <span className="text-vermilion">→ </span>
              {explain === "zh" ? <span className="font-kai text-[15px]">{p.summary.focus_zh}</span> : p.summary.focus_en}
            </p>
            {explain === "both" && <p className="mt-1 font-kai text-[15px] text-ink-2">{p.summary.focus_zh}</p>}
          </div>
        )}
        {p.status === "done" && !hasAny && (
          <div className="flex items-center gap-3 text-sm text-ok">
            <Momo state="happy" size={52} />
            {t.results.noIssues}
          </div>
        )}
        {isDesktop &&
          notes.map((a, i) => (
            <motion.div
              key={a.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease }}
            >
              <NoteCard
                a={a}
                active={activeId === a.id}
                resolved={resolved.has(a.id)}
                onActivate={() => onActivate(a.id, "card")}
                onResolve={() => onResolve(a.id)}
                onDismiss={() => onDismiss(a.id)}
              />
            </motion.div>
          ))}
      </aside>
    </div>
  );
}
