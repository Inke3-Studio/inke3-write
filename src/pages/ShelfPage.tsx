import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useBooks } from '@/hooks/useBooks'
import { signOut } from '@/lib/auth'
import type { Book } from '@/lib/types'
import ShelfTopbar from '@/components/shelf/ShelfTopbar'
import BookGrid from '@/components/shelf/BookGrid'
import FolderCard from '../components/shelf/FolderCard'
import FolderPage from './FolderPage'

interface Props {
  session: Session
  onOpenBook: (book: Book) => void
  onOpenDashboard: () => void
}

export default function ShelfPage({ session, onOpenBook, onOpenDashboard }: Props) {
  const {
    books, folders, loading,
    createBook, createFolder,
    deleteBook, deleteFolder,
    renameBook, renameFolder,
    updateCover,
  } = useBooks(session.user.id)

  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [openFolderId, setOpenFolderId] = useState<string | null>(null)

  const handleCreateBook = async (folderId?: string) => {
    const book = await createBook(folderId)
    if (book) setEditingBookId(book.id)
  }

  const handleCreateFolder = async () => {
    const folder = await createFolder()
    if (folder) setEditingFolderId(folder.id)
  }

  const looseBooks = books.filter(b => !b.folder_id)

  // 文件夹内页
  if (openFolderId) {
    const folder = folders.find(f => f.id === openFolderId)
    if (!folder) return null
    return (
      <FolderPage
        folder={folder}
        books={books.filter(b => b.folder_id === openFolderId)}
        editingBookId={editingBookId}
        onBack={() => setOpenFolderId(null)}
        onCreateBook={() => handleCreateBook(openFolderId)}
        onOpenBook={onOpenBook}
        onRenameBook={renameBook}
        onDeleteBook={deleteBook}
        onMoveBook={() => {}}
        onStartEditBook={setEditingBookId}
        onFinishEditBook={() => setEditingBookId(null)}
        onCoverChange={updateCover}
      />
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      fontFamily: "'Noto Sans SC', sans-serif", color: 'var(--text)'
    }}>
      <ShelfTopbar
        email={session.user.email ?? ''}
        onCreateBook={() => handleCreateBook()}
        onCreateFolder={handleCreateFolder}
        onSignOut={signOut}
      />

      {/* 写作统计入口 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 32px 0' }}>
        <button
          onClick={onOpenDashboard}
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--text)',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
           写作统计
        </button>
      </div>

      <div style={{ padding: '32px 32px 64px', maxWidth: 1100, margin: '0 auto' }}>
        {loading ? (
          <p style={{ opacity: 0.3, fontSize: 14 }}>加载中…</p>
        ) : books.length === 0 && folders.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 120, opacity: 0.25 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
            <p style={{ fontSize: 15 }}>书架还是空的，新建一本书开始写作</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {folders.map(folder => (
              <FolderCard
                key={folder.id}
                folder={folder}
                books={books.filter(b => b.folder_id === folder.id)}
                onClick={() => setOpenFolderId(folder.id)}
                onRename={(name: string) => renameFolder(folder.id, name)}
                onDelete={() => deleteFolder(folder.id)}
                isEditingName={editingFolderId === folder.id}
                onStartEditName={() => setEditingFolderId(folder.id)}
                onFinishEditName={() => setEditingFolderId(null)}
              />
            ))}

            <BookGrid
              books={looseBooks}
              editingBookId={editingBookId}
              onOpen={onOpenBook}
              onRename={renameBook}
              onDelete={deleteBook}
              onStartEdit={setEditingBookId}
              onFinishEdit={() => setEditingBookId(null)}
              onCoverChange={updateCover}
            />
          </div>
        )}
      </div>
    </div>
  )
}
