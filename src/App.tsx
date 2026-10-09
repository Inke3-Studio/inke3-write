import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import ShelfPage from '@/pages/ShelfPage'
import EditorPage from '@/pages/EditorPage'
import DashboardPage from '@/pages/DashboardPage'
import type { Book } from '@/lib/types'

type Page = 'shelf' | 'editor' | 'dashboard'

export default function App() {
  const { session, loading } = useAuth()
  const [page, setPage] = useState<Page>(() => {
    const saved = sessionStorage.getItem('activeBook')
    return saved ? 'editor' : 'shelf'
  })
  const [activeBook, setActiveBook] = useState<Book | null>(() => {
    const saved = sessionStorage.getItem('activeBook')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (activeBook) {
      sessionStorage.setItem('activeBook', JSON.stringify(activeBook))
    } else {
      sessionStorage.removeItem('activeBook')
    }
  }, [activeBook])

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', fontFamily: "'Noto Sans SC', sans-serif"
      }}>
        <span style={{ opacity: 0.3, fontSize: 14 }}>加载中…</span>
      </div>
    )
  }

  if (!session) return <LoginPage />

  if (page === 'dashboard') {
    return (
      <DashboardPage
        session={session}
        onBack={() => setPage('shelf')}
      />
    )
  }

  if (page === 'editor' && activeBook) {
    return (
      <EditorPage
        session={session}
        book={activeBook}
        onBack={() => {
          setActiveBook(null)
          setPage('shelf')
        }}
      />
    )
  }

  return (
    <ShelfPage
      session={session}
      onOpenBook={(book) => {
        setActiveBook(book)
        setPage('editor')
      }}
      onOpenDashboard={() => setPage('dashboard')}
    />
  )
}
