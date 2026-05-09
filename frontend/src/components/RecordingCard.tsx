import { useState } from 'react'
import './RecordingCard.css'

interface Recording {
  id: string
  title: string
  created_at: string
  duration: number
  file_size: number
  summary_text?: string
  transcript_text?: string
  key_points?: string | string[]
  decisions?: string | string[]
  action_items?: string | string[]
  topics?: string | string[]
  keywords?: string | string[]
  insights?: string | string[]
  file_path?: string
  qa_items?: QAItem[]
}

interface QAItem {
  id: string
  question_text: string
  answer_text?: string
  category?: string
  asked_by?: string
  answered_by?: string
  confidence?: number
}

interface RecordingCardProps {
  recording: Recording
  authToken: string
  onDelete: (id: string) => void
  onUpdate: (recording: Recording) => void
}

export default function RecordingCard({ recording, authToken, onDelete, onUpdate }: RecordingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [transcriptDraft, setTranscriptDraft] = useState(recording.transcript_text || '')
  const [isSavingTranscript, setIsSavingTranscript] = useState(false)
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [transcriptMessage, setTranscriptMessage] = useState<string | null>(null)

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
  }

  const parseList = (value?: string | string[]) => {
    if (!value) return []
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return Array.isArray(value) ? value : []
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      onDelete(recording.id)
    }
  }

  const handleTranscriptSave = async () => {
    const transcript = transcriptDraft.trim()

    if (!transcript) {
      setTranscriptError('Transcript is required before generating notes.')
      return
    }

    setIsSavingTranscript(true)
    setTranscriptError(null)
    setTranscriptMessage(null)

    try {
      const response = await fetch(`/api/recordings/${recording.id}/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ transcript }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to save transcript.')
      }

      onUpdate(data.data)
      setTranscriptDraft(data.data.transcript_text || transcript)
      setTranscriptMessage(data.message || 'Transcript saved and summary generated.')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save transcript.'
      setTranscriptError(errorMessage)
    } finally {
      setIsSavingTranscript(false)
    }
  }

  const keyPoints = parseList(recording.key_points)
  const decisions = parseList(recording.decisions)
  const actionItems = parseList(recording.action_items)
  const topics = parseList(recording.topics)
  const keywords = parseList(recording.keywords)
  const insights = parseList(recording.insights)
  const hasContent = recording.transcript_text || recording.summary_text
  const audioSource = recording.file_path ? `/${recording.file_path.replace(/\\/g, '/')}` : ''
  const qaItems = recording.qa_items || []

  return (
    <div className="recording-card">
      <div className="card-header">
        <div className="card-title-section">
          <h3 title={recording.title}>{recording.title}</h3>
          {hasContent && <span className="content-badge">Processed</span>}
        </div>
        <button
          className="btn-expand"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? 'v' : '>'}
        </button>
      </div>

      <div className="card-meta">
        <span className="meta-item">Date: {formatDate(recording.created_at)}</span>
        <span className="meta-item">Size: {formatFileSize(recording.file_size)}</span>
      </div>

      {expanded && (
        <div className="card-content">
          {recording.transcript_text && (
            <div className="section">
              <h4>Transcript</h4>
              <p className="transcript">{recording.transcript_text}</p>
            </div>
          )}

          {recording.summary_text && (
            <div className="section">
              <h4>Structured Summary</h4>
              <p className="summary">{recording.summary_text}</p>

              {keyPoints.length > 0 && (
                <div className="key-points">
                  <h5>Key Points</h5>
                  <ul>
                    {keyPoints.map((point: string, idx: number) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {decisions.length > 0 && (
                <StructuredList title="Decisions" items={decisions} />
              )}

              {actionItems.length > 0 && (
                <StructuredList title="Action Items" items={actionItems} />
              )}

              {insights.length > 0 && (
                <StructuredList title="Insights" items={insights} />
              )}

              {topics.length > 0 && (
                <TagList title="Topics" items={topics} />
              )}

              {keywords.length > 0 && (
                <TagList title="Keywords" items={keywords} />
              )}
            </div>
          )}

          {qaItems.length > 0 && (
            <div className="section">
              <h4>Questions and Answers</h4>
              <div className="qa-list">
                {qaItems.map((item) => (
                  <div className="qa-item" key={item.id}>
                    <div className="qa-meta">
                      <span>{item.category || 'General'}</span>
                      <span>Asked by: {item.asked_by || 'Unknown speaker'}</span>
                      {item.answered_by && <span>Answered by: {item.answered_by}</span>}
                    </div>
                    <p className="qa-question">{item.question_text}</p>
                    <p className="qa-answer">
                      {item.answer_text || 'No answer was clearly detected in the transcript.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!recording.transcript_text && !recording.summary_text && (
            <div className="section">
              <p className="placeholder">
                Audio saved, but automatic transcript text was not captured. Add the transcript below to generate structured notes.
              </p>
            </div>
          )}

          <div className="section transcript-editor">
            <h4>{recording.transcript_text ? 'Update Transcript' : 'Add Transcript'}</h4>
            <textarea
              value={transcriptDraft}
              onChange={(event) => {
                setTranscriptDraft(event.target.value)
                setTranscriptError(null)
                setTranscriptMessage(null)
              }}
              placeholder="Type or paste the transcript here..."
              disabled={isSavingTranscript}
            />
            {transcriptError && <p className="transcript-status transcript-status-error">{transcriptError}</p>}
            {transcriptMessage && <p className="transcript-status transcript-status-success">{transcriptMessage}</p>}
            <button
              className="btn-save-transcript"
              onClick={handleTranscriptSave}
              disabled={isSavingTranscript || !transcriptDraft.trim()}
            >
              {isSavingTranscript ? 'Saving...' : 'Save Transcript and Generate Summary'}
            </button>
          </div>
        </div>
      )}

      <div className="card-actions">
        {recording.file_path && (
          <audio controls className="audio-player">
            <source src={audioSource} />
            Your browser does not support the audio element.
          </audio>
        )}
        <button className="btn-delete" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}

function StructuredList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="key-points">
      <h5>{title}</h5>
      <ul>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="tag-section">
      <h5>{title}</h5>
      <div className="tag-list">
        {items.map((item, index) => (
          <span className="tag" key={`${title}-${index}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
