"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, Pause, Play, Sparkle } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import { Momo } from "./Momo";

// The first screen shows the product working before anyone pastes anything:
// a sentence types in, marker-pen underlines draw, margin notes pop in.

const SPAN1 = "With the development of society";
const SPAN2 = "TikTok, it changes";

// Timeline in ms. Each step unlocks the next piece of the demo.
const STEPS = [0, 1700, 2300, 3300, 3900, 9000];

export function DemoHero({ onStart, onSample }: { onStart: () => void; onSample: () => void }) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const final = reduce || paused ? 4 : step;

  // One timer per step; the last one restarts the loop by bumping `cycle`.
  useEffect(() => {
    if (reduce || paused) return;
    const last = STEPS.length - 1;
    const timers = STEPS.slice(1).map((ms, i) =>
      setTimeout(() => {
        if (i + 1 === last) {
          setStep(0);
          setCycle((c) => c + 1);
        } else setStep(i + 1);
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduce, paused, cycle]);

  const sentence = t.demo.sentence;
  const i1 = sentence.indexOf(SPAN1);
  const i2 = sentence.indexOf(SPAN2);

  return (
    <section className="grid items-center gap-10 py-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 lg:py-10">
      <div>
        <span className="sticker inline-flex -rotate-2 items-center gap-1.5 rounded-full bg-mango px-3.5 py-1 text-xs font-semibold text-[#3d2c00]">
          <Sparkle size={13} weight="fill" aria-hidden />
          {t.demo.eyebrow}
        </span>
        <h2 className="mt-5 text-5xl font-bold leading-[1.02] tracking-tight text-ink md:text-6xl">{t.demo.title}</h2>
        <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-ink-2">{t.demo.sub}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-3 rounded-full bg-taro py-2.5 pl-6 pr-2.5 text-base font-semibold text-on-taro shadow-lift transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {t.demo.cta}
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-y-0.5">
              <ArrowDown size={17} weight="bold" aria-hidden />
            </span>
          </button>
          <button
            onClick={onSample}
            className="rounded-full border-2 border-taro-2 px-5 py-3 text-base font-semibold text-taro transition-transform hover:bg-taro-soft active:scale-[0.98]"
          >
            {t.demo.sample}
          </button>
        </div>
      </div>

      {/* The demo card */}
      <div className="relative">
        <div className="grid-paper shadow-lift relative rotate-[0.6deg] rounded-[2rem] p-6 sm:p-8">
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? t.demo.play : t.demo.pause}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-paper-2 text-ink-3 hover:text-ink"
          >
            {paused ? <Play size={14} weight="fill" aria-hidden /> : <Pause size={14} weight="fill" aria-hidden />}
          </button>
          {/* Every piece of the demo keeps its final size from the start, so the
              card never grows or shrinks while it loops (no page jumping). */}
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="grid pt-6 font-serif text-[21px] leading-[1.75] text-ink">
              {/* Invisible copy of the finished sentence reserves the height. */}
              <p aria-hidden className="invisible col-start-1 row-start-1">
                <Marked sentence={sentence} i1={i1} i2={i2} show1 show2 animate={false} />
              </p>
              <p className="col-start-1 row-start-1">
                {final === 0 ? (
                  <Typed key={cycle} text={sentence} play={!reduce && !paused} />
                ) : (
                  <Marked sentence={sentence} i1={i1} i2={i2} show1={final >= 1} show2={final >= 3} animate />
                )}
              </p>
            </div>
            <div className="space-y-3 sm:pt-4">
              <DemoNote show={final >= 2} n={1} tone="worth" en={t.demo.n1} zh={t.demo.n1zh} zhFirst={locale !== "en"} />
              <DemoNote show={final >= 4} n={2} tone="must" en={t.demo.n2} zh={t.demo.n2zh} zhFirst={locale !== "en"} />
            </div>
          </div>
        </div>
        {/* Mòmo peeks over the top edge of the page. */}
        <div className="absolute -top-[68px] left-8 hidden sm:block">
          <Momo state={final >= 4 ? "happy" : "reading"} size={96} />
        </div>
      </div>
    </section>
  );
}

/** Typewriter for the demo sentence. */
function Typed({ text, play }: { text: string; play: boolean }) {
  const [n, setN] = useState(text.length);
  useEffect(() => {
    if (!play) return;
    setN(0); // eslint-disable-line react-hooks/set-state-in-effect
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setN(Math.min(i, text.length));
      if (i >= text.length) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, [play, text]);
  return (
    <span className="demo-typed">
      {text.slice(0, n)}
      {n < text.length && <span className="ml-0.5 inline-block h-6 w-0.5 translate-y-1 animate-pulse bg-taro" />}
    </span>
  );
}

function Marked({ sentence, i1, i2, show1, show2, animate }: { sentence: string; i1: number; i2: number; show1: boolean; show2: boolean; animate: boolean }) {
  return (
    <>
      {sentence.slice(0, i1)}
      <Underline on={show1} color="var(--worth)" n={1} animate={animate}>
        {SPAN1}
      </Underline>
      {sentence.slice(i1 + SPAN1.length, i2)}
      <Underline on={show2} color="var(--must)" n={2} animate={animate}>
        {SPAN2}
      </Underline>
      {sentence.slice(i2 + SPAN2.length)}
    </>
  );
}

/** A marker-pen underline that draws itself left to right, wrapping across lines. */
function Underline({ on, color, n, animate, children }: { on: boolean; color: string; n: number; animate: boolean; children: string }) {
  // Keep the number pearl glued to the last word so it never wraps onto a line by itself.
  const cut = children.lastIndexOf(" ");
  const head = cut === -1 ? "" : children.slice(0, cut + 1);
  const tail = cut === -1 ? children : children.slice(cut + 1);
  return (
    <>
      {head && (
        <UnderlineSpan on={on} color={color} animate={animate}>
          {head}
        </UnderlineSpan>
      )}
      <span className="whitespace-nowrap">
        <UnderlineSpan on={on} color={color} animate={animate}>
          {tail}
        </UnderlineSpan>
        {on && <Pearl n={n} on animate={animate} />}
      </span>
    </>
  );
}

function UnderlineSpan({ on, color, animate, children }: { on: boolean; color: string; animate: boolean; children: React.ReactNode }) {
  if (!animate)
    return (
      <span className="rounded-[3px]" style={{ backgroundImage: `linear-gradient(${color}, ${color})`, backgroundRepeat: "no-repeat", backgroundPosition: "0 100%", backgroundSize: "100% 3px" }}>
        {children}
      </span>
    );
  return (
    <motion.span
      className="rounded-[3px] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
      style={{ backgroundImage: `linear-gradient(${color}, ${color})`, backgroundRepeat: "no-repeat", backgroundPosition: "0 100%" }}
      initial={{ backgroundSize: "0% 3px" }}
      animate={{ backgroundSize: on ? "100% 3px" : "0% 3px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.span>
  );
}

function Pearl({ n, on, animate = true }: { n: number; on: boolean; animate?: boolean }) {
  return (
    <motion.span
      initial={animate ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.5 }}
      className="ml-1 inline-grid h-5 w-5 -translate-y-2 place-items-center rounded-full bg-ink align-middle font-sans text-[11px] font-bold text-white"
    >
      {n}
    </motion.span>
  );
}

function DemoNote({ show, n, tone, en, zh, zhFirst }: { show: boolean; n: number; tone: "worth" | "must"; en: string; zh: string; zhFirst: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden={!show}
      initial={false}
      animate={show ? { opacity: 1, x: 0, rotate: n === 1 ? -1.2 : 1 } : { opacity: 0, x: reduce ? 0 : 24, rotate: 2 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className={`sticker rounded-2xl p-3.5 text-[13px] leading-snug ${tone === "must" ? "bg-must-bg" : "bg-worth-bg"}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{n}</span>
        <span className={`text-xs font-semibold ${tone === "must" ? "text-must" : "text-worth"}`}>{tone === "must" ? "Must fix" : "Worth fixing"}</span>
      </div>
      <p className={zhFirst ? "font-kai text-[14.5px] text-ink" : "text-ink"}>{zhFirst ? zh : en}</p>
      <p className={zhFirst ? "mt-0.5 text-ink-2" : "mt-0.5 font-kai text-[14.5px] text-ink-2"}>{zhFirst ? en : zh}</p>
    </motion.div>
  );
}
