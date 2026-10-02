"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { ReferencesResult } from "@/mastra/workflows/references";

const statusStyle = {
  found: "bg-ok-bg text-ok",
  mismatch: "bg-worth-bg text-worth",
  not_found: "bg-must-bg text-must",
  unchecked: "bg-paper-2 text-ink-3",
} as const;
const statusIcon = { found: "✓", mismatch: "≈", not_found: "?", unchecked: "–" } as const;

export function ReferencesView({ text }: { text: string }) {
  const { t, script, explain } = useI18n();
  const [state, setState] = useState<{ loading: boolean; result?: ReferencesResult; error?: string }>({ loading: false });

  const run = async () => {
    setState({ loading: true });
    const res = await fetch("/api/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, script }),
    });
    const data = await res.json();
    if (!res.ok) setState({ loading: false, error: data.error === "no_references" ? t.refs.none : String(data.error) });
    else setState({ loading: false, result: data });
  };

  const r = state.result;
  return (
    <section className="mx-auto max-w-3xl">
      <p className="mb-1 font-serif text-lg text-ink-2">{t.refs.intro}</p>
      <p className="mb-5 text-xs text-ink-3">{t.refs.privacy}</p>

      {!text.trim() ? (
        <p className="text-sm text-ink-3">{t.refs.needText}</p>
      ) : (
        <button
          onClick={run}
          disabled={state.loading}
          className="rounded-lg bg-vermilion px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {state.loading ? <span className="reading">{t.refs.running}</span> : t.refs.run}
        </button>
      )}

      {state.error && <p className="mt-4 rounded-lg bg-must-bg px-4 py-3 text-sm text-must">{state.error}</p>}

      {r && (
        <div className="mt-6 space-y-3">
          {!r.scholarConfigured && <p className="text-sm text-ink-3">{t.refs.noScholar}</p>}

          {r.citedNotListed.length > 0 && (
            <div className="rounded-xl border border-must/30 bg-must-bg/50 px-4 py-3 text-sm">
              <div className="mb-1 font-medium text-must">{t.refs.citedNotListed}</div>
              <ul className="list-inside list-disc text-ink">
                {r.citedNotListed.map((c, i) => (
                  <li key={i}>{c.raw}</li>
                ))}
              </ul>
            </div>
          )}

          {r.refs.map((ref) => (
            <article key={ref.index} className="rounded-xl border border-rule bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${statusStyle[ref.status]}`}>
                  {statusIcon[ref.status]} {t.refs.status[ref.status]}
                </span>
                {ref.issues.map((i) => (
                  <span key={i} className="text-worth">
                    {t.refs.issues[i]}
                  </span>
                ))}
                <span className={ref.citedInText === 0 ? "text-must" : "text-ink-3"}>· {t.refs.citedTimes(ref.citedInText)}</span>
              </div>
              <p className="font-serif text-[15px] leading-snug text-ink">{ref.raw}</p>
              {ref.match && ref.status !== "found" && (
                <p className="mt-2 text-xs text-ink-3">
                  {t.refs.match}:{" "}
                  {ref.match.link ? (
                    <a href={ref.match.link} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      {ref.match.title}
                    </a>
                  ) : (
                    ref.match.title
                  )}{" "}
                  — {ref.match.summary}
                </p>
              )}
              {ref.status === "found" && ref.match?.link && (
                <a href={ref.match.link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-ink-3 underline underline-offset-2">
                  {ref.match.summary || ref.match.title}
                </a>
              )}
              {(ref.tips_en.length > 0 || ref.tips_zh.length > 0) && (
                <div className="mt-3 text-sm">
                  <div className="mb-0.5 text-xs font-medium text-ink-2">{t.refs.tips}</div>
                  <ul className="list-inside list-disc space-y-0.5 text-ink-2">
                    {(explain === "zh" ? ref.tips_zh : ref.tips_en).map((tip, i) => (
                      <li key={i}>
                        {tip}
                        {explain === "both" && ref.tips_zh[i] && <span className="block pl-4 text-ink-3">{ref.tips_zh[i]}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
