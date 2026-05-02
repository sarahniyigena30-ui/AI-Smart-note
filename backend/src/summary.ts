import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
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
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that summarizes conversations and extracts key points. 
          Please provide a comprehensive summary and a list of key points (3-5 bullets).
          Respond with a JSON object containing "summary" (string) and "keyPoints" (array of strings).`,
        },
        {
          role: 'user',
          content: `Please summarize the following conversation and extract key points:\n\n${limitedTranscript}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || '';

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || content,
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        };
      } else {
        // If no JSON found, return the content as summary
        return {
          summary: content,
          keyPoints: [],
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse summary JSON, using raw content');
      return {
        summary: content,
        keyPoints: [],
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
