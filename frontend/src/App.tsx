import { useState, useEffect } from 'react'
import RecordingSection from './components/RecordingSection'
import RecordingList from './components/RecordingList'
import ErrorBoundary from './components/ErrorBoundary'
import SearchBar from './components/SearchBar'
import './App.css'

interface Recording {
  id: string
  title: string
  created_at: string
  duration: number
  file_size: number
  summary_text?: string
  transcript_text?: string
  key_points?: string[]
}

function App() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchRecordings = async (pageNum = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/recordings?page=${pageNum}&limit=10`)
      
      if (!response.ok) {
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
      const response = await fetch(`/api/recordings/search/query?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
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

  useEffect(() => {
    fetchRecordings()
  }, [])

  const handleRecordingUpload = () => {
    fetchRecordings(1)
    setSearchQuery('')
  }

  const handleRecordingDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/recordings/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        throw new Error('Failed to delete recording')
      }

      setRecordings(recordings.filter(r => r.id !== id))
      setFilteredRecordings(filteredRecordings.filter(r => r.id !== id))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete recording'
      setError(errorMessage)
    }
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>🎤 AI Smart Note System</h1>
          <p>Record conversations and get AI-powered summaries</p>
        </header>

        <main className="app-main">
          <RecordingSection onUpload={handleRecordingUpload} />

          <section className="recordings-section">
            <div className="section-header">
              <h2>📚 Recording History</h2>
              <SearchBar onSearch={handleSearch} />
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️ {error}</span>
                <button onClick={() => setError(null)}>✕</button>
              </div>
            )}

            {loading && !searchQuery ? (
              <div className="loading">Loading recordings...</div>
            ) : filteredRecordings.length === 0 ? (
              <div className="empty-state">
                <p>
                  {searchQuery
                    ? '❌ No recordings match your search'
                    : '📭 No recordings yet. Start by recording a conversation above!'}
                </p>
              </div>
            ) : (
              <>
                <RecordingList
                  recordings={filteredRecordings}
                  onDelete={handleRecordingDelete}
                />

                {totalPages > 1 && !searchQuery && (
                  <div className="pagination">
                    <button
                      onClick={() => fetchRecordings(page - 1)}
                      disabled={page === 1}
                      className="btn-pagination"
                    >
                      ← Previous
                    </button>
                    <span className="page-info">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchRecordings(page + 1)}
                      disabled={page === totalPages}
                      className="btn-pagination"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        <footer className="app-footer">
          <p>© 2026  AI Smart Note System. done by Sarah All rights reserved.</p>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

export default App
