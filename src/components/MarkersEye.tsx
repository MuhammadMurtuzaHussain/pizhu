"use client";

import { Eye } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import type { ParaState } from "@/lib/useAnalysis";

/** One line from Gemma's paragraph summary: the UK marking dimension to focus on. */
export function MarkersEye({ summary }: { summary: NonNullable<ParaState["summary"]> }) {
  const { t, explain } = useI18n();
  return (
    <p className="mt-3 flex gap-2 rounded-xl bg-paper-2/80 px-3 py-2 text-sm text-ink-2">
      <Eye size={16} className="mt-0.5 shrink-0 text-taro" aria-hidden />
      <span>
        <span className="font-semibold text-ink">
          {t.extra.markersEye} · {t.results.dimensions[summary.dimension]}:{" "}
        </span>
        {explain === "zh" ? <span className="font-kai text-[15px]">{summary.focus_zh}</span> : summary.focus_en}
      </span>
    </p>
  );
}
