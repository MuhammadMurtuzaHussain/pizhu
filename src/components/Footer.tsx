"use client";

import { ArrowUpRight, GithubLogo, Trophy } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import { Momo } from "./Momo";

const LINKS = {
  repo: "https://github.com/MuhammadMurtuzaHussain/pizhu",
  dev: "https://dev.to/muhammadmurtuzahussain",
  challenge: "https://dev.to/challenges/hacktoberfest-weekend-2026-10-01",
};

export function Footer() {
  const { t, locale } = useI18n();
  const f = t.footer;
  return (
    <footer className="mt-10 border-t-2 border-dashed border-taro-2/50 pb-28 pt-10 sm:pb-12 lg:pr-28">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex gap-4">
          <Momo state="idle" size={72} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight text-ink">
              <span translate="no">Pīzhù 批注</span>
              <span className="ml-2 font-medium text-ink-3">{f.tagline}</span>
            </p>
            <p className={`mt-1.5 text-sm text-ink-2 ${locale === "en" ? "" : "font-kai text-[15px]"}`}>{f.made}</p>
            <p className="mt-3 inline-flex items-start gap-2 rounded-2xl bg-mango/40 px-3 py-2 text-sm text-ink">
              <Trophy size={17} weight="fill" className="mt-0.5 shrink-0 text-worth" aria-hidden />
              <span>{f.challenge}</span>
            </p>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <nav aria-label="Links" className="flex flex-wrap gap-2">
            {(
              [
                ["repo", f.repo, LINKS.repo, true],
                ["dev", f.dev, LINKS.dev, false],
                ["challenge", f.challengeLink, LINKS.challenge, false],
              ] as const
            ).map(([k, label, href, gh]) => (
              <a
                key={k}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-rule bg-card px-3.5 py-1.5 font-medium text-ink-2 transition-colors hover:border-taro-2 hover:text-taro"
              >
                {gh && <GithubLogo size={15} aria-hidden />}
                {label}
                <ArrowUpRight size={13} aria-hidden />
              </a>
            ))}
          </nav>
          <p className="text-ink-3">{f.powered}</p>
          <p className="text-ink-3">{f.note}</p>
        </div>
      </div>
    </footer>
  );
}
