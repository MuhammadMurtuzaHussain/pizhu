"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// Deterministic scatter (render stays pure): a cheap hash per particle index.
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const COLOURS = ["var(--taro)", "var(--mango)", "var(--berry)", "#2a2233"];
const BITS = Array.from({ length: 30 }, (_, i) => ({
  x: -40 - rand(i, 1) * 360,
  y: -120 - rand(i, 2) * 260,
  r: rand(i, 3) * 360 - 180,
  c: COLOURS[i % COLOURS.length],
  s: 6 + rand(i, 4) * 7,
  round: i % 4 === 3, // some are tapioca pearls
}));

/** Confetti (and a few pearls) bursting from Mòmo's dock. `fire` increments to trigger. */
export function Confetti({ fire }: { fire: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <AnimatePresence>
      {fire > 0 && (
        <motion.div key={fire} aria-hidden className="pointer-events-none fixed bottom-16 right-16 z-30" exit={{ opacity: 0 }}>
          {BITS.map((b, i) => (
            <motion.span
              key={i}
              className="absolute"
              style={{ width: b.s, height: b.s, background: b.c, borderRadius: b.round ? 999 : 2 }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: b.x, y: [0, b.y, b.y + 320], opacity: [1, 1, 0], rotate: b.r }}
              transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
