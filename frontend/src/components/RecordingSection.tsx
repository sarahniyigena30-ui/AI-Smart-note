import { useRef, useState } from 'react'
import './RecordingSection.css'

interface RecordingSectionProps {
  authToken: string
  onUpload: () => void
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: { transcript: string }
}

type SpeechRecognitionEventLike = Event & {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

export default function RecordingSection({ authToken, onUpload }: RecordingSectionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isStoppingRecording, setIsStoppingRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState('00:00')
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentSpeaker, setCurrentSpeaker] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [liveQuestions, setLiveQuestions] = useState<{ question: string; askedBy: string }[]>([])
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondsRef = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const shouldRestartRecognitionRef = useRef(false)
  const finalTranscriptRef = useRef('')
  const interimTranscriptRef = useRef('')
  const detectedQuestionsRef = useRef<Set<string>>(new Set())

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const clearMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const getCapturedTranscript = () =>
    `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.replace(/\s+/g, ' ').trim()

  const detectQuestions = (text: string) => {
    const matches = text.match(/[^.!?]*\?/g) || []
    const nextQuestions: { question: string; askedBy: string }[] = []

    for (const match of matches) {
      const question = match.trim()
      const normalized = question.toLowerCase()
      if (!question || detectedQuestionsRef.current.has(normalized)) continue

      detectedQuestionsRef.current.add(normalized)
      nextQuestions.push({
        question,
        askedBy: currentSpeaker.trim() || 'Unknown speaker',
      })
    }

    if (nextQuestions.length > 0) {
      setLiveQuestions((existing) => [...existing, ...nextQuestions])
    }
  }

  const startLiveTranscription = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setSpeechRecognitionSupported(false)
      return
    }

    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalText = finalTranscriptRef.current
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript.trim()

        if (result.isFinal) {
          finalText = `${finalText} ${transcript}`.trim()
        } else {
          interimText = `${interimText} ${transcript}`.trim()
        }
      }

      finalTranscriptRef.current = finalText
      interimTranscriptRef.current = interimText
      setLiveTranscript(finalText)
      setInterimTranscript(interimText)
      detectQuestions(`${finalText} ${interimText}`)
    }

    recognition.onerror = () => {
      setSpeechRecognitionSupported(false)
    }

    recognition.onend = () => {
      if (shouldRestartRecognitionRef.current) {
        try {
          recognition.start()
        } catch {
          // The browser may already be restarting recognition.
        }
      }
    }

    recognitionRef.current = recognition
    shouldRestartRecognitionRef.current = true

    try {
      recognition.start()
      setSpeechRecognitionSupported(true)
    } catch {
      setSpeechRecognitionSupported(false)
    }
  }

  const stopLiveTranscription = () => {
    shouldRestartRecognitionRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setInterimTranscript('')
  }

  const startRecording = async () => {
    clearMessages()
    setLiveTranscript('')
    setInterimTranscript('')
    setLiveQuestions([])
    finalTranscriptRef.current = ''
    interimTranscriptRef.current = ''
    detectedQuestionsRef.current = new Set()
    setIsStoppingRecording(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await uploadRecording(audioBlob, undefined, getCapturedTranscript())
        setIsStoppingRecording(false)
      }

      mediaRecorder.start()
      setIsRecording(true)
      secondsRef.current = 0
      setRecordingTime('00:00')

      timerRef.current = setInterval(() => {
        secondsRef.current++
        setRecordingTime(formatTime(secondsRef.current))
      }, 1000)

      drawWaveform()
      startLiveTranscription()
    } catch (error) {
      const errorMsg =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone access denied. Please check browser permissions.'
          : 'Could not access microphone. Please check permissions.'

      setError(errorMsg)
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current || isStoppingRecording) return

    setIsStoppingRecording(true)
    stopLiveTranscription()
    setIsRecording(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current)
      animationIdRef.current = null
    }

    window.setTimeout(() => {
      const recorder = mediaRecorderRef.current
      if (!recorder) return

      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
      recorder.stream.getTracks().forEach((track) => track.stop())
    }, 500)
  }

  const uploadRecording = async (audioBlob: Blob, fileName?: string, browserTranscript?: string) => {
    setIsProcessing(true)
    setUploadProgress(0)
    clearMessages()

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, fileName || 'recording.webm')
      formData.append('title', fileName || `Recording ${new Date().toLocaleString()}`)

      if (browserTranscript?.trim()) {
        formData.append('browserTranscript', browserTranscript.trim())
      }

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        let response: {
          success?: boolean
          error?: string
          message?: string
          data?: {
            transcript?: string
          }
        } = {}

        try {
          response = xhr.responseText ? JSON.parse(xhr.responseText) : {}
        } catch {
          response = {
            error: xhr.responseText || `Upload failed with status ${xhr.status}`,
          }
        }

        if (xhr.status === 200 && response.success) {
          const transcript = response.data?.transcript?.trim() || browserTranscript?.trim()
          setSuccessMessage(
            transcript
              ? response.message || 'Recording saved. Transcript and notes are ready.'
              : response.message || 'Recording saved. Add the transcript from the recording history card to generate notes.'
          )
          onUpload()
        } else {
          setError(response.error || response.message || `Failed to upload recording (${xhr.status})`)
        }

        setUploadProgress(0)
        setIsProcessing(false)
      })

      xhr.addEventListener('error', () => {
        setError('Network error. Please check your connection and try again.')
        setIsProcessing(false)
      })

      xhr.addEventListener('abort', () => {
        setError('Upload cancelled')
        setIsProcessing(false)
      })

      xhr.open('POST', '/api/recordings/upload')
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`)
      xhr.send(formData)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload recording'
      setError(errorMsg)
      console.error('Error uploading recording:', error)
      setIsProcessing(false)
    }
  }

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const analyser = analyserRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      canvasCtx.fillStyle = 'rgb(245, 247, 250)'
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)
      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(18, 109, 143)'
      canvasCtx.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128
        const y = (v * canvas.height) / 2
        if (i === 0) canvasCtx.moveTo(x, y)
        else canvasCtx.lineTo(x, y)
        x += sliceWidth
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2)
      canvasCtx.stroke()
    }

    draw()
  }

  return (
    <section className="recording-section">
      <h2>Record Conversation</h2>

      {error && (
        <div className="message error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      {successMessage && (
        <div className="message success-banner">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>x</button>
        </div>
      )}

      <div className="recording-controls">
        <button
          className={`btn btn-primary ${isRecording ? 'recording' : ''}`}
          onClick={startRecording}
          disabled={isRecording || isProcessing || isStoppingRecording}
        >
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>

        <button
          className="btn btn-danger"
          onClick={stopRecording}
          disabled={!isRecording || isProcessing || isStoppingRecording}
        >
          {isStoppingRecording ? 'Saving...' : 'Stop Recording'}
        </button>
      </div>

      <div className="speaker-row">
        <label htmlFor="current-speaker">Current speaker</label>
        <input
          id="current-speaker"
          type="text"
          value={currentSpeaker}
          onChange={(event) => setCurrentSpeaker(event.target.value)}
          placeholder="Type the name of the person speaking"
          disabled={isProcessing}
        />
      </div>

      {isRecording && (
        <div className="recording-info">
          <span className="recording-time">{recordingTime}</span>
          <canvas ref={canvasRef} width={400} height={100} className="waveform-canvas" />
        </div>
      )}

      {(isRecording || liveTranscript || interimTranscript) && (
        <div className="live-transcript">
          <div className="live-transcript-header">
            <h3>Live Transcript</h3>
            {isRecording && <span className="live-pill">Listening</span>}
          </div>
          {!speechRecognitionSupported ? (
            <p className="live-transcript-muted">
              Automatic transcription is not available in this browser. Use Chrome or Edge so the system can create notes from your recording.
            </p>
          ) : (
            <p>
              {liveTranscript || 'Start speaking and your words will appear here.'}
              {interimTranscript && <span className="interim-transcript"> {interimTranscript}</span>}
            </p>
          )}
        </div>
      )}

      {liveQuestions.length > 0 && (
        <div className="live-questions">
          <h3>Detected Questions</h3>
          {liveQuestions.map((item, index) => (
            <div className="live-question-item" key={`${item.question}-${index}`}>
              <strong>{item.askedBy}</strong>
              <span>{item.question}</span>
            </div>
          ))}
        </div>
      )}

      {isProcessing && (
        <div className="processing-info">
          <p>Processing audio... {uploadProgress}%</p>
          <progress value={uploadProgress} max={100}></progress>
        </div>
      )}
    </section>
  )
}
