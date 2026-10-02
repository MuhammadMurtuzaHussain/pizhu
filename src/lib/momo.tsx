"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { MomoState } from "@/components/Momo";

// Mòmo's mood and speech bubble, shared across the app so any screen can make
// Mòmo react (reading, cheering, stamping) without prop drilling.

export type MomoMessage = { text: string; action?: { label: string; onClick: () => void } };

type MomoCtx = {
  mood: MomoState;
  message: MomoMessage | null;
  /** Show a bubble. `ms` auto-hides it; omit to keep it until dismissed. */
  say: (message: MomoMessage | string, mood?: MomoState, ms?: number) => void;
  setMood: (m: MomoState) => void;
  /** A short reaction: switch mood briefly, then return to the resting mood. */
  react: (m: MomoState, ms?: number) => void;
  hush: () => void;
};

const Ctx = createContext<MomoCtx | null>(null);

export function MomoProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<MomoState>("idle");
  const [message, setMessage] = useState<MomoMessage | null>(null);
  const resting = useRef<MomoState>("idle");
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMood = useCallback((m: MomoState) => {
    resting.current = m;
    if (moodTimer.current) clearTimeout(moodTimer.current);
    setMoodState(m);
  }, []);

  const react = useCallback((m: MomoState, ms = 1400) => {
    if (moodTimer.current) clearTimeout(moodTimer.current);
    setMoodState(m);
    moodTimer.current = setTimeout(() => setMoodState(resting.current), ms);
  }, []);

  const say = useCallback(
    (msg: MomoMessage | string, m?: MomoState, ms?: number) => {
      if (msgTimer.current) clearTimeout(msgTimer.current);
      setMessage(typeof msg === "string" ? { text: msg } : msg);
      if (m) setMood(m);
      if (ms) msgTimer.current = setTimeout(() => setMessage(null), ms);
    },
    [setMood],
  );

  const hush = useCallback(() => {
    if (msgTimer.current) clearTimeout(msgTimer.current);
    setMessage(null);
  }, []);

  return <Ctx.Provider value={{ mood, message, say, setMood, react, hush }}>{children}</Ctx.Provider>;
}

export function useMomo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMomo outside MomoProvider");
  return v;
}
