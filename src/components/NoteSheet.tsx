"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/context";
import type { Annotation } from "@/lib/schema";
import { NoteCard } from "./NoteCard";

/** Mobile: tapping a highlight opens its note in a bottom sheet, with next / previous. */
export function NoteSheet({
  note,
  index,
  total,
  resolved,
  onPrev,
  onNext,
  onClose,
  onResolve,
  onDismiss,
}: {
  note: Annotation | null;
  index: number;
  total: number;
  resolved: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {note && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-30 bg-ink/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t.card.hint}
            className="fixed inset-x-0 bottom-0 z-30 max-h-[75dvh] overflow-y-auto overscroll-contain select-none sm:select-text rounded-t-[1.75rem] border-t border-rule bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-rule" />
            <div className="mb-3 flex items-center justify-between text-xs text-ink-3">
              <span className="tabular-nums">
                {index + 1} / {total}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={onPrev} aria-label={t.results.prev} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper-2">
                  <CaretLeft size={18} aria-hidden />
                </button>
                <button onClick={onNext} aria-label={t.results.next} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper-2">
                  <CaretRight size={18} aria-hidden />
                </button>
                <button onClick={onClose} aria-label={t.results.close} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper-2">
                  <X size={18} aria-hidden />
                </button>
              </div>
            </div>
            <NoteCard a={note} active resolved={resolved} flat onActivate={() => {}} onResolve={onResolve} onDismiss={onDismiss} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
