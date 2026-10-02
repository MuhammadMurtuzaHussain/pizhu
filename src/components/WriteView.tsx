"use client";

import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { EssayContext } from "@/lib/schema";
import { SAMPLE_ESSAY } from "@/lib/sample";
import { wordCount } from "@/lib/paragraphs";
import type { useAnalysis, ParaState } from "@/lib/useAnalysis";
import { AnnotatedText } from "./AnnotatedText";
import { NoteCard } from "./NoteCard";

type Analysis = ReturnType<typeof useAnalysis>;

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
  status: { mode: "local" | "hosted"; maxWords: number | null } | null;
}) {
  const { t, script } = useI18n();
  const { run, analyze, recheck, reset } = analysis;
  const fullCtx: EssayContext = { ...context, script };
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = async (f: File) => {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
    setText(value.replace(/\n{3,}/g, "\n\n").trim());
  };

  if (run.status === "idle") {
    return (
      <section className="mx-auto max-w-3xl">
        <p className="mb-6 font-serif text-lg leading-relaxed text-ink-2">{t.editor.principle}</p>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={t.context.discipline}>
            <input
              value={context.discipline}
              onChange={(e) => setContext({ ...context, discipline: e.target.value })}
              className="w-full rounded-lg border border-rule bg-card px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t.context.task}>
            <Select value={context.task} onChange={(v) => setContext({ ...context, task: v as EssayContext["task"] })} options={t.context.tasks} />
          </Field>
          <Field label={t.context.level}>
            <Select value={context.level} onChange={(v) => setContext({ ...context, level: v as EssayContext["level"] })} options={t.context.levels} />
          </Field>
          <Field label={t.context.variety}>
            <Select value={context.variety} onChange={(v) => setContext({ ...context, variety: v as EssayContext["variety"] })} options={t.context.varieties} />
          </Field>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.editor.placeholder}
          rows={16}
          className="w-full resize-y rounded-xl border border-rule bg-card p-5 font-serif text-[17px] leading-relaxed text-ink placeholder:text-ink-3"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            disabled={!text.trim()}
            onClick={() => analyze(text, fullCtx)}
            className="rounded-lg bg-vermilion px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-40"
          >
            {t.editor.check}
          </button>
          <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-rule bg-card px-4 py-2.5 text-sm text-ink-2 hover:bg-paper-2">
            {t.editor.upload}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          <button onClick={() => setText(SAMPLE_ESSAY)} className="rounded-lg px-3 py-2.5 text-sm text-ink-2 underline-offset-4 hover:underline">
            {t.editor.sample}
          </button>
          <span className="ml-auto text-xs text-ink-3">
            {wordCount(text)} {t.editor.words}
            {status?.maxWords ? ` / ${status.maxWords}` : ""}
          </span>
        </div>
        <p className="mt-3 text-xs text-ink-3">{status?.mode === "hosted" ? t.editor.privacyHosted : t.editor.privacyLocal}</p>
      </section>
    );
  }

  return <Results run={run} maxWords={status?.maxWords ?? null} onBack={reset} onRecheck={(id, txt) => recheck(id, txt, fullCtx)} />;
}

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
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mustOnly, setMustOnly] = useState(false);

  const analysable = run.paragraphs.filter((p) => p.status !== "skipped");
  const done = analysable.filter((p) => p.status === "done" || p.status === "error").length;
  const allNotes = run.paragraphs.flatMap((p) => p.annotations).filter((a) => !dismissed.has(a.id));
  const counts = useMemo(() => {
    const c = { must_fix: 0, worth_fixing: 0, style: 0 };
    for (const a of allNotes) c[a.severity]++;
    return c;
  }, [allNotes]);

  const activate = (id: string) => {
    setActiveId(id);
    document.getElementById(`card-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  return (
    <section>
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onBack} className="rounded-lg border border-rule bg-card px-3 py-1.5 text-sm text-ink-2 hover:bg-paper-2">
            ← {t.editor.edit}
          </button>
          <div className="text-sm text-ink-2">
            {run.status === "running" ? (
              <span className="reading">{t.results.progress(done, analysable.length || 0)}</span>
            ) : (
              t.results.summaryLine(allNotes.length)
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Dot className="bg-must" /> {counts.must_fix}
            <Dot className="ml-2 bg-worth" /> {counts.worth_fixing}
            <Dot className="ml-2 bg-style" /> {counts.style}
          </div>
          <div className="ml-auto flex rounded-lg border border-rule bg-card p-0.5 text-xs">
            <button onClick={() => setMustOnly(false)} className={`rounded-md px-2.5 py-1 ${!mustOnly ? "bg-paper-2 text-ink" : "text-ink-3"}`}>
              {t.results.filterAll}
            </button>
            <button onClick={() => setMustOnly(true)} className={`rounded-md px-2.5 py-1 ${mustOnly ? "bg-paper-2 text-ink" : "text-ink-3"}`}>
              {t.results.filterMust}
            </button>
          </div>
        </div>
        {run.status === "running" && (
          <div className="mt-2 h-0.5 w-full overflow-hidden rounded bg-rule">
            <div className="h-full bg-vermilion transition-all" style={{ width: `${analysable.length ? (done / analysable.length) * 100 : 5}%` }} />
          </div>
        )}
      </div>

      {run.error && <p className="mb-4 rounded-lg bg-must-bg px-4 py-3 text-sm text-must">{run.error}</p>}

      <div className="space-y-10">
        {run.paragraphs.map((p, i) => (
          <ParagraphRow
            key={p.id}
            index={i}
            p={p}
            notes={p.annotations.filter((a) => !dismissed.has(a.id) && (!mustOnly || a.severity === "must_fix"))}
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
        <p className="mt-10 border-t border-rule pt-4 text-xs text-ink-3">
          {t.results.guardNote(run.stats.nudgesProposed, run.stats.nudgesStripped)} · {run.model}
        </p>
      )}
    </section>
  );
}

function ParagraphRow({
  index,
  p,
  notes,
  activeId,
  resolved,
  onActivate,
  onResolve,
  onDismiss,
  onRecheck,
}: {
  index: number;
  p: ParaState;
  notes: ParaState["annotations"];
  activeId: string | null;
  resolved: Set<string>;
  onActivate: (id: string) => void;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
  onRecheck: (text: string) => void;
}) {
  const { t, explain } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.text);

  if (p.status === "skipped") {
    return <h3 className="font-serif text-xl font-medium text-ink">{p.text}</h3>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* The paragraph stays in view while its notes scroll past. */}
      <div className="self-start lg:sticky lg:top-24">
        <div className="mb-1 text-xs text-ink-3">¶ {index + 1}</div>
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.max(5, Math.ceil(draft.length / 80))}
              className="w-full rounded-xl border border-ink-3 bg-card p-4 font-serif text-[18px] leading-[1.8]"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  onRecheck(draft);
                }}
                className="rounded-lg bg-vermilion px-3 py-1.5 text-xs font-medium text-white"
              >
                {t.results.recheck}
              </button>
              <button onClick={() => (setEditing(false), setDraft(p.text))} className="rounded-lg border border-rule px-3 py-1.5 text-xs text-ink-2">
                {t.results.cancel}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={`font-serif text-[18px] leading-[1.8] text-ink ${p.status === "pending" ? "reading" : ""}`}>
              <AnnotatedText text={p.text} annotations={notes} activeId={activeId} resolved={resolved} onActivate={onActivate} />
            </p>
            {p.status !== "pending" && (
              <button onClick={() => (setDraft(p.text), setEditing(true))} className="mt-2 text-xs text-ink-3 underline-offset-4 hover:text-ink-2 hover:underline">
                {t.results.editParagraph}
              </button>
            )}
          </>
        )}
      </div>

      <aside className="space-y-3">
        {p.status === "error" && <p className="rounded-lg bg-must-bg px-3 py-2 text-sm text-must">{t.results.failed}</p>}
        {p.status === "done" && p.summary && (
          <div className="rounded-xl border border-dashed border-rule px-4 py-3 text-sm">
            <div className="mb-1 flex items-center gap-2 text-xs text-ink-3">
              <span className="font-medium text-ink-2">{t.results.markersEye}</span>
              <span>·</span>
              <span>{t.results.dimensions[p.summary.dimension]}</span>
            </div>
            <p className="text-ink">
              <span className="text-ok">✓ </span>
              {explain === "zh" ? p.summary.strength_zh : p.summary.strength_en}
            </p>
            <p className="mt-1 text-ink">
              <span className="text-vermilion">→ </span>
              {explain === "zh" ? p.summary.focus_zh : p.summary.focus_en}
            </p>
            {explain === "both" && <p className="mt-1 text-ink-2">{p.summary.focus_zh}</p>}
          </div>
        )}
        {p.status === "done" && notes.length === 0 && <p className="text-sm text-ok">{t.results.noIssues}</p>}
        {notes.map((a) => (
          <NoteCard
            key={a.id}
            a={a}
            active={activeId === a.id}
            resolved={resolved.has(a.id)}
            onActivate={() => onActivate(a.id)}
            onResolve={() => onResolve(a.id)}
            onDismiss={() => onDismiss(a.id)}
          />
        ))}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-3">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Record<string, string> }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-rule bg-card px-3 py-2 text-sm">
      {Object.entries(options).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );
}

const Dot = ({ className }: { className: string }) => <span className={`inline-block h-2 w-2 rounded-full ${className}`} />;
