"use client";

import { Fragment } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { EssayContext } from "@/lib/schema";

type Ctx = Omit<EssayContext, "script">;

/** "I'm a [postgraduate] student in [Global Mass Communication], writing [an essay]…" with inline pickers. */
export function ContextSentence({ value, onChange }: { value: Ctx; onChange: (c: Ctx) => void }) {
  const { t } = useI18n();
  const c = t.context;

  const pick = <K extends "level" | "task" | "variety">(key: K, options: Record<string, string>) => (
    <select
      aria-label={key}
      value={value[key]}
      onChange={(e) => onChange({ ...value, [key]: e.target.value } as Ctx)}
      className="word-select"
    >
      {Object.entries(options).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );

  const slots: Record<string, React.ReactNode> = {
    level: pick("level", c.levels),
    task: pick("task", c.tasks),
    variety: pick("variety", c.varieties),
    discipline: (
      <input
        aria-label={c.disciplineLabel}
        value={value.discipline}
        onChange={(e) => onChange({ ...value, discipline: e.target.value })}
        size={Math.max(8, value.discipline.length)}
        className="word-select !bg-none !pr-0.5"
      />
    ),
  };

  return (
    <p className="text-[15px] leading-9 text-ink-2">
      {c.sentence.split(/(\{\w+\})/).map((part, i) => {
        const m = part.match(/^\{(\w+)\}$/);
        return <Fragment key={i}>{m ? slots[m[1]] : part}</Fragment>;
      })}
    </p>
  );
}
