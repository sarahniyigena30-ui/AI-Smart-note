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
  key_points?: string[]
  decisions?: string[]
  action_items?: string[]
  topics?: string[]
  keywords?: string[]
  insights?: string[]
}

interface RecordingListProps {
  recordings: Recording[]
  onDelete: (id: string) => void
}

export default function RecordingList({ recordings, onDelete }: RecordingListProps) {
  return (
    <div className="recording-list">
      {recordings.map((recording) => (
        <RecordingCard
          key={recording.id}
          recording={recording}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
