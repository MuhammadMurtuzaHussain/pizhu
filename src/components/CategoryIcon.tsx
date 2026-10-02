"use client";

import {
  ArrowsLeftRight,
  BookOpenText,
  ChatsCircle,
  Clock,
  GlobeHemisphereWest,
  LinkSimple,
  ListNumbers,
  PuzzlePiece,
  Quotes,
  Scales,
  Scissors,
  TextAa,
  type IconProps,
} from "@phosphor-icons/react";
import type { CategoryId } from "@/lib/taxonomy";

const ICONS: Record<CategoryId, React.ComponentType<IconProps>> = {
  articles: TextAa,
  countability: ListNumbers,
  verb_form: Clock,
  sentence_boundary: Scissors,
  topic_comment: ArrowsLeftRight,
  connectors: LinkSimple,
  register: ChatsCircle,
  hedging: Scales,
  set_phrases: Quotes,
  collocation: PuzzlePiece,
  uk_conventions: GlobeHemisphereWest,
  referencing: BookOpenText,
};

export function CategoryIcon({ id, ...props }: { id: CategoryId } & IconProps) {
  const Icon = ICONS[id];
  return <Icon weight="light" aria-hidden {...props} />;
}
