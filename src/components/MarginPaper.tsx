"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PencilSimple } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import type { Annotation } from "@/lib/schema";
import type { ParaState } from "@/lib/useAnalysis";
import { AnnotatedText } from "./AnnotatedText";
import { NoteCard } from "./NoteCard";
import { Momo } from "./Momo";
import { MarkersEye } from "./MarkersEye";

// Real margin notes: the essay sits on grid paper and every note floats in the
// margin beside the line it belongs to, like a teacher's 批注. Notes that would
// overlap are nudged apart; the active note gets an ink connector to its words.

const GAP = 12;
const SEV_COLOR = { must_fix: "var(--must)", worth_fixing: "var(--worth)", style: "var(--style)" } as const;

type Pos = { top: number; anchorX: number; anchorY: number };

export function MarginPaper({
  paragraphs,
  shown,
  activeId,
  resolved,
  onActivate,
  onResolve,
  onDismiss,
  onRecheck,
}: {
  paragraphs: ParaState[];
  shown: (a: Annotation) => boolean;
  activeId: string | null;
  resolved: Set<string>;
  onActivate: (id: string, from?: "mark" | "card" | "key") => void;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
  onRecheck: (id: string, text: string) => void;
}) {
  const reduce = useReducedMotion();
  const paper = useRef<HTMLDivElement>(null);
  const margin = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLDivElement>());
  const [pos, setPos] = useState<Record<string, Pos>>({});
  const [height, setHeight] = useState(0);
  const [marginX, setMarginX] = useState(0);
  const [marginY, setMarginY] = useState(0);

  // While a paragraph is being edited its notes (and connector) are stale, so hide them.
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const notes = paragraphs.filter((p) => !editing.has(p.id)).flatMap((p) => p.annotations.filter(shown));
  const key = notes.map((n) => n.id).join("|");
  const setParaEditing = useCallback((id: string, on: boolean) => {
    setEditing((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  }, []);

  const layout = useCallback(() => {
    const root = paper.current;
    const col = margin.current;
    if (!root || !col) return;
    const box = root.getBoundingClientRect();
    const colBox = col.getBoundingClientRect();
    setMarginX(colBox.left - box.left);
    setMarginY(colBox.top - box.top);

    // Where each note wants to sit: level with the first line of its span.
    const wanted = notes
      .map((n) => {
        const el = root.querySelector<HTMLElement>(`[data-mark="${n.id}"]`);
        if (!el) return null;
        const rects = el.getClientRects();
        const first = rects[0];
        const last = rects[rects.length - 1];
        return {
          id: n.id,
          desired: first.top - colBox.top - 6,
          h: cards.current.get(n.id)?.offsetHeight ?? 96,
          anchorX: last.right - box.left,
          anchorY: last.bottom - box.top - 2,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.desired - b.desired);

    // The active note sits exactly level with its words; the rest flow around it.
    const tops = new Array<number>(wanted.length);
    const ai = wanted.findIndex((w) => w.id === activeId);
    if (ai === -1) {
      let floor = 0;
      wanted.forEach((w, i) => {
        tops[i] = Math.max(w.desired, floor);
        floor = tops[i] + w.h + GAP;
      });
    } else {
      tops[ai] = Math.max(0, wanted[ai].desired);
      let ceil = tops[ai] - GAP;
      for (let i = ai - 1; i >= 0; i--) {
        tops[i] = Math.min(wanted[i].desired, ceil - wanted[i].h);
        ceil = tops[i] - GAP;
      }
      // If notes above were pushed past the top, shift that group down.
      if (ai > 0 && tops[0] < 0) {
        const shift = -tops[0];
        for (let i = 0; i <= ai; i++) tops[i] += shift;
      }
      let floor = tops[ai] + wanted[ai].h + GAP;
      for (let i = ai + 1; i < wanted.length; i++) {
        tops[i] = Math.max(wanted[i].desired, floor);
        floor = tops[i] + wanted[i].h + GAP;
      }
    }

    const next: Record<string, Pos> = {};
    let bottom = 0;
    wanted.forEach((w, i) => {
      next[w.id] = { top: tops[i], anchorX: w.anchorX, anchorY: w.anchorY };
      bottom = Math.max(bottom, tops[i] + w.h);
    });
    setPos(next);
    setHeight(bottom);
  }, [key, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    layout();
    const ro = new ResizeObserver(() => layout());
    if (paper.current) ro.observe(paper.current);
    cards.current.forEach((el) => ro.observe(el));
    document.fonts?.ready.then(() => layout());
    return () => ro.disconnect();
  }, [layout]);

  const active = activeId ? notes.find((n) => n.id === activeId) : undefined;
  const ap = active ? pos[active.id] : undefined;

  return (
    <div ref={paper} className="grid-paper shadow-lift relative grid grid-cols-[minmax(0,1fr)_360px] gap-14 rounded-[2rem] px-12 py-12">
      <div className="space-y-10">
        {paragraphs.map((p, i) => (
          <PaperParagraph
            key={p.id}
            index={i}
            p={p}
            notes={p.annotations.filter(shown)}
            hasAny={p.annotations.length > 0}
            activeId={activeId}
            resolved={resolved}
            onActivate={onActivate}
            onEditing={(on) => setParaEditing(p.id, on)}
            onRecheck={(txt) => onRecheck(p.id, txt)}
          />
        ))}
      </div>

      <div ref={margin} className="relative border-l-2 border-dashed border-taro-2/60 pl-6" style={{ minHeight: height }}>
        {notes.map((a) => (
          <motion.div
            key={a.id}
            ref={(el) => {
              if (el) cards.current.set(a.id, el);
              else cards.current.delete(a.id);
            }}
            className="absolute left-6 right-0"
            initial={false}
            animate={{ y: pos[a.id]?.top ?? 0, opacity: pos[a.id] ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
            style={{ top: 0, zIndex: a.id === activeId ? 2 : 1 }}
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
      </div>

      {/* Ink connector from the active span to its note. */}
      {active && ap && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <motion.path
            key={active.id}
            d={`M ${ap.anchorX} ${ap.anchorY} C ${ap.anchorX + 60} ${ap.anchorY}, ${marginX - 10} ${marginY + ap.top + 34}, ${marginX + 24} ${marginY + ap.top + 34}`}
            fill="none"
            stroke={SEV_COLOR[active.severity]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 6"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
          <circle cx={ap.anchorX} cy={ap.anchorY} r="3.5" fill={SEV_COLOR[active.severity]} />
        </svg>
      )}
    </div>
  );
}

function PaperParagraph({
  index,
  p,
  notes,
  hasAny,
  activeId,
  resolved,
  onActivate,
  onEditing,
  onRecheck,
}: {
  index: number;
  p: ParaState;
  notes: Annotation[];
  hasAny: boolean;
  activeId: string | null;
  resolved: Set<string>;
  onActivate: (id: string, from?: "mark" | "card" | "key") => void;
  onEditing: (on: boolean) => void;
  onRecheck: (text: string) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditingState] = useState(false);
  const setEditing = (on: boolean) => {
    setEditingState(on);
    onEditing(on);
  };
  const [draft, setDraft] = useState(p.text);

  if (p.status === "skipped") return <h3 className="text-2xl font-semibold tracking-tight text-ink">{p.text}</h3>;

  return (
    <div className="group relative">
      <div className="absolute -left-9 top-1.5 text-xs font-semibold text-taro-2">{index + 1}</div>
      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.max(5, Math.ceil(draft.length / 70))}
            className="w-full rounded-2xl border-2 border-taro-2 bg-card p-4 font-serif text-[19px] leading-[1.9]"
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                onRecheck(draft);
              }}
              className="rounded-full bg-taro px-4 py-2 text-xs font-semibold text-on-taro active:scale-[0.98]"
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
          <p className={`font-serif text-[19px] leading-[1.9] text-ink ${p.status === "pending" ? "reading" : ""}`}>
            <AnnotatedText text={p.text} annotations={notes} activeId={activeId} resolved={resolved} onActivate={(id) => onActivate(id, "mark")} />
          </p>
          <div className="mt-2 flex min-h-6 items-center gap-3">
            {p.status === "done" && !hasAny && (
              <span className="inline-flex items-center gap-2 text-sm text-ok">
                <Momo state="happy" size={34} />
                {t.results.noIssues}
              </span>
            )}
            {p.status === "error" && (
              <span className="inline-flex items-center gap-2 text-sm text-must">
                {t.results.failed}
                <button onClick={() => onRecheck(p.text)} className="rounded-full bg-taro px-3 py-1 text-xs font-semibold text-on-taro">
                  {t.results.recheck}
                </button>
              </span>
            )}
            {p.status !== "pending" && (
              <button
                onClick={() => (setDraft(p.text), setEditing(true))}
                className="inline-flex items-center gap-1 text-xs text-ink-3 opacity-0 transition-opacity hover:text-taro focus-visible:opacity-100 group-hover:opacity-100"
              >
                <PencilSimple size={13} aria-hidden />
                {t.results.editParagraph}
              </button>
            )}
          </div>
          {p.status === "done" && p.summary && <MarkersEye summary={p.summary} />}
        </>
      )}
    </div>
  );
}
