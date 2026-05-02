import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function generateSummaryFromTranscript(transcript: string): Promise<SummaryResult> {
  try {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is empty');
    }

    // Limit transcript to avoid token limits
    const limitedTranscript = transcript.substring(0, 10000);

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You turn meeting, interview, and discussion transcripts into structured smart notes.
Return only valid JSON with these fields:
- summary: a clear paragraph explaining the conversation
- keyPoints: 3 to 7 important points
- decisions: confirmed decisions, or an empty array
- actionItems: concrete follow-up tasks, including owner/deadline in the text when known
- topics: important topics discussed
- keywords: searchable keywords
- insights: useful observations, risks, concerns, or opportunities.
Do not invent facts that are not in the transcript.`,
        },
        {
          role: 'user',
          content: `Create structured smart notes from this transcript:\n\n${limitedTranscript}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '';

    try {
      // Try to extract JSON from the response
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || '',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      };
    } catch (parseError) {
      console.warn('Failed to parse summary JSON, using raw content');
      return {
        summary: content,
        keyPoints: [],
        decisions: [],
        actionItems: [],
        topics: [],
        keywords: [],
        insights: [],
      };
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
    throw new Error('Failed to generate summary');
  }
}

export async function extractQuestionsAndAnswers(transcript: string): Promise<QAExtractionItem[]> {
  try {
    if (!transcript || transcript.trim().length === 0) {
      return [];
    }

    const limitedTranscript = transcript.substring(0, 12000);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Extract questions asked during a meeting or event transcript.
Return only valid JSON with a top-level "items" array.
Each item must include:
- question: exact or cleaned question text
- answer: the answer provided after the question, or empty string if unanswered
- category: one of "Technical", "Administrative", "Decision", "Action Item", "Clarification", "Finance", "Schedule", "General"
- askedBy: speaker name if explicitly present, otherwise "Unknown speaker"
- answeredBy: speaker name if explicitly present, otherwise empty string
- confidence: number from 0 to 1 for how confident the question-answer pairing is.
Do not invent speaker names.`,
        },
        {
          role: 'user',
          content: `Transcript:\n\n${limitedTranscript}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{"items":[]}';
    const parsed = JSON.parse(content);
    const items = Array.isArray(parsed.items) ? parsed.items : [];

    return items
      .filter((item: any) => typeof item.question === 'string' && item.question.trim())
      .map((item: any) => ({
        question: item.question || '',
        answer: item.answer || '',
        category: item.category || 'General',
        askedBy: item.askedBy || 'Unknown speaker',
        answeredBy: item.answeredBy || '',
        confidence: typeof item.confidence === 'number' ? item.confidence : 0,
      }));
  } catch (error) {
    console.error('Error extracting questions and answers:', error);
    return [];
  }
}

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    const audioFile = fs.createReadStream(audioPath);

    const response = await openai.audio.transcriptions.create({
      file: audioFile as any,
      model: 'whisper-1',
      language: 'en', // Set language to English
    });

    if (!response.text || response.text.trim().length === 0) {
      throw new Error('No speech detected in audio');
    }

    return response.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
    throw new Error('Failed to transcribe audio');
  }
}
