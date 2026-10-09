import type { Book, Folder } from '@/lib/types'
import BookGrid from '@/components/shelf/BookGrid'

interface Props {
  folder: Folder
  books: Book[]
  editingBookId: string | null
  onBack: () => void
  onCreateBook: () => void
  onOpenBook: (book: Book) => void
  onRenameBook: (id: string, title: string) => void
  onDeleteBook: (id: string) => void
  onMoveBook: (id: string) => void
  onStartEditBook: (id: string) => void
  onFinishEditBook: () => void
  onCoverChange: (id: string, url: string) => void
}

export default function FolderPage({
  folder, books, editingBookId,
  onBack, onCreateBook, onOpenBook,
  onRenameBook, onDeleteBook,
  onStartEditBook, onFinishEditBook,
  onCoverChange,
}: Props) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      fontFamily: "'Noto Sans SC', sans-serif", color: 'var(--text)'
    }}>
      {/* 顶栏 */}
      <div style={{
        height: 52, display: 'flex', alignItems: 'center',
        padding: '0 32px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10, gap: 12
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, opacity: 0.5, color: 'var(--text)'
        }}>← 书架</button>
        <span style={{ fontSize: 15, fontWeight: 500 }}>📁 {folder.name}</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onCreateBook} style={{
            background: 'var(--text)', color: 'var(--bg)',
            border: 'none', borderRadius: 5, padding: '5px 14px',
            fontSize: 12, cursor: 'pointer'
          }}>＋ 新建书籍</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
        {books.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 80, opacity: 0.25 }}>
            <p style={{ fontSize: 14 }}>文件夹是空的</p>
          </div>
        ) : (
          <BookGrid
            books={books}
            editingBookId={editingBookId}
            onOpen={onOpenBook}
            onRename={onRenameBook}
            onDelete={onDeleteBook}
            onStartEdit={onStartEditBook}
            onFinishEdit={onFinishEditBook}
            onCoverChange={onCoverChange}
          />
        )}
      </div>
    </div>
  )
}