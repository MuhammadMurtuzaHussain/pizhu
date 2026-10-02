import type { CategoryId } from "@/lib/taxonomy";

// Hand-written paragraphs for this project, each seeded with known Mandarin-L1
// patterns. `expect` lists the categories a good tutor should catch; `clean`
// paragraphs should get few or no must-fix notes (tests over-flagging).

export type Fixture = { id: string; text: string; expect: CategoryId[]; clean?: boolean };

export const FIXTURES: Fixture[] = [
  {
    id: "articles-1",
    text: "The society has become more dependent on internet. Government should provide the better education about the media literacy for young people.",
    expect: ["articles"],
  },
  {
    id: "countability-1",
    text: "Many researches have shown that audiences trust television more than social media. These evidences suggest that traditional media still have influence.",
    expect: ["countability"],
  },
  {
    id: "splice-1",
    text: "Influencers are very popular among students, they often promote products without saying it is an advertisement, this can mislead their followers.",
    expect: ["sentence_boundary"],
  },
  {
    id: "topic-1",
    text: "As for the problem of fake news, it is very serious in China and UK. This phenomenon, we should pay more attention to it.",
    expect: ["topic_comment"],
  },
  {
    id: "connectors-1",
    text: "Social media helps people connect with friends. On the other hand, it can be used for marketing. What's more, it is cheap. In a word, social media is useful.",
    expect: ["connectors"],
  },
  {
    id: "register-1",
    text: "A lot of kids get addicted to their phones and they can't stop scrolling. This is a really big problem for parents.",
    expect: ["register"],
  },
  {
    id: "hedging-1",
    text: "This study proves that celebrity endorsement always increases sales. Everyone knows that young consumers are easily influenced by advertising.",
    expect: ["hedging"],
  },
  {
    id: "setphrase-1",
    text: "With the development of society, more and more people use smartphones. Nowadays, mobile phones play an important role in our daily life.",
    expect: ["set_phrases"],
  },
  {
    id: "collocation-1",
    text: "In this essay I will make a research about how students learn knowledge from short videos and how universities can improve their awareness of misinformation.",
    expect: ["collocation"],
  },
  {
    id: "uk-1",
    text: "The program was designed to analyze how the organization's color scheme affected consumer behavior in the shopping center.",
    expect: ["uk_conventions"],
  },
  {
    id: "verb-1",
    text: "Hall (1980) argue that audiences decode media messages in different ways. In his model, the audience have three positions and each position give a different meaning.",
    expect: ["verb_form"],
  },
  {
    id: "referencing-1",
    text: "Research shows that 70% of young people get their news from social media. Experts believe this trend will continue in the future.",
    expect: ["referencing", "hedging"],
  },
  {
    id: "mixed-1",
    text: "Nowadays, the TikTok has became the most popular app in the world, it changes the way how the young people consume the informations. This proves that short video is the future of the media.",
    expect: ["set_phrases", "articles", "verb_form", "sentence_boundary", "countability", "hedging"],
  },
  {
    id: "clean-1",
    text: "Hall's (1980) encoding/decoding model suggests that audiences do not simply absorb media messages; rather, they may accept, negotiate or resist the meanings encoded by producers. This framework remains useful for analysing how international students interpret British news coverage.",
    expect: [],
    clean: true,
  },
  {
    id: "clean-2",
    text: "Whilst social media platforms have widened access to political information, several studies indicate that algorithmic curation may also narrow the range of viewpoints users encounter (Pariser, 2011; Bruns, 2019).",
    expect: [],
    clean: true,
  },
];
