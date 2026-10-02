"use client";

import type { Annotation } from "@/lib/schema";

/** Renders a paragraph with its annotation spans as clickable marks. */
export function AnnotatedText({
  text,
  annotations,
  activeId,
  resolved,
  onActivate,
}: {
  text: string;
  annotations: Annotation[];
  activeId: string | null;
  resolved: Set<string>;
  onActivate: (id: string) => void;
}) {
  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (const a of annotations) {
    if (a.start < pos) continue;
    if (a.start > pos) parts.push(text.slice(pos, a.start));
    parts.push(
      <mark
        key={a.id}
        data-mark={a.id}
        role="button"
        tabIndex={0}
        aria-label={a.category}
        className="mark bg-transparent text-inherit"
        data-sev={a.severity}
        data-active={activeId === a.id}
        data-resolved={resolved.has(a.id)}
        onClick={() => onActivate(a.id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onActivate(a.id))}
      >
        {text.slice(a.start, a.end)}
      </mark>,
    );
    pos = a.end;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}
