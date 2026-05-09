import RecordingCard from './RecordingCard'
import './RecordingList.css'

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

interface RecordingListProps {
  recordings: Recording[]
  authToken: string
  onDelete: (id: string) => void
  onUpdate: (recording: Recording) => void
}

export default function RecordingList({ recordings, authToken, onDelete, onUpdate }: RecordingListProps) {
  return (
    <div className="recording-list">
      {recordings.map((recording) => (
        <RecordingCard
          key={recording.id}
          recording={recording}
          authToken={authToken}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
}
