"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookBookmark, BookOpenText, Cloud, Lock, Notebook, PencilSimpleLine, Warning } from "@phosphor-icons/react";
import { useI18n, type ExplainLang } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/messages";
import type { EssayContext } from "@/lib/schema";
import { useAnalysis } from "@/lib/useAnalysis";
import { MomoProvider } from "@/lib/momo";
import { MomoDock } from "@/components/MomoDock";
import { Welcome } from "@/components/Welcome";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { WriteView } from "@/components/WriteView";
import { ReferencesView } from "@/components/ReferencesView";
import { HabitsView } from "@/components/HabitsView";
import { GlossaryView } from "@/components/GlossaryView";

type Tab = "write" | "references" | "habits" | "glossary";
type Status = { mode: "local" | "hosted"; model: string; ready: boolean; scholar: boolean; maxWords: number | null };

const DRAFT_KEY = "pizhu.draft.v1";
const BRIEF_KEY = "pizhu.brief.v1";

const TAB_ICONS = { write: PencilSimpleLine, references: BookOpenText, habits: Notebook, glossary: BookBookmark } as const;

const LOCALE_LABELS: [Locale, string][] = [
  ["en", "EN"],
  ["zh-Hans", "简"],
  ["zh-Hant", "繁"],
];

export default function Home() {
  return (
    <MomoProvider>
      <App />
    </MomoProvider>
  );
}

function App() {
  const { t, locale, setLocale, explain, setExplain } = useI18n();
  const [tab, setTab] = useState<Tab>("write");
  const [text, setText] = useState("");
  const [brief, setBrief] = useState("");
  const [context, setContext] = useState<Omit<EssayContext, "script">>({
    discipline: "Global Mass Communication",
    task: "essay",
    level: "postgraduate",
    variety: "uk",
  });
  const [status, setStatus] = useState<Status | null>(null);
  const analysis = useAnalysis();
  const [lessonOpen, setLessonOpen] = useState(false);

  // Keep the draft in this browser so a refresh never loses it (never uploaded).
  useEffect(() => {
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) setText(d); // eslint-disable-line react-hooks/set-state-in-effect
      const b = localStorage.getItem(BRIEF_KEY);
      if (b) setBrief(b);
    } catch {}
  }, []);
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (text) localStorage.setItem(DRAFT_KEY, text);
        else localStorage.removeItem(DRAFT_KEY);
        if (brief) localStorage.setItem(BRIEF_KEY, brief);
        else localStorage.removeItem(BRIEF_KEY);
      } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [text, brief]);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const ModeIcon = !status?.ready ? Warning : status.mode === "local" ? Lock : Cloud;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[1240px] flex-col px-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 py-5">
        <div className="flex items-center gap-3">
          {/* A seal (印章) sticker: the 批注 mark, in taro. */}
          <div
            aria-hidden
            className="sticker grid h-11 w-11 -rotate-3 place-items-center rounded-[12px] bg-taro font-kai text-[16px] leading-none tracking-widest text-on-taro [writing-mode:vertical-rl]"
          >
            批注
          </div>
          <div>
            <h1 translate="no" className="text-2xl font-bold leading-none tracking-tight text-ink">Pīzhù</h1>
            <p className="mt-1 text-xs text-ink-3">{t.brandTag}</p>
          </div>
        </div>

        {status && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
              !status.ready ? "bg-must-bg text-must" : status.mode === "local" ? "bg-ok-bg text-ok" : "bg-style-bg text-style"
            }`}
            title={status.model}
          >
            <ModeIcon size={13} weight="bold" aria-hidden />
            {!status.ready ? `${t.mode.notReady} · ${status.model}` : status.mode === "local" ? t.mode.local : t.mode.hosted}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2 text-xs">
          <Segmented
            label={t.explainIn}
            value={explain}
            onChange={(v) => setExplain(v as ExplainLang)}
            options={Object.entries(t.explainOptions) as [string, string][]}
          />
          <Segmented label="Language / 语言" value={locale} onChange={(v) => setLocale(v as Locale)} options={LOCALE_LABELS} />
          <ThemeToggle />
        </div>
      </header>

      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-rule [scrollbar-width:none]" aria-label="Sections">
        {(Object.keys(t.tabs) as Tab[]).map((k) => {
          const Icon = TAB_ICONS[k];
          const active = tab === k;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm transition-colors ${
                active ? "text-ink" : "text-ink-3 hover:text-ink-2"
              }`}
            >
              <Icon size={16} weight={active ? "regular" : "light"} aria-hidden />
              {t.tabs[k]}
              {active && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-taro"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 pb-20">
        {tab === "write" && <WriteView text={text} setText={setText} context={context} setContext={setContext} analysis={analysis} status={status} onLessonChange={setLessonOpen} brief={brief} setBrief={setBrief} />}
        {tab === "references" && <ReferencesView text={text} />}
        {tab === "habits" && <HabitsView />}
        {tab === "glossary" && <GlossaryView />}
      </main>

      <MomoDock hidden={lessonOpen} />
      <Welcome />

      <Footer />
    </div>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-rule bg-card p-0.5">
      {options.map(([k, v]) => (
        <button
          key={k}
          role="radio"
          aria-checked={value === k}
          onClick={() => onChange(k)}
          className={`rounded-full px-2.5 py-1 transition-colors ${value === k ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
