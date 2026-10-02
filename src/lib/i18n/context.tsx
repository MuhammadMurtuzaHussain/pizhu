"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LOCALES, MESSAGES, type Locale, type Messages } from "./messages";

export type ExplainLang = "both" | "en" | "zh";

type Prefs = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  explain: ExplainLang;
  setExplain: (e: ExplainLang) => void;
  /** Chinese script for model output: follows the UI unless the UI is English, then Simplified unless set. */
  script: "zh-Hans" | "zh-Hant";
  t: Messages;
};

const Ctx = createContext<Prefs | null>(null);

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [explain, setExplainState] = useState<ExplainLang>("both");
  const [script, setScript] = useState<"zh-Hans" | "zh-Hant">("zh-Hans");

  // Preferences live in browser storage, which only exists after hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = read("pizhu.locale") as Locale | null;
    const nav = navigator.language.toLowerCase();
    const guess: Locale = /zh-(tw|hk|mo|hant)/.test(nav) ? "zh-Hant" : nav.startsWith("zh") ? "zh-Hans" : "en";
    const l = saved && LOCALES.includes(saved) ? saved : guess;
    setLocaleState(l);
    if (l !== "en") setScript(l);
    else if (read("pizhu.script") === "zh-Hant") setScript("zh-Hant");
    const e = read("pizhu.explain") as ExplainLang | null;
    if (e) setExplainState(e);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    write("pizhu.locale", l);
    if (l !== "en") {
      setScript(l);
      write("pizhu.script", l);
    }
  };
  const setExplain = (e: ExplainLang) => {
    setExplainState(e);
    write("pizhu.explain", e);
  };

  return <Ctx.Provider value={{ locale, setLocale, explain, setExplain, script, t: MESSAGES[locale] }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}
