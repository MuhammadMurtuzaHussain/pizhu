// The error taxonomy Pīzhù teaches from. Each category pairs a UK/IE academic
// convention with the Mandarin-L1 transfer pattern that usually causes it.
// Copy here is shown in the glossary and the "My habits" mini-lessons.

export const CATEGORY_IDS = [
  "articles",
  "countability",
  "verb_form",
  "sentence_boundary",
  "topic_comment",
  "connectors",
  "register",
  "hedging",
  "set_phrases",
  "collocation",
  "uk_conventions",
  "referencing",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

type Tri = { en: string; "zh-Hans": string; "zh-Hant": string };

export type Category = {
  id: CategoryId;
  label: Tri;
  /** One-line rule of thumb, shown on cards and in the glossary. */
  rule: Tri;
  /** Why a Mandarin speaker's instinct leads here, framed kindly, not as a deficit. */
  why: Tri;
  example: { wrong: string; better: string };
};

export const CATEGORIES: Record<CategoryId, Category> = {
  articles: {
    id: "articles",
    label: { en: "Articles (a / an / the)", "zh-Hans": "冠词", "zh-Hant": "冠詞" },
    rule: {
      en: "Singular countable nouns need a determiner; use 'the' for something specific or already mentioned, nothing for general plural/uncountable ideas.",
      "zh-Hans": "单数可数名词前需要限定词；特指或前文提到过的用 the，泛指复数或不可数概念时不加冠词。",
      "zh-Hant": "單數可數名詞前需要限定詞；特指或前文提過的用 the，泛指複數或不可數概念時不加冠詞。",
    },
    why: {
      en: "Mandarin has no articles at all: specificity comes from context or words like 这/那. So English articles feel optional, but markers read them as grammar errors.",
      "zh-Hans": "中文没有冠词，特指靠语境或“这/那”表达，所以英语冠词感觉可有可无。但阅卷老师会把漏用或误用当作语法错误。",
      "zh-Hant": "中文沒有冠詞，特指靠語境或「這/那」表達，所以英文冠詞感覺可有可無。但閱卷老師會把漏用或誤用當作文法錯誤。",
    },
    example: { wrong: "The society is changing rapidly.", better: "Society is changing rapidly." },
  },
  countability: {
    id: "countability",
    label: { en: "Plurals & countability", "zh-Hans": "单复数与可数性", "zh-Hant": "單複數與可數性" },
    rule: {
      en: "Some academic nouns are uncountable (research, evidence, information, knowledge, feedback) and never take -s.",
      "zh-Hans": "一些学术名词不可数（research、evidence、information、knowledge、feedback），不能加 -s。",
      "zh-Hant": "一些學術名詞不可數（research、evidence、information、knowledge、feedback），不能加 -s。",
    },
    why: {
      en: "Chinese nouns don't change form for number (一个研究 / 很多研究), so the plural -s and the countable/uncountable split have no direct equivalent.",
      "zh-Hans": "中文名词没有单复数变化（一个研究 / 很多研究），所以英语的 -s 和可数/不可数区分没有直接对应。",
      "zh-Hant": "中文名詞沒有單複數變化（一個研究 / 很多研究），所以英文的 -s 和可數/不可數區分沒有直接對應。",
    },
    example: { wrong: "Many researches show that…", better: "Much research shows that… / Many studies show that…" },
  },
  verb_form: {
    id: "verb_form",
    label: { en: "Tense & agreement", "zh-Hans": "时态与主谓一致", "zh-Hant": "時態與主謂一致" },
    rule: {
      en: "Keep tense consistent and make verbs agree with their subject, especially reporting verbs: 'Smith (2020) argues'.",
      "zh-Hans": "保持时态一致，动词要与主语一致，尤其是转述动词：Smith (2020) argues。",
      "zh-Hant": "保持時態一致，動詞要與主語一致，尤其是轉述動詞：Smith (2020) argues。",
    },
    why: {
      en: "Mandarin verbs don't conjugate; time is shown with words like 了/过/将. English packs that information into the verb itself.",
      "zh-Hans": "中文动词没有变位，时间靠“了/过/将”等词表达；英语则把这些信息放在动词形式里。",
      "zh-Hant": "中文動詞沒有變位，時間靠「了/過/將」等詞表達；英文則把這些資訊放在動詞形式裡。",
    },
    example: { wrong: "Smith (2020) argue that media shape opinion.", better: "Smith (2020) argues that the media shape opinion." },
  },
  sentence_boundary: {
    id: "sentence_boundary",
    label: { en: "Run-ons & comma splices", "zh-Hans": "逗号粘连 / 一逗到底", "zh-Hant": "逗號粘連 / 一逗到底" },
    rule: {
      en: "A comma cannot join two complete sentences. Use a full stop, a semicolon, or a linking word (because, although, which).",
      "zh-Hans": "逗号不能连接两个完整的句子。请用句号、分号，或连接词（because、although、which）。",
      "zh-Hant": "逗號不能連接兩個完整的句子。請用句號、分號，或連接詞（because、although、which）。",
    },
    why: {
      en: "In Chinese, one sentence can flow through many commas until the whole idea is complete (一逗到底). English treats each independent clause as its own unit.",
      "zh-Hans": "中文里一句话可以用很多逗号一直写到意思完整（一逗到底）；英语要求每个独立分句单独成句或用连接词连接。",
      "zh-Hant": "中文裡一句話可以用很多逗號一直寫到意思完整（一逗到底）；英文要求每個獨立子句單獨成句或用連接詞連接。",
    },
    example: { wrong: "Social media is popular, many students use it every day, it affects their study.", better: "Social media is popular. Many students use it every day, which affects their study." },
  },
  topic_comment: {
    id: "topic_comment",
    label: { en: "Topic-first structure", "zh-Hans": "话题优先句式", "zh-Hant": "話題優先句式" },
    rule: {
      en: "English sentences usually start with the grammatical subject. Avoid stating a topic, then restarting with 'it/we'.",
      "zh-Hans": "英语句子通常以语法主语开头。避免先抛出话题，再用 it/we 重新开始。",
      "zh-Hant": "英文句子通常以語法主語開頭。避免先拋出話題，再用 it/we 重新開始。",
    },
    why: {
      en: "Mandarin is topic-prominent: '这个问题，我们应该重视' is perfectly natural. Translated directly it becomes 'This problem, we should pay attention.'",
      "zh-Hans": "中文是话题优先语言：“这个问题，我们应该重视”很自然，但直译成英语就是 “This problem, we should pay attention.”",
      "zh-Hant": "中文是話題優先語言：「這個問題，我們應該重視」很自然，但直譯成英文就是 “This problem, we should pay attention.”",
    },
    example: { wrong: "As for this phenomenon, it has many reasons.", better: "There are several reasons for this phenomenon." },
  },
  connectors: {
    id: "connectors",
    label: { en: "Linking words", "zh-Hans": "连接词误用", "zh-Hant": "連接詞誤用" },
    rule: {
      en: "'On the other hand' needs a real contrast; 'Besides', 'What's more', 'In a word' and 'Last but not least' sound spoken or dated in UK essays.",
      "zh-Hans": "On the other hand 需要真正的对比；Besides、What's more、In a word、Last but not least 在英国学术写作中显得口语化或过时。",
      "zh-Hant": "On the other hand 需要真正的對比；Besides、What's more、In a word、Last but not least 在英國學術寫作中顯得口語化或過時。",
    },
    why: {
      en: "Many of these were taught as essay 'templates' for exams like 高考 and IELTS, mapped one-to-one from 另一方面 / 此外 / 总之. UK markers read them differently.",
      "zh-Hans": "这些常作为高考、雅思的作文“模板”教授，并与“另一方面 / 此外 / 总之”一一对应。英国阅卷老师的理解却不一样。",
      "zh-Hant": "這些常作為學測、雅思的作文「模板」教授，並與「另一方面 / 此外 / 總之」一一對應。英國閱卷老師的理解卻不一樣。",
    },
    example: { wrong: "In a word, social media has advantages and disadvantages.", better: "Overall, the evidence suggests that social media has mixed effects." },
  },
  register: {
    id: "register",
    label: { en: "Informal register", "zh-Hans": "语体过于口语", "zh-Hant": "語體過於口語" },
    rule: {
      en: "Prefer precise, formal words: 'a lot of' → considerable/many, 'get' → obtain/become, 'kids' → children. No contractions or rhetorical questions.",
      "zh-Hans": "使用准确、正式的词：a lot of → considerable/many，get → obtain/become，kids → children。避免缩写和反问句。",
      "zh-Hant": "使用準確、正式的詞：a lot of → considerable/many，get → obtain/become，kids → children。避免縮寫和反問句。",
    },
    why: {
      en: "Much English is learned from films, social media and conversation. Chinese also marks formality differently (书面语 vs 口语), so the English boundary is easy to miss.",
      "zh-Hans": "很多英语是从影视、社交媒体和日常对话中学到的；中文区分书面语和口语的方式也不同，因此英语的正式度界线容易被忽略。",
      "zh-Hant": "很多英文是從影視、社群媒體和日常對話中學到的；中文區分書面語和口語的方式也不同，因此英文的正式度界線容易被忽略。",
    },
    example: { wrong: "A lot of kids get addicted to TikTok.", better: "Many children develop compulsive patterns of TikTok use." },
  },
  hedging: {
    id: "hedging",
    label: { en: "Hedging & overclaiming", "zh-Hans": "措辞过于绝对", "zh-Hant": "措辭過於絕對" },
    rule: {
      en: "UK academic writing is cautious: 'proves' → suggests/indicates, 'everyone knows' → it is widely argued, add may/tend to/appears.",
      "zh-Hans": "英国学术写作讲究谨慎：proves → suggests/indicates，everyone knows → it is widely argued，多用 may / tend to / appears。",
      "zh-Hant": "英國學術寫作講究謹慎：proves → suggests/indicates，everyone knows → it is widely argued，多用 may / tend to / appears。",
    },
    why: {
      en: "Confident, definitive statements (众所周知、毫无疑问) are often valued in Chinese argumentative writing. In UK essays they read as unsupported claims.",
      "zh-Hans": "中文议论文常鼓励“众所周知”“毫无疑问”这类肯定表达；在英国论文中，它们会被视为缺乏证据的断言。",
      "zh-Hant": "中文議論文常鼓勵「眾所周知」「毫無疑問」這類肯定表達；在英國論文中，它們會被視為缺乏證據的斷言。",
    },
    example: { wrong: "This proves that advertising controls consumers.", better: "This suggests that advertising may influence consumer behaviour." },
  },
  set_phrases: {
    id: "set_phrases",
    label: { en: "Translated set phrases", "zh-Hans": "中式套话", "zh-Hant": "中式套話" },
    rule: {
      en: "Openers like 'With the development of society', 'Nowadays', 'more and more' and 'plays an important role' are vague. Say exactly what changed and when.",
      "zh-Hans": "With the development of society、Nowadays、more and more、plays an important role 等开头很空泛。请具体说明变化是什么、何时发生。",
      "zh-Hant": "With the development of society、Nowadays、more and more、plays an important role 等開頭很空泛。請具體說明變化是什麼、何時發生。",
    },
    why: {
      en: "These are direct translations of 随着社会的发展 / 如今 / 越来越多 / 起着重要作用. Good style in Chinese essays, but filler to a UK marker.",
      "zh-Hans": "这些是“随着社会的发展 / 如今 / 越来越多 / 起着重要作用”的直译。在中文作文里是好文笔，但在英国阅卷老师眼中是空话。",
      "zh-Hant": "這些是「隨著社會的發展 / 如今 / 越來越多 / 起著重要作用」的直譯。在中文作文裡是好文筆，但在英國閱卷老師眼中是空話。",
    },
    example: { wrong: "With the development of society, more and more people use smartphones.", better: "Smartphone ownership among UK adults has risen sharply over the past decade (Source, Year)." },
  },
  collocation: {
    id: "collocation",
    label: { en: "Word choice & collocation", "zh-Hans": "词语搭配", "zh-Hant": "詞語搭配" },
    rule: {
      en: "Some words only sound right in pairs: conduct (not make) research, acquire (not learn) knowledge, raise (not improve) awareness.",
      "zh-Hans": "有些词必须固定搭配：conduct research（不是 make），acquire knowledge（不是 learn），raise awareness（不是 improve）。",
      "zh-Hant": "有些詞必須固定搭配：conduct research（不是 make），acquire knowledge（不是 learn），raise awareness（不是 improve）。",
    },
    why: {
      en: "Chinese verbs like 做 / 学 / 提高 cover many English verbs, so the dictionary translation is often grammatical but unnatural.",
      "zh-Hans": "中文的“做 / 学 / 提高”对应很多英语动词，所以词典直译往往语法正确但不地道。",
      "zh-Hant": "中文的「做 / 學 / 提高」對應很多英文動詞，所以字典直譯往往文法正確但不道地。",
    },
    example: { wrong: "I will make a research to learn more knowledge.", better: "This study investigates…" },
  },
  uk_conventions: {
    id: "uk_conventions",
    label: { en: "UK / Irish conventions", "zh-Hans": "英式规范", "zh-Hant": "英式規範" },
    rule: {
      en: "Use British spelling (organise, behaviour, centre, programme), single quotation marks, and day-month-year dates. Check your module's guidance on 'I'.",
      "zh-Hans": "使用英式拼写（organise、behaviour、centre、programme）、单引号、日-月-年日期格式。第一人称“I”是否可用请看课程要求。",
      "zh-Hant": "使用英式拼寫（organise、behaviour、centre、programme）、單引號、日-月-年日期格式。第一人稱「I」是否可用請看課程要求。",
    },
    why: {
      en: "Most English taught in China and Taiwan follows American spelling and style, and spellcheckers often default to US English.",
      "zh-Hans": "中国大陆和台湾的英语教学大多采用美式拼写和规范，拼写检查也常默认美式英语。",
      "zh-Hant": "中國大陸和台灣的英文教學大多採用美式拼寫和規範，拼字檢查也常預設美式英文。",
    },
    example: { wrong: "The program helped organize the center's behavior policy.", better: "The programme helped organise the centre's behaviour policy." },
  },
  referencing: {
    id: "referencing",
    label: { en: "Referencing (Harvard)", "zh-Hans": "引用格式（哈佛）", "zh-Hant": "引用格式（哈佛）" },
    rule: {
      en: "Cite every idea that isn't yours: (Surname, Year) or Surname (Year); add page numbers for direct quotes; every in-text citation must appear in the reference list.",
      "zh-Hans": "非原创观点都要标注：(Surname, Year) 或 Surname (Year)；直接引用要加页码；正文引用必须都出现在参考文献列表中。",
      "zh-Hant": "非原創觀點都要標註：(Surname, Year) 或 Surname (Year)；直接引用要加頁碼；正文引用必須都出現在參考文獻列表中。",
    },
    why: {
      en: "Citation norms in many Chinese school contexts are looser, and UK universities treat missing citations as academic misconduct, even when unintentional.",
      "zh-Hans": "许多中文教育环境对引用的要求较宽松，而英国大学会把漏标引用视为学术不端，即使是无心之失。",
      "zh-Hant": "許多中文教育環境對引用的要求較寬鬆，而英國大學會把漏標引用視為學術不端，即使是無心之失。",
    },
    example: { wrong: "According to research, TikTok reduces attention span.", better: "Some studies associate short-form video with reduced sustained attention (Author, Year)." },
  },
};

export const SEVERITIES = ["must_fix", "worth_fixing", "style"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const DIMENSIONS = ["argument", "structure", "language", "referencing"] as const;
export type Dimension = (typeof DIMENSIONS)[number];
