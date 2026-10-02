"use client";

import type { CategoryId } from "./taxonomy";

// "My habits": category counts per check, kept only in this browser.
// No essay text is ever stored — just numbers.

export type HabitSession = { at: string; counts: Partial<Record<CategoryId, number>> };

const KEY = "pizhu.habits.v1";

export function loadHabits(): HabitSession[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function recordHabits(counts: Partial<Record<CategoryId, number>>) {
  if (!Object.keys(counts).length) return;
  try {
    const all = loadHabits();
    all.push({ at: new Date().toISOString(), counts });
    localStorage.setItem(KEY, JSON.stringify(all.slice(-200)));
  } catch {}
}

export function clearHabits() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function totals(sessions: HabitSession[], days = 30) {
  const since = Date.now() - days * 86_400_000;
  const t: Partial<Record<CategoryId, number>> = {};
  for (const s of sessions) {
    if (new Date(s.at).getTime() < since) continue;
    for (const [k, v] of Object.entries(s.counts)) t[k as CategoryId] = (t[k as CategoryId] ?? 0) + (v ?? 0);
  }
  return Object.entries(t).sort((a, b) => b[1] - a[1]) as [CategoryId, number][];
}
