"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/context";
import { Momo } from "./Momo";

/** Mòmo presses a 好 seal when every must-fix note is handled. Gold and cinnabar: celebration colours. */
// Deterministic scatter (render stays pure): a cheap hash per particle index.
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const BITS = Array.from({ length: 22 }, (_, i) => ({
  x: (rand(i, 1) - 0.5) * 320,
  y: -80 - rand(i, 2) * 160,
  r: rand(i, 3) * 260 - 130,
  c: i % 3 === 0 ? "var(--gold)" : "var(--vermilion)",
  s: 5 + rand(i, 4) * 5,
}));

export function Celebrate({ show, onDone }: { show: boolean; onDone: () => void }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!show) return;
    const id = setTimeout(onDone, 4200);
    return () => clearTimeout(id);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          onClick={onDone}
          className="fixed inset-x-4 bottom-6 z-40 mx-auto flex max-w-md cursor-pointer items-center gap-4 rounded-[1.5rem] border border-rule bg-card p-4 shadow-soft"
        >
          {!reduce &&
            BITS.map((b, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="pointer-events-none absolute left-14 top-8 rounded-[2px]"
                style={{ width: b.s, height: b.s, background: b.c }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{ x: b.x, y: [0, b.y, b.y + 220], opacity: [1, 1, 0], rotate: b.r }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          <Momo state="stamp" size={72} />
          <div>
            <p className="font-kai text-2xl text-vermilion">{t.celebrate.title}</p>
            <p className="text-sm text-ink-2">{t.celebrate.body}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
