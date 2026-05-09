import { useState, useEffect, type FormEvent } from 'react'
import RecordingSection from './components/RecordingSection'
import RecordingList from './components/RecordingList'
import ErrorBoundary from './components/ErrorBoundary'
import SearchBar from './components/SearchBar'
import { translations, type Language } from './i18n'
import './App.css'

const AUTH_TOKEN_STORAGE_KEY = 'smart-note-auth-token'
const AUTH_USER_STORAGE_KEY = 'smart-note-auth-user'
const LANGUAGE_STORAGE_KEY = 'smart-note-language'

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

interface ClassMetrics {
  precision: number
  recall: number
  'f1-score': number
  support: number
}

interface VoiceMetrics {
  dataset: string
  rows: number
  labels: string[]
  best_model: string
  accuracy: number
  confusion_matrix: number[][]
  classification_report: Record<string, ClassMetrics | number>
}

async function readApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return {
    success: false,
    error: text || response.statusText || 'The server returned an unexpected response.',
  }
}

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return (saved as Language) || 'en'
  })

  const t = (key: keyof typeof translations.en) => translations[language][key]

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'fr' : 'en'
    setLanguage(newLang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang)
  }

  const [authToken, setAuthToken] = useState(() => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '')
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem(AUTH_USER_STORAGE_KEY) || '')
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')
  const [authForm, setAuthForm] = useState({ username: '', password: '' })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([])
  const [voiceMetrics, setVoiceMetrics] = useState<VoiceMetrics | null>(null)
  const [metricsError, setMetricsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const isAuthenticated = Boolean(authToken)

  const clearAuthSession = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    setAuthToken('')
    setCurrentUser('')
    setRecordings([])
    setFilteredRecordings([])
    setVoiceMetrics(null)
    setMetricsError(null)
    setError(null)
    setSearchQuery('')
    setPage(1)
    setTotalPages(1)
  }

  const authHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
  })

  const fetchRecordings = async (pageNum = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/recordings?page=${pageNum}&limit=10`, {
        headers: authHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) clearAuthSession()
        throw new Error(`Failed to fetch recordings: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setRecordings(data.data)
        setFilteredRecordings(data.data)
        setPage(pageNum)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        throw new Error(data.error || 'Failed to fetch recordings')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recordings'
      setError(errorMessage)
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setFilteredRecordings(recordings)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/recordings/search/query?q=${encodeURIComponent(query)}`, {
        headers: authHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) clearAuthSession()
        throw new Error('Search failed')
      }

      const data = await response.json()

      if (data.success) {
        setFilteredRecordings(data.data)
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchVoiceMetrics = async () => {
    setMetricsError(null)
    try {
      const response = await fetch('/api/model/voice-metrics', {
        headers: authHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) clearAuthSession()
        throw new Error('Model metrics are not available yet')
      }

      const data = await response.json()

      if (data.success) {
        setVoiceMetrics(data.data)
      } else {
        throw new Error(data.error || 'Failed to load model metrics')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load model metrics'
      setMetricsError(errorMessage)
    }
  }

  useEffect(() => {
    if (authToken) {
      fetchRecordings()
      fetchVoiceMetrics()
    }
  }, [authToken])

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError(null)
    setAuthMessage(null)

    try {
      const response = await fetch(`/api/auth/${authMode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: authForm.username,
          password: authForm.password,
        }),
      })

      const data = await readApiResponse(response)

      if (!response.ok || !data.success) {
        if (response.status === 404) {
          throw new Error('Authentication is not available yet. Please restart the backend server and try again.')
        }

        if (response.status >= 500) {
          throw new Error(data.error || 'The server could not complete this request. Please try again.')
        }

        throw new Error(data.error || 'Authentication failed.')
      }

      setAuthMessage(data.message || 'Account ready.')
      setAuthForm({ username: '', password: '' })

      if (data.data?.token) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.data.token)
        localStorage.setItem(AUTH_USER_STORAGE_KEY, data.data.user.username)
        setAuthToken(data.data.token)
        setCurrentUser(data.data.user.username)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed.'
      setAuthError(errorMessage)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(),
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthSession()
    }
  }

  const handleRecordingUpload = () => {
    fetchRecordings(1)
    setSearchQuery('')
  }

  const handleRecordingDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/recordings/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      if (!response.ok) {
        if (response.status === 401) clearAuthSession()
        throw new Error('Failed to delete recording')
      }

      setRecordings(recordings.filter((recording) => recording.id !== id))
      setFilteredRecordings(filteredRecordings.filter((recording) => recording.id !== id))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete recording'
      setError(errorMessage)
    }
  }

  const handleRecordingUpdate = (updatedRecording: Recording) => {
    const replaceRecording = (recording: Recording) =>
      recording.id === updatedRecording.id ? updatedRecording : recording

    setRecordings((currentRecordings) => currentRecordings.map(replaceRecording))
    setFilteredRecordings((currentRecordings) => currentRecordings.map(replaceRecording))
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <div>
            <h1>{t('appTitle')}</h1>
            <p>{t('appSubtitle')}</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-language"
              onClick={toggleLanguage}
              title={t('language')}
            >
              {language === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}
            </button>
            {isAuthenticated && (
              <div className="session-actions">
                <span>{t('signInAs')} {currentUser}</span>
                <button className="btn-logout" onClick={handleLogout}>
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </header>

        {!isAuthenticated ? (
          <main className="login-main">
            <section className="login-panel" aria-labelledby="login-title">
              <div>
                <h2 id="login-title">{authMode === 'register' ? t('register') : t('login')}</h2>
                <p>{t('createAccount')}</p>
              </div>

              <div className="auth-tabs" aria-label="Authentication mode">
                <button
                  className={authMode === 'register' ? 'active' : ''}
                  type="button"
                  onClick={() => {
                    setAuthMode('register')
                    setAuthError(null)
                    setAuthMessage(null)
                  }}
                >
                  {t('register')}
                </button>
                <button
                  className={authMode === 'login' ? 'active' : ''}
                  type="button"
                  onClick={() => {
                    setAuthMode('login')
                    setAuthError(null)
                    setAuthMessage(null)
                  }}
                >
                  {t('login')}
                </button>
              </div>

              <form className="login-form" onSubmit={handleAuthSubmit}>
                <label>
                  {t('username')}
                  <input
                    type="text"
                    value={authForm.username}
                    onChange={(event) => {
                      setAuthForm({ ...authForm, username: event.target.value })
                      setAuthError(null)
                      setAuthMessage(null)
                    }}
                    autoComplete="username"
                    required
                  />
                </label>

                <label>
                  {t('password')}
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) => {
                      setAuthForm({ ...authForm, password: event.target.value })
                      setAuthError(null)
                      setAuthMessage(null)
                    }}
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                    minLength={6}
                    required
                  />
                </label>

                {authError && <div className="login-error">{authError}</div>}
                {authMessage && <div className="login-success">{authMessage}</div>}

                <button className="btn-login" type="submit" disabled={authLoading}>
                  {authLoading ? t('loading') : (authMode === 'register' ? t('register') : t('login'))}
                </button>
              </form>

              <div className="login-hint">
                <span>{t('passwordHint')}</span>
                <span>{t('passwordMinLength')}</span>
              </div>
            </section>
          </main>
        ) : (
          <main className="app-main">
            <section className="model-dashboard">
              <div className="model-dashboard-header">
                <div>
                  <h2>Local Model Evaluation</h2>
                  <p>Offline performance metrics for the bundled acoustic model.</p>
                </div>
                {voiceMetrics && <span className="model-name">{voiceMetrics.best_model}</span>}
              </div>

              {metricsError ? (
                <div className="metrics-empty">{metricsError}</div>
              ) : voiceMetrics ? (
                <div className="metrics-grid">
                <div className="accuracy-panel">
                  <div
                    className="accuracy-ring"
                    style={{
                      background: `conic-gradient(#087f5b ${voiceMetrics.accuracy * 360}deg, #e8eef3 0deg)`,
                    }}
                  >
                    <div className="accuracy-ring-inner">
                      <strong>{(voiceMetrics.accuracy * 100).toFixed(2)}%</strong>
                      <span>Accuracy</span>
                    </div>
                  </div>
                  <div className="dataset-meta">
                    <span>{voiceMetrics.rows.toLocaleString()} rows</span>
                    <span>{voiceMetrics.labels.join(' vs ')}</span>
                  </div>
                </div>

                <div className="class-chart">
                  <h3>Class Scores</h3>
                  {voiceMetrics.labels.map((label) => {
                    const classMetrics = voiceMetrics.classification_report[label] as ClassMetrics
                    return (
                      <div className="class-score" key={label}>
                        <div className="class-score-header">
                          <strong>{label}</strong>
                          <span>{(classMetrics['f1-score'] * 100).toFixed(2)}% F1</span>
                        </div>
                        <div className="score-bars">
                          <div>
                            <span>Precision</span>
                            <div className="bar-track">
                              <div className="bar-fill precision" style={{ width: `${classMetrics.precision * 100}%` }} />
                            </div>
                          </div>
                          <div>
                            <span>Recall</span>
                            <div className="bar-track">
                              <div className="bar-fill recall" style={{ width: `${classMetrics.recall * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="confusion-panel">
                  <h3>Confusion Matrix</h3>
                  <div className="matrix">
                    <div className="matrix-corner" />
                    {voiceMetrics.labels.map((label) => (
                      <div className="matrix-label" key={`pred-${label}`}>Pred {label}</div>
                    ))}
                    {voiceMetrics.confusion_matrix.map((row, rowIndex) => (
                      <div className="matrix-row" key={voiceMetrics.labels[rowIndex]}>
                        <div className="matrix-label">True {voiceMetrics.labels[rowIndex]}</div>
                        {row.map((value, colIndex) => (
                          <div
                            className={`matrix-cell ${rowIndex === colIndex ? 'correct' : 'incorrect'}`}
                            key={`${rowIndex}-${colIndex}`}
                          >
                            {value}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="metrics-empty">Loading model metrics...</div>
            )}
          </section>

          <RecordingSection authToken={authToken} onUpload={handleRecordingUpload} />

          <section className="recordings-section">
            <div className="section-header">
              <h2>Recording History</h2>
              <SearchBar onSearch={handleSearch} />
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
                <button onClick={() => setError(null)}>x</button>
              </div>
            )}

            {loading && !searchQuery ? (
              <div className="loading">Loading recordings...</div>
            ) : filteredRecordings.length === 0 ? (
              <div className="empty-state">
                <p>
                  {searchQuery
                    ? 'No recordings match your search.'
                    : 'No recordings yet. Start by recording a conversation above.'}
                </p>
              </div>
            ) : (
              <>
                <RecordingList
                  recordings={filteredRecordings}
                  authToken={authToken}
                  onDelete={handleRecordingDelete}
                  onUpdate={handleRecordingUpdate}
                />

                {totalPages > 1 && !searchQuery && (
                  <div className="pagination">
                    <button
                      onClick={() => fetchRecordings(page - 1)}
                      disabled={page === 1}
                      className="btn-pagination"
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchRecordings(page + 1)}
                      disabled={page === totalPages}
                      className="btn-pagination"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
          </main>
        )}

        <footer className="app-footer">
          <p>(c) 2026 AI Web-Based Smart Note System. Developed by Sarah Ntwari.</p>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

export default App
