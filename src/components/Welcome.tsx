"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/messages";
import { useMomo } from "@/lib/momo";
import { Momo } from "./Momo";

const KEY = "pizhu.welcomed";

const seen = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
};

/** First visit: Mòmo says hello and you pick the explanation language. */
export function Welcome() {
  const { t, setLocale, setExplain } = useI18n();
  const { say } = useMomo();
  // Read browser storage only after hydration (server snapshot: not open).
  const firstVisit = useSyncExternalStore(
    () => () => {},
    () => !seen(),
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  const open = firstVisit && !dismissed;
  const setOpen = (v: boolean) => setDismissed(!v);

  const choose = (l: Locale) => {
    setLocale(l);
    setExplain(l === "en" ? "en" : "both");
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setOpen(false);
    setTimeout(() => say(l === "en" ? "Hi! Paste a draft whenever you're ready." : l === "zh-Hant" ? "準備好就貼上草稿吧！" : "准备好就贴上草稿吧！", "happy", 6000), 400);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="w-full max-w-md rounded-[2rem] bg-card p-7 text-center shadow-lift"
          >
            <Momo state="happy" size={140} className="mx-auto -mt-16" />
            <h2 id="welcome-title" className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              {t.welcome.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{t.welcome.sub}</p>
            <div className="mt-6 grid gap-2.5">
              {(
                [
                  ["zh-Hans", t.welcome.hans],
                  ["zh-Hant", t.welcome.hant],
                  ["en", t.welcome.en],
                ] as [Locale, string][]
              ).map(([l, label], i) => (
                <button
                  key={l}
                  onClick={() => choose(l)}
                  className={`rounded-full py-3 text-base font-semibold transition-transform active:scale-[0.98] ${
                    i === 0 ? "bg-taro text-on-taro" : "border border-rule bg-paper text-ink hover:border-taro-2"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
