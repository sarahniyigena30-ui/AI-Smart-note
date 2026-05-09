import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSCRIPTION_SCRIPT = path.resolve(__dirname, '../../models/transcribe_service.py');

interface TranscriptionResult {
  success: boolean;
  text?: string;
  file?: string;
  language?: string;
  error?: string;
}

/**
 * Transcribe an audio file to French text using Whisper model
 */
export function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';

    const python = spawn('python', [TRANSCRIPTION_SCRIPT, audioFilePath], {
      cwd: path.resolve(__dirname, '../../models'),
    });

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      try {
        if (code !== 0) {
          console.error('Python transcription error:', errorOutput);
          reject(new Error(`Transcription process exited with code ${code}: ${errorOutput}`));
          return;
        }

        const result = JSON.parse(output) as TranscriptionResult;
        resolve(result);
      } catch (parseError) {
        console.error('Failed to parse transcription output:', output, parseError);
        reject(new Error(`Failed to parse transcription result: ${output}`));
      }
    });

    python.on('error', (err) => {
      console.error('Failed to spawn Python process:', err);
      reject(err);
    });
  });
}

/**
 * Check if the transcription service is available
 */
export async function checkTranscriptionServiceHealth(): Promise<boolean> {
  try {
    // Try to import the required packages by running a simple Python check
    const pythonCheck = spawn('python', [
      '-c',
      'import torch; from transformers import pipeline; print("OK")',
    ]);

    return new Promise((resolve) => {
      pythonCheck.on('close', (code) => {
        resolve(code === 0);
      });
    });
  } catch {
    return false;
  }
}
