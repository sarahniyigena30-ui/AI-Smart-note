import { Router, Request, Response } from 'express'
import {
  getRecordingsPaginated,
  getRecordingWithDetails,
  searchRecordings,
  createRecording,
  createTranscript,
  createSummary,
  createQAItems,
  deleteRecording,
} from '../db-utils.js'
import {
  transcribeAudio,
  generateSummaryFromTranscript,
  extractQuestionsAndAnswers,
  type SummaryResult,
} from '../summary.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

// Configure multer for file uploads
const uploadDir = 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = new Set([
      '.aac',
      '.flac',
      '.m4a',
      '.mp3',
      '.ogg',
      '.opus',
      '.wav',
      '.webm',
    ])
    const extension = path.extname(file.originalname).toLowerCase()

    if (!file.mimetype.startsWith('audio/') && !allowedExtensions.has(extension)) {
      cb(new Error('Only audio files are allowed'))
    } else {
      cb(null, true)
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
})

// GET all recordings with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters',
      })
    }

    const result = await getRecordingsPaginated(page, limit)

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Error fetching recordings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recordings',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Search recordings
router.get('/search/query', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string)?.trim()

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      })
    }

    if (query.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Search query is too long',
      })
    }

    const results = await searchRecordings(query)

    res.json({
      success: true,
      data: results,
      count: results.length,
    })
  } catch (error) {
    console.error('Error searching recordings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search recordings',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET single recording with details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Validate ID format (basic UUID check)
    if (!id.match(/^[0-9a-f\-]{36}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recording ID format',
      })
    }

    const recording = await getRecordingWithDetails(id)

    if (!recording) {
      return res.status(404).json({
        success: false,
        error: 'Recording not found',
      })
    }

    res.json({
      success: true,
      data: recording,
    })
  } catch (error) {
    console.error('Error fetching recording:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recording',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST upload and process audio
router.post('/upload', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      })
    }

    const title = req.body.title?.trim() || `Recording ${new Date().toLocaleString()}`
    const browserTranscript = typeof req.body.browserTranscript === 'string'
      ? req.body.browserTranscript.trim()
      : ''
    const filePath = req.file.path
    const fileSize = req.file.size

    // Validate inputs
    if (!title || title.length === 0) {
      fs.unlinkSync(filePath)
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      })
    }

    if (title.length > 500) {
      fs.unlinkSync(filePath)
      return res.status(400).json({
        success: false,
        error: 'Title is too long (max 500 characters)',
      })
    }

    try {
      // Create recording entry
      const recordingId = await createRecording(title, filePath, fileSize)

      let transcript = ''
      let summaryData: SummaryResult = {
        summary: '',
        keyPoints: [],
        decisions: [],
        actionItems: [],
        topics: [],
        keywords: [],
        insights: [],
      }

      // Transcribe audio
      try {
        console.log('Starting transcription for recording:', recordingId)
        transcript = await transcribeAudio(filePath)
        console.log('Transcription completed:', transcript.substring(0, 100) + '...')

        await createTranscript(recordingId, transcript)
      } catch (error) {
        console.error('Transcription error:', error)
        transcript = ''
      }

      if (!transcript && browserTranscript) {
        console.log('Using browser live transcript as fallback for recording:', recordingId)
        transcript = browserTranscript
        await createTranscript(recordingId, transcript)
      }

      // Generate summary if transcription was successful
      if (transcript && transcript.length > 0) {
        try {
          console.log('Starting summary generation...')
          summaryData = await generateSummaryFromTranscript(transcript)
          console.log('Summary generated successfully')

          await createSummary(recordingId, summaryData.summary, {
            keyPoints: summaryData.keyPoints,
            decisions: summaryData.decisions,
            actionItems: summaryData.actionItems,
            topics: summaryData.topics,
            keywords: summaryData.keywords,
            insights: summaryData.insights,
          })
        } catch (error) {
          console.error('Summary generation error:', error)
        }

        try {
          console.log('Starting Q&A extraction...')
          const qaItems = await extractQuestionsAndAnswers(transcript)
          await createQAItems(recordingId, qaItems)
          console.log(`Q&A extraction completed: ${qaItems.length} item(s)`)
        } catch (error) {
          console.error('Q&A extraction error:', error)
        }
      }

      const recording = await getRecordingWithDetails(recordingId)

      res.json({
        success: true,
        data: {
          recording,
          transcript,
          summary: summaryData,
        },
        message: 'Recording processed successfully',
      })
    } catch (error) {
      // Clean up file if database operation fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      throw error
    }
  } catch (error) {
    console.error('Error processing upload:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process upload',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// DELETE recording
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Validate ID format
    if (!id.match(/^[0-9a-f\-]{36}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recording ID format',
      })
    }

    const recording = await deleteRecording(id)

    // Delete file
    if (recording.file_path && fs.existsSync(recording.file_path)) {
      try {
        fs.unlinkSync(recording.file_path)
      } catch (error) {
        console.error('Error deleting file:', error)
      }
    }

    res.json({
      success: true,
      message: 'Recording deleted successfully',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Recording not found') {
      return res.status(404).json({
        success: false,
        error: 'Recording not found',
      })
    }

    console.error('Error deleting recording:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete recording',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET recording download endpoint
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const recording = await getRecordingWithDetails(id)

    if (!recording) {
      return res.status(404).json({
        success: false,
        error: 'Recording not found',
      })
    }

    if (!fs.existsSync(recording.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'Recording file not found',
      })
    }

    res.download(recording.file_path, `${recording.title}.webm`)
  } catch (error) {
    console.error('Error downloading recording:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to download recording',
    })
  }
})

// Error handling middleware for multer
router.use((err: any, _req: Request, res: Response, _next: any) => {
  if (err instanceof multer.MulterError) {
    if (String(err.code) === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        error: 'File is too large (max 100MB)',
      })
    }
  }
  if (err.message === 'Only audio files are allowed') {
    return res.status(400).json({
      success: false,
      error: err.message,
    })
  }

  return res.status(500).json({
    success: false,
    error: 'Upload failed',
    message: err instanceof Error ? err.message : 'Unknown upload error',
  })
})

export default router

