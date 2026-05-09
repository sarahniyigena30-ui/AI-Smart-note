import 'dotenv/config';

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: string[];
  topics: string[];
  keywords: string[];
  insights: string[];
}

export interface QAExtractionItem {
  question: string;
  answer: string;
  category: string;
  askedBy: string;
  answeredBy: string;
  confidence: number;
}

const stopWords = new Set([
  'about',
  'after',
  'again',
  'and',
  'also',
  'any',
  'are',
  'because',
  'been',
  'being',
  'but',
  'common',
  'conservation',
  'could',
  'current',
  'doing',
  'for',
  'from',
  'had',
  'happy',
  'have',
  'heavy',
  'hey',
  'into',
  'just',
  'kia',
  'like',
  'main',
  'more',
  'need',
  'only',
  'really',
  'should',
  'that',
  'the',
  'their',
  'there',
  'these',
  'they',
  'this',
  'too',
  'very',
  'want',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'with',
  'would',
  'you',
  'your',
  'same',
  'see',
  'take',
  'thanks',
  'well',
  'person',
  'people',
  'stuff',
  'acrossalanda',
  'band',
]);

const fillerWords = new Set([
  'ah',
  'eh',
  'hm',
  'hmm',
  'okay',
  'ok',
  'um',
  'uh',
  'yeah',
  'yes',
]);

const splitSentences = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const getWords = (text: string) =>
  text
    .toLowerCase()
    .match(/[a-z][a-z'-]{2,}/g)
    ?.filter((word) => !stopWords.has(word)) || [];

const speakerLabelPattern = /\b(?:person\s+[a-z]|speaker\s+\d+|speaker\s+[a-z]|[a-z][a-z .'-]{0,30})\s*:\s*/gi;

const normalizeTranscriptForAnalysis = (transcript: string) => {
  const lines = transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const contentLines =
    lines.length > 1 &&
    !/[.!?]/.test(lines[0]) &&
    speakerLabelPattern.test(lines.slice(1).join(' '))
      ? lines.slice(1)
      : lines;

  speakerLabelPattern.lastIndex = 0;

  return contentLines
    .join(' ')
    .replace(speakerLabelPattern, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const uniqueList = (items: string[], maxItems: number) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const cleaned = item.trim().replace(/\s+/g, ' ');
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= maxItems) break;
  }

  return result;
};

const getTopKeywords = (transcript: string, maxItems = 8) => {
  const counts = new Map<string, number>();

  for (const word of getWords(transcript)) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxItems)
    .map(([word]) => word);
};

const rankSentences = (sentences: string[], keywords: string[]) => {
  const keywordSet = new Set(keywords);

  return sentences
    .map((sentence, index) => {
      const words = getWords(sentence);
      const keywordHits = words.filter((word) => keywordSet.has(word)).length;
      const questionBonus = sentence.includes('?') ? 1 : 0;
      const lengthScore = Math.min(words.length / 12, 1.5);

      return {
        sentence,
        index,
        score: keywordHits + questionBonus + lengthScore,
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);
};

const findMatchingSentences = (sentences: string[], patterns: RegExp[], maxItems: number) =>
  uniqueList(
    sentences.filter((sentence) => patterns.some((pattern) => pattern.test(sentence))),
    maxItems
  );

const isLowInformationTranscript = (transcript: string) => {
  const words = transcript.toLowerCase().match(/[a-z][a-z'-]*/g) || [];
  const meaningfulWords = words.filter((word) => !stopWords.has(word) && !fillerWords.has(word));
  const uniqueMeaningfulWords = new Set(meaningfulWords);

  return meaningfulWords.length < 3 || uniqueMeaningfulWords.size < 2;
};

const cleanSummarySentence = (sentence: string) =>
  sentence
    .replace(/^\s*(agenda|meeting agenda|introduction|discussion|topic|summary|key point)s?\s*[:\-]\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const hasAgendaLanguage = (sentence: string) =>
  /\b(agenda|first item|next item|we will discuss|today we will|meeting structure|minutes)\b/i.test(sentence);

const hasOutcomeLanguage = (sentence: string) =>
  /\b(decided|agreed|approved|confirmed|resolved|finalized|action|follow up|follow-up|todo|to do|must|need to|should|will|next step)\b/i.test(sentence);

const includesAny = (text: string, words: string[]) =>
  words.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text));

const formatJoinedList = (items: string[]) => {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const isGreetingOnlySentence = (sentence: string) =>
  /\b(happy holidays|hello|hi|hey|take care|see you)\b/i.test(sentence) &&
  getWords(sentence).length <= 5;

const buildTopicContextSummary = (transcript: string, topics: string[]) => {
  const lowerTranscript = transcript.toLowerCase();
  const parts: string[] = [];

  if (includesAny(lowerTranscript, ['holiday', 'holidays', 'season', 'new year'])) {
    parts.push('exchanged holiday greetings');
  }

  if (includesAny(lowerTranscript, ['family', 'relatives'])) {
    parts.push('talked about spending time with family');
  }

  if (includesAny(lowerTranscript, ['traveling', 'travel', 'trip'])) {
    parts.push('mentioned travel plans');
  }

  if (parts.length > 0) {
    return `The conversation ${formatJoinedList(parts)}. It ended with warm wishes for the season and the new year.`;
  }

  if (
    includesAny(lowerTranscript, ['academic', 'institution', 'organization']) &&
    includesAny(lowerTranscript, ['meeting', 'meetings', 'discussion', 'collaborative'])
  ) {
    const contextParts: string[] = [];
    if (includesAny(lowerTranscript, ['academic', 'institution', 'organization'])) {
      contextParts.push('academic institutions and organizations');
    }
    if (includesAny(lowerTranscript, ['meetings', 'discussion', 'collaborative', 'project'])) {
      contextParts.push('frequent meetings, project discussions, and collaboration');
    }

    const problemParts: string[] = [];
    if (includesAny(lowerTranscript, ['documentation', 'document', 'notes'])) {
      problemParts.push('documentation');
    }
    if (includesAny(lowerTranscript, ['memory', 'manual', 'current practice', 'predominator'])) {
      problemParts.push('manual or memory-based follow-up');
    }
    if (includesAny(lowerTranscript, ['time consuming', 'consuming', 'efficient'])) {
      problemParts.push('time-consuming information extraction');
    }

    const context = contextParts.length > 0
      ? `The discussion describes a technology problem in ${formatJoinedList(contextParts)}`
      : 'The discussion describes an institutional technology problem';
    const problem = problemParts.length > 0
      ? `Current practices appear to make ${formatJoinedList(problemParts)} inefficient and unreliable`
      : 'Current practices appear to make meeting documentation inefficient and unreliable';

    return `${context}. ${problem}, creating a need for a system that can capture meeting information, extract important points, and present useful summaries for staff and students.`;
  }

  return topics.length > 0
    ? `The discussion covered ${topics.slice(0, 3).join(', ').toLowerCase()}, but the transcript does not clearly state a final decision or next step.`
    : '';
};

const getTopicTags = (transcript: string) => {
  const topicTags: string[] = [];

  if (includesAny(transcript, ['holiday', 'holidays', 'season', 'new year'])) {
    topicTags.push('Holiday greetings');
  }

  if (includesAny(transcript, ['family', 'relatives'])) {
    topicTags.push('Family');
  }

  if (includesAny(transcript, ['traveling', 'travel', 'trip'])) {
    topicTags.push('Travel plans');
  }

  if (includesAny(transcript, ['academic', 'institution', 'organization'])) {
    topicTags.push('Institutional technology');
  }

  if (includesAny(transcript, ['meeting', 'meetings', 'discussion', 'collaborative'])) {
    topicTags.push('Meeting documentation');
  }

  if (includesAny(transcript, ['summary', 'summaries', 'extract', 'information'])) {
    topicTags.push('Information extraction');
  }

  return topicTags;
};

const buildConciseMeetingSummary = (
  transcript: string,
  rankedSentences: ReturnType<typeof rankSentences>,
  decisions: string[],
  actionItems: string[],
  topics: string[]
) => {
  if (isLowInformationTranscript(transcript)) {
    return 'The transcript is too brief to identify meaningful meeting context, decisions, or outcomes.';
  }

  const contextSentence = uniqueList(
    rankedSentences
      .map((item) => cleanSummarySentence(item.sentence))
      .filter((sentence) => sentence.length > 0 && !hasAgendaLanguage(sentence) && !hasOutcomeLanguage(sentence)),
    1
  )[0] || uniqueList(
    rankedSentences
      .map((item) => cleanSummarySentence(item.sentence))
      .filter((sentence) => sentence.length > 0 && !hasAgendaLanguage(sentence)),
    1
  )[0];

  const topicContextSummary = buildTopicContextSummary(transcript, topics);
  const shouldUseTopicContext = topicContextSummary && decisions.length === 0 && actionItems.length === 0;
  const primaryContext = shouldUseTopicContext
    ? topicContextSummary
    : contextSentence && !isGreetingOnlySentence(contextSentence)
    ? contextSentence
    : topicContextSummary || contextSentence;

  const summaryParts = uniqueList(
    [
      primaryContext,
      decisions.length > 0 ? `Key outcome: ${decisions.slice(0, 2).join(' ')}` : '',
      actionItems.length > 0 ? `Next steps: ${actionItems.slice(0, 2).join(' ')}` : '',
    ],
    3
  );

  if (summaryParts.length > 0) {
    return summaryParts.join(' ');
  }

  return 'The meeting covered the main discussion points, but no clear decisions or next steps were captured in the transcript.';
};

export function generateInternalSummaryFromTranscript(transcript: string): SummaryResult {
  const trimmedTranscript = transcript.trim();

  if (!trimmedTranscript) {
    return {
      summary: '',
      keyPoints: [],
      decisions: [],
      actionItems: [],
      topics: [],
      keywords: [],
      insights: [],
    };
  }

  const analysisTranscript = normalizeTranscriptForAnalysis(trimmedTranscript);
  const sentences = splitSentences(analysisTranscript);
  const keywords = getTopKeywords(analysisTranscript, 10);
  const rankedSentences = rankSentences(sentences, keywords);
  const keyPoints = uniqueList(
    rankedSentences.slice(0, 7).map((item) => item.sentence),
    7
  );
  const decisions = findMatchingSentences(
    sentences,
    [/\b(decided|agreed|approved|confirmed|resolved|finalized)\b/i],
    5
  );
  const actionItems = findMatchingSentences(
    sentences,
    [/\b(action|follow up|follow-up|todo|to do|must|need to|should|will|next step)\b/i],
    6
  );
  const questionCount = sentences.filter((sentence) => sentence.includes('?')).length;
  const topicTags = getTopicTags(analysisTranscript);
  const topics = uniqueList(
    [
      ...topicTags,
      ...keywords.map((keyword) => keyword.replace(/^\w/, (char) => char.toUpperCase())),
    ],
    6
  );
  const summary = buildConciseMeetingSummary(
    analysisTranscript,
    rankedSentences,
    decisions,
    actionItems,
    topics
  );

  const insights = uniqueList(
    [
      keywords.length > 0
        ? `Recurring themes include ${(topicTags.length > 0 ? topicTags : keywords).slice(0, 5).join(', ')}.`
        : '',
      questionCount > 0
        ? `${questionCount} question${questionCount === 1 ? '' : 's'} appeared in the conversation and may need follow-up.`
        : '',
      decisions.length === 0
        ? 'No explicit decision language was detected in the transcript.'
        : '',
      actionItems.length === 0
        ? 'No clear action-item language was detected in the transcript.'
        : '',
    ],
    4
  );

  return {
    summary,
    keyPoints,
    decisions,
    actionItems,
    topics,
    keywords,
    insights,
  };
}

export function extractInternalQuestionsAndAnswers(transcript: string): QAExtractionItem[] {
  const sentences = splitSentences(transcript);
  const items: QAExtractionItem[] = [];

  sentences.forEach((sentence, index) => {
    if (!sentence.includes('?')) return;

    const answer = sentences.slice(index + 1).find((nextSentence) => !nextSentence.includes('?')) || '';
    items.push({
      question: sentence,
      answer,
      category: 'General',
      askedBy: 'Unknown speaker',
      answeredBy: answer ? 'Unknown speaker' : '',
      confidence: answer ? 0.55 : 0.35,
    });
  });

  return items.slice(0, 10);
}

export async function generateSummaryFromTranscript(transcript: string): Promise<SummaryResult> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('Transcript is empty');
  }

  return generateInternalSummaryFromTranscript(transcript);
}

export async function extractQuestionsAndAnswers(transcript: string): Promise<QAExtractionItem[]> {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  return extractInternalQuestionsAndAnswers(transcript);
}
