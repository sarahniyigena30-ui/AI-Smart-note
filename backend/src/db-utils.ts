/**
 * Utility functions for database operations
 */

import { dbGet, dbAll, dbRun } from './database.js'
import { v4 as uuidv4 } from 'uuid'

export interface QAItem {
  question: string
  answer?: string
  category?: string
  askedBy?: string
  answeredBy?: string
  confidence?: number
}

export async function getRecordingWithDetails(recordingId: string) {
  const recording = await dbGet(
    `
    SELECT r.*, 
           s.summary_text, 
           s.key_points,
           t.transcript_text 
    FROM recordings r
    LEFT JOIN summaries s ON r.id = s.recording_id
    LEFT JOIN transcripts t ON r.id = t.recording_id
    WHERE r.id = ?
  `,
    [recordingId]
  )

  if (!recording) return recording

  recording.qa_items = await getQAItems(recordingId)
  return recording
}

export async function getRecordingsPaginated(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit

  const recordings = await dbAll(
    `
    SELECT r.*, 
           s.summary_text, 
           s.key_points,
           t.transcript_text 
    FROM recordings r
    LEFT JOIN summaries s ON r.id = s.recording_id
    LEFT JOIN transcripts t ON r.id = t.recording_id
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `,
    [limit, offset]
  )

  for (const recording of recordings) {
    recording.qa_items = await getQAItems(recording.id)
  }

  const countResult = await dbGet('SELECT COUNT(*) as total FROM recordings')
  const total = countResult?.total || 0

  return {
    data: recordings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function searchRecordings(query: string, limit: number = 50) {
  const searchTerm = `%${query}%`

  return dbAll(
    `
    SELECT r.*, 
           s.summary_text, 
           s.key_points,
           t.transcript_text 
    FROM recordings r
    LEFT JOIN summaries s ON r.id = s.recording_id
    LEFT JOIN transcripts t ON r.id = t.recording_id
    WHERE r.title LIKE ? 
       OR t.transcript_text LIKE ?
       OR s.summary_text LIKE ?
    ORDER BY r.created_at DESC
    LIMIT ?
  `,
    [searchTerm, searchTerm, searchTerm, limit]
  )
}

export async function getQAItems(recordingId: string) {
  return dbAll(
    `
    SELECT id,
           question_text,
           answer_text,
           category,
           asked_by,
           answered_by,
           confidence
    FROM qa_items
    WHERE recording_id = ?
    ORDER BY created_at ASC
  `,
    [recordingId]
  )
}

export async function createRecording(
  title: string,
  filePath: string,
  fileSize: number,
  duration: number = 0
) {
  const recordingId = uuidv4()

  await dbRun(
    `INSERT INTO recordings (id, title, file_path, duration, file_size, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [recordingId, title, filePath, duration, fileSize]
  )

  return recordingId
}

export async function createTranscript(recordingId: string, transcriptText: string) {
  const transcriptId = uuidv4()

  await dbRun(
    `INSERT INTO transcripts (id, recording_id, transcript_text, created_at, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [transcriptId, recordingId, transcriptText]
  )

  return transcriptId
}

export async function createSummary(
  recordingId: string,
  summaryText: string,
  keyPoints: string[] = []
) {
  const summaryId = uuidv4()

  await dbRun(
    `INSERT INTO summaries (id, recording_id, summary_text, key_points, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [summaryId, recordingId, summaryText, JSON.stringify(keyPoints)]
  )

  return summaryId
}

export async function createQAItems(recordingId: string, items: QAItem[] = []) {
  const ids: string[] = []

  for (const item of items) {
    if (!item.question?.trim()) continue

    const qaId = uuidv4()
    await dbRun(
      `INSERT INTO qa_items (
         id,
         recording_id,
         question_text,
         answer_text,
         category,
         asked_by,
         answered_by,
         confidence,
         created_at,
         updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        qaId,
        recordingId,
        item.question.trim(),
        item.answer?.trim() || '',
        item.category?.trim() || 'General',
        item.askedBy?.trim() || 'Unknown speaker',
        item.answeredBy?.trim() || '',
        item.confidence ?? 0,
      ]
    )
    ids.push(qaId)
  }

  return ids
}

export async function deleteRecording(recordingId: string) {
  const recording = await dbGet('SELECT * FROM recordings WHERE id = ?', [recordingId])

  if (!recording) {
    throw new Error('Recording not found')
  }

  await dbRun('DELETE FROM recordings WHERE id = ?', [recordingId])

  return recording
}

export async function updateRecordingDuration(recordingId: string, duration: number) {
  await dbRun('UPDATE recordings SET duration = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
    duration,
    recordingId,
  ])
}
