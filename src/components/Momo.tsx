"use client";

import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from "motion/react";

// 墨墨 Mòmo, the ink panda. Black and white is literally 墨 ink on 宣纸 paper,
// and the vermilion brush is the 朱批 correction ink. Built from simple shapes
// so each mood can animate; the panda keeps its own fixed colours in dark mode.

export type MomoState = "idle" | "reading" | "thinking" | "happy" | "stamp" | "sleepy";

const INK = "#23252a";
const FUR = "#fbfaf6";
const CINNABAR = "#c8341f";
const BAMBOO = "#9b7a48";

const spring = { type: "spring" as const, stiffness: 140, damping: 16 };

export function Momo({
  state = "idle",
  size = 160,
  className = "",
  label = "Mòmo the ink panda",
}: {
  state?: MomoState;
  size?: number;
  className?: string;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const loop = (v: TargetAndTransition): TargetAndTransition => (reduce ? {} : v);

  const pupilAnim: TargetAndTransition =
    state === "reading"
      ? loop({ x: [-2.5, 2.5, -2.5], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } })
      : state === "thinking"
        ? { x: -1.5, y: -3 }
        : { x: 0, y: 0 };

  const openEyes = state === "idle" || state === "reading" || state === "thinking";

  return (
    <motion.svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`overflow-visible ${className}`}
      animate={
        state === "happy" || state === "stamp"
          ? loop({ y: [0, -6, 0], transition: { duration: 0.6, repeat: state === "happy" ? Infinity : 0, repeatDelay: 1.4 } })
          : loop({ y: [0, -1.5, 0], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } })
      }
    >
      {/* ground shadow */}
      <ellipse cx="80" cy="152" rx="42" ry="5" fill={INK} opacity="0.08" />

      {/* feet and body */}
      <ellipse cx="60" cy="146" rx="14" ry="8.5" fill={INK} />
      <ellipse cx="100" cy="146" rx="14" ry="8.5" fill={INK} />
      <ellipse cx="80" cy="122" rx="40" ry="28" fill={FUR} stroke={INK} strokeOpacity="0.14" strokeWidth="1.5" />

      {/* ears sit behind the head */}
      <motion.circle
        cx="42"
        cy="34"
        r="15"
        fill={INK}
        animate={state === "happy" ? loop({ rotate: [0, -10, 0], transition: { duration: 0.6, repeat: Infinity, repeatDelay: 1.4 } }) : { rotate: 0 }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
      <motion.circle
        cx="118"
        cy="34"
        r="15"
        fill={INK}
        animate={state === "happy" ? loop({ rotate: [0, 10, 0], transition: { duration: 0.6, repeat: Infinity, repeatDelay: 1.4 } }) : { rotate: 0 }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />

      {/* head */}
      <ellipse cx="80" cy="70" rx="47" ry="42" fill={FUR} stroke={INK} strokeOpacity="0.14" strokeWidth="1.5" />

      {/* eye patches */}
      <ellipse cx="60" cy="72" rx="12.5" ry="15.5" transform="rotate(28 60 72)" fill={INK} />
      <ellipse cx="100" cy="72" rx="12.5" ry="15.5" transform="rotate(-28 100 72)" fill={INK} />

      {/* eyes */}
      <AnimatePresence mode="wait" initial={false}>
        {openEyes ? (
          <motion.g
            key="open"
            initial={{ opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scaleY: [1, 1, 0.1, 1] }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0.1 } : { scaleY: { duration: 0.35, times: [0, 0.4, 0.6, 1], repeat: Infinity, repeatDelay: 3.6 }, opacity: { duration: 0.15 } }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <circle cx="62" cy="70" r="6" fill={FUR} />
            <circle cx="98" cy="70" r="6" fill={FUR} />
            <motion.g animate={pupilAnim} transition={spring}>
              <circle cx="62.5" cy="70.5" r="3.4" fill={INK} />
              <circle cx="98.5" cy="70.5" r="3.4" fill={INK} />
              <circle cx="63.6" cy="69.2" r="1.1" fill={FUR} />
              <circle cx="99.6" cy="69.2" r="1.1" fill={FUR} />
            </motion.g>
          </motion.g>
        ) : state === "sleepy" ? (
          <motion.g key="sleepy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <path d="M56 71 Q62 76 68 71" stroke={FUR} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M92 71 Q98 76 104 71" stroke={FUR} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </motion.g>
        ) : (
          <motion.g key="smile" initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <path d="M56 73 Q62 64 68 73" stroke={FUR} strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M92 73 Q98 64 104 73" stroke={FUR} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          </motion.g>
        )}
      </AnimatePresence>

      {/* blush, nose, mouth */}
      <circle cx="46" cy="92" r="7" fill={CINNABAR} opacity="0.22" />
      <circle cx="114" cy="92" r="7" fill={CINNABAR} opacity="0.22" />
      <ellipse cx="80" cy="86" rx="6" ry="4.2" fill={INK} />
      {state === "happy" || state === "stamp" ? (
        <path d="M73 92 Q80 101 87 92 Z" fill={INK} />
      ) : state === "thinking" ? (
        <path d="M76 95 Q80 93 84 95" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M74 93 Q77 97 80 93 Q83 97 86 93" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* right paw with the vermilion brush */}
      <motion.g
        animate={state === "reading" ? loop({ rotate: [0, -8, 0, -5, 0], transition: { duration: 1.4, repeat: Infinity } }) : { rotate: 0 }}
        style={{ transformBox: "fill-box", transformOrigin: "30% 70%" }}
      >
        <line x1="130" y1="90" x2="111" y2="134" stroke={BAMBOO} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M111 134 Q106 146 104 150 Q112 146 115 136 Z" fill={CINNABAR} />
        <ellipse cx="116" cy="118" rx="12" ry="15" transform="rotate(28 116 118)" fill={INK} />
      </motion.g>

      {/* left paw: holds the seal when stamping */}
      <motion.g
        animate={state === "stamp" ? { y: [-14, 6, 0], transition: { duration: 0.7, times: [0, 0.6, 1] } } : { y: 0 }}
      >
        <ellipse cx="44" cy="118" rx="12" ry="15" transform="rotate(-28 44 118)" fill={INK} />
        {state === "stamp" && (
          <g>
            <rect x="22" y="128" width="26" height="22" rx="3" fill={CINNABAR} />
            <text x="35" y="144" textAnchor="middle" fontSize="15" fontWeight="700" fill={FUR} style={{ fontFamily: "var(--font-kai)" }}>
              好
            </text>
          </g>
        )}
      </motion.g>

      {/* thought and sleep marks */}
      <AnimatePresence>
        {state === "thinking" && (
          <motion.g key="dots" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <circle cx="132" cy="22" r="3" fill={INK} opacity="0.5" />
            <circle cx="142" cy="14" r="4" fill={INK} opacity="0.5" />
            <circle cx="153" cy="5" r="5" fill={INK} opacity="0.5" />
          </motion.g>
        )}
        {state === "sleepy" && (
          <motion.text
            key="z"
            x="132"
            y="26"
            fontSize="16"
            fontWeight="600"
            fill={INK}
            opacity={0.5}
            initial={{ opacity: 0 }}
            animate={reduce ? { opacity: 0.5 } : { opacity: [0, 0.6, 0], y: [0, -10, -18] }}
            transition={{ duration: 2.6, repeat: Infinity }}
          >
            z
          </motion.text>
        )}
      </AnimatePresence>
    </motion.svg>
  );
}
