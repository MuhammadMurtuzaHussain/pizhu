"use client";

import { useEffect, useState } from "react";
import { useI18n, type ExplainLang } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/messages";
import type { EssayContext } from "@/lib/schema";
import { useAnalysis } from "@/lib/useAnalysis";
import { WriteView } from "@/components/WriteView";
import { ReferencesView } from "@/components/ReferencesView";
import { HabitsView } from "@/components/HabitsView";
import { GlossaryView } from "@/components/GlossaryView";

type Tab = "write" | "references" | "habits" | "glossary";
type Status = { mode: "local" | "hosted"; model: string; ready: boolean; scholar: boolean; maxWords: number | null };

const LOCALE_LABELS: [Locale, string][] = [
  ["en", "EN"],
  ["zh-Hans", "简"],
  ["zh-Hant", "繁"],
];

export default function Home() {
  const { t, locale, setLocale, explain, setExplain } = useI18n();
  const [tab, setTab] = useState<Tab>("write");
  const [text, setText] = useState("");
  const [context, setContext] = useState<Omit<EssayContext, "script">>({
    discipline: "Global Mass Communication",
    task: "essay",
    level: "postgraduate",
    variety: "uk",
  });
  const [status, setStatus] = useState<Status | null>(null);
  const analysis = useAnalysis();

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 py-5">
        <div className="flex items-center gap-3">
          {/* A seal (印章) in vermilion: the colour of traditional 批注 margin notes. */}
          <div aria-hidden className="grid h-11 w-11 place-items-center rounded-md bg-vermilion text-[15px] font-semibold leading-none tracking-widest text-white shadow-sm [writing-mode:vertical-rl]">
            批注
          </div>
          <div>
            <h1 className="font-serif text-2xl leading-none text-ink">Pīzhù</h1>
            <p className="mt-1 text-xs text-ink-3">{t.brandTag}</p>
          </div>
        </div>

        {status && (
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              !status.ready ? "bg-must-bg text-must" : status.mode === "local" ? "bg-ok-bg text-ok" : "bg-style-bg text-style"
            }`}
            title={status.model}
          >
            {!status.ready ? `${t.mode.notReady} · ${status.model}` : status.mode === "local" ? `🔒 ${t.mode.local}` : `☁︎ ${t.mode.hosted}`}
          </span>
        )}

        <div className="ml-auto flex items-center gap-3 text-xs">
          <Segmented
            label={t.explainIn}
            value={explain}
            onChange={(v) => setExplain(v as ExplainLang)}
            options={Object.entries(t.explainOptions) as [string, string][]}
          />
          <Segmented label="Language / 语言" value={locale} onChange={(v) => setLocale(v as Locale)} options={LOCALE_LABELS} />
        </div>
      </header>

      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-rule [scrollbar-width:none]" aria-label="Sections">
        {(Object.keys(t.tabs) as Tab[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            aria-current={tab === k ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm ${
              tab === k ? "border-vermilion text-ink" : "border-transparent text-ink-3 hover:text-ink-2"
            }`}
          >
            {t.tabs[k]}
          </button>
        ))}
      </nav>

      <main className="flex-1 pb-16">
        {tab === "write" && <WriteView text={text} setText={setText} context={context} setContext={setContext} analysis={analysis} status={status} />}
        {tab === "references" && <ReferencesView text={text} />}
        {tab === "habits" && <HabitsView />}
        {tab === "glossary" && <GlossaryView />}
      </main>

      <footer className="border-t border-rule py-5 text-xs text-ink-3">
        {t.footer}{" "}
        <a href="https://github.com/MuhammadMurtuzaHussain/pizhu" className="underline underline-offset-2" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
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
    <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-rule bg-card p-0.5">
      {options.map(([k, v]) => (
        <button
          key={k}
          role="radio"
          aria-checked={value === k}
          onClick={() => onChange(k)}
          className={`rounded-md px-2.5 py-1 ${value === k ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
