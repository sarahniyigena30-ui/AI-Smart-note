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
