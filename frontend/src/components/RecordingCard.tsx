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
  onDelete: (id: string) => void
}

export default function RecordingCard({ recording, onDelete }: RecordingCardProps) {
  const [expanded, setExpanded] = useState(false)

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
  }

  const parseKeyPoints = () => {
    if (!recording.key_points) return []
    if (typeof recording.key_points === 'string') {
      try {
        return JSON.parse(recording.key_points)
      } catch {
        return []
      }
    }
    return Array.isArray(recording.key_points) ? recording.key_points : []
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      onDelete(recording.id)
    }
  }

  const keyPoints = parseKeyPoints()
  const hasContent = recording.transcript_text || recording.summary_text
  const audioSource = recording.file_path ? `/${recording.file_path.replace(/\\/g, '/')}` : ''
  const qaItems = recording.qa_items || []

  return (
    <div className="recording-card">
      <div className="card-header">
        <div className="card-title-section">
          <h3 title={recording.title}>{recording.title}</h3>
          {hasContent && <span className="content-badge">Done</span>}
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
              <h4>AI Summary</h4>
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
                Audio uploaded. Add a valid OpenAI API key in backend/.env to generate the transcript and summary.
              </p>
            </div>
          )}
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
