"use client";

import { useSyncExternalStore } from "react";
import { Desktop, Moon, Sun } from "@phosphor-icons/react";

// System → light → dark. The choice is applied to <html data-theme> (and
// pre-applied by an inline script in layout.tsx so there's no flash).

type Theme = "system" | "light" | "dark";
const KEY = "pizhu.theme";
const EVENT = "pizhu-theme";

const read = (): Theme => {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
};

function apply(t: Theme) {
  const el = document.documentElement;
  if (t === "system") delete el.dataset.theme;
  else el.dataset.theme = t;
  try {
    if (t === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

const LABELS: Record<Theme, string> = { system: "Theme: system", light: "Theme: light", dark: "Theme: dark" };
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      return () => window.removeEventListener(EVENT, cb);
    },
    read,
    () => "system" as Theme,
  );
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Desktop;
  return (
    <button
      onClick={() => apply(NEXT[theme])}
      aria-label={`${LABELS[theme]}. Switch to ${NEXT[theme]}`}
      title={LABELS[theme]}
      className="grid h-8 w-8 place-items-center rounded-full border border-rule bg-card text-ink-2 transition-transform hover:text-taro active:scale-95"
    >
      <Icon size={16} weight="bold" aria-hidden />
    </button>
  );
}
