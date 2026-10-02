"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import { useMomo } from "@/lib/momo";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/taxonomy";
import { Momo } from "./Momo";

/** Mòmo lives in the corner of every screen, reacting to what you do. Click for a tip. */
export function MomoDock({ hidden = false }: { hidden?: boolean }) {
  const { t, locale, script } = useI18n();
  const { mood, message, say, hush, setMood } = useMomo();
  const reduce = useReducedMotion();
  const tipIndex = useRef(0);

  // Doze off after a long quiet spell; wake on any interaction.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (mood === "idle") setMood("sleepy");
      }, 120_000);
    };
    const wake = () => {
      if (mood === "sleepy") setMood("idle");
      arm();
    };
    arm();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [mood, setMood]);

  const tip = () => {
    if (message) return hush();
    const c = CATEGORIES[CATEGORY_IDS[tipIndex.current++ % CATEGORY_IDS.length]];
    const zh = locale === "en" ? script : locale;
    say(`${t.dock.tip}: ${locale === "en" ? c.rule.en : c.why[zh]}`, undefined, 9000);
  };

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-20 flex items-end gap-2 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message.text}
            role="status"
            aria-live="polite"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="pointer-events-auto relative mb-10 max-w-[17rem] rounded-[1.25rem] rounded-br-md border border-rule bg-card px-4 py-3 text-sm leading-snug text-ink shadow-lift"
          >
            <p className={locale === "en" ? "" : "font-kai text-[15px]"}>{message.text}</p>
            {message.action && (
              <button
                onClick={() => {
                  message.action!.onClick();
                  hush();
                }}
                className="mt-2.5 rounded-full bg-taro px-3.5 py-1.5 text-xs font-semibold text-on-taro transition-transform active:scale-[0.97]"
              >
                {message.action.label}
              </button>
            )}
            <button onClick={hush} aria-label={t.results.close} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-ink-3 hover:bg-paper-2">
              <X size={12} aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={tip}
        aria-label={t.dock.open}
        whileHover={reduce ? undefined : { scale: 1.05, rotate: -3 }}
        whileTap={{ scale: 0.95 }}
        className="sticker pointer-events-auto grid h-[76px] w-[76px] place-items-center rounded-full bg-taro-soft sm:h-[88px] sm:w-[88px]"
      >
        <Momo state={mood} size={70} label="Mòmo" />
      </motion.button>
    </div>
  );
}
