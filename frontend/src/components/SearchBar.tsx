import { useState, useRef } from 'react'
import './SearchBar.css'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    setQuery(value)

    // Debounce search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearch(value)
    }, 300)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="🔍 Search by title, transcript, or summary..."
        value={query}
        onChange={handleInputChange}
        className="search-input"
      />
      {query && (
        <button onClick={handleClear} className="search-clear">
          ✕
        </button>
      )}
    </div>
  )
}
