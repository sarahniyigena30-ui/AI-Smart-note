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
