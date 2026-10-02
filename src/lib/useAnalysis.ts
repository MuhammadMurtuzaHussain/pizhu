"use client";

import { useCallback, useRef, useState } from "react";
import type { AnalyzeEvent, Annotation, EssayContext, GuardStats, ModelParagraph, Overview } from "./schema";
import { addStats, emptyStats } from "./guard";
import { recordHabits } from "./habits";
import type { CategoryId } from "./taxonomy";

export type ParaState = {
  id: string;
  text: string;
  status: "pending" | "done" | "error" | "skipped";
  annotations: Annotation[];
  summary: ModelParagraph["summary"] | null;
  stats: GuardStats;
};

export type RunState = {
  status: "idle" | "running" | "done" | "error";
  mode?: "local" | "hosted";
  model?: string;
  truncated?: boolean;
  paragraphs: ParaState[];
  stats: GuardStats;
  error?: string;
  /** Whole-paper overview: pending while the full-paper pass runs. */
  overview?: { status: "pending" | "done" | "error"; data?: Overview };
};

const initial: RunState = { status: "idle", paragraphs: [], stats: emptyStats() };

async function* readNdjson(res: Response): AsyncGenerator<AnalyzeEvent> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) yield JSON.parse(line);
    }
  }
  if (buf.trim()) yield JSON.parse(buf);
}

export function useAnalysis() {
  const [run, setRun] = useState<RunState>(initial);
  const abort = useRef<AbortController | null>(null);

  const analyze = useCallback(async (text: string, context: EssayContext, brief?: string) => {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setRun({ ...initial, status: "running" });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context, brief: brief?.trim() || undefined }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(res.status === 429 ? "rate_limited" : `HTTP ${res.status}`);
      const counts: Partial<Record<CategoryId, number>> = {};
      for await (const e of readNdjson(res)) {
        if (e.type === "meta") {
          setRun((r) => ({
            ...r,
            mode: e.mode,
            model: e.model,
            truncated: e.truncated,
            paragraphs: e.paragraphs.map((p) => ({ ...p, status: "pending", annotations: [], summary: null, stats: emptyStats() })),
            overview: e.paragraphs.length >= 2 ? { status: "pending" } : undefined,
          }));
        } else if (e.type === "overview") {
          setRun((r) => ({ ...r, overview: { status: "done", data: e.overview } }));
        } else if (e.type === "overview_error") {
          setRun((r) => ({ ...r, overview: { status: "error" } }));
        } else if (e.type === "paragraph") {
          for (const a of e.annotations) counts[a.category] = (counts[a.category] ?? 0) + 1;
          setRun((r) => ({
            ...r,
            stats: addStats(r.stats, e.stats),
            paragraphs: r.paragraphs.map((p) => (p.id === e.id ? { ...p, status: "done", annotations: e.annotations, summary: e.summary, stats: e.stats } : p)),
          }));
        } else if (e.type === "error") {
          setRun((r) => ({ ...r, paragraphs: r.paragraphs.map((p) => (p.id === e.id ? { ...p, status: "error" } : p)) }));
        } else if (e.type === "done") {
          // Headings are never sent for analysis; mark whatever is still pending as skipped.
          setRun((r) => ({ ...r, status: "done", paragraphs: r.paragraphs.map((p) => (p.status === "pending" ? { ...p, status: "skipped" } : p)) }));
          recordHabits(counts);
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setRun((r) => ({ ...r, status: "error", error: (err as Error).message }));
    }
  }, []);

  /** Re-check one edited paragraph and replace its notes in place. */
  const recheck = useCallback(async (id: string, text: string, context: EssayContext) => {
    setRun((r) => ({ ...r, paragraphs: r.paragraphs.map((p) => (p.id === id ? { ...p, text, status: "pending", annotations: [] } : p)) }));
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context, paragraphId: id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      for await (const e of readNdjson(res)) {
        if (e.type === "paragraph") {
          setRun((r) => ({
            ...r,
            stats: addStats(r.stats, e.stats),
            paragraphs: r.paragraphs.map((p) => (p.id === id ? { ...p, status: "done", annotations: e.annotations, summary: e.summary, stats: e.stats } : p)),
          }));
        } else if (e.type === "error") {
          setRun((r) => ({ ...r, paragraphs: r.paragraphs.map((p) => (p.id === id ? { ...p, status: "error" } : p)) }));
        }
      }
    } catch {
      setRun((r) => ({ ...r, paragraphs: r.paragraphs.map((p) => (p.id === id ? { ...p, status: "error" } : p)) }));
    }
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setRun(initial);
  }, []);

  return { run, analyze, recheck, reset };
}
