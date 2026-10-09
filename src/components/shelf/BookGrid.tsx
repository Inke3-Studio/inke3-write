import { useEffect, useState } from 'react'
import type { Book } from '@/lib/types'
import BookCard from './BookCard'

interface Props {
  books: Book[]
  editingBookId: string | null
  onOpen: (book: Book) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onStartEdit: (id: string) => void
  onFinishEdit: () => void
  onCoverChange: (id: string, url: string) => void
}

export default function BookGrid({
  books, editingBookId,
  onOpen, onRename, onDelete,
  onStartEdit, onFinishEdit,
  onCoverChange,
}: Props) {
  const [renameVal, setRenameVal] = useState('')

  useEffect(() => {
    if (editingBookId) {
      const b = books.find(x => x.id === editingBookId)
      setRenameVal(b?.title ?? '')
    }
  }, [editingBookId, books])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {books.map(book => (
        <BookCard
          key={book.id}
          book={book}
          isRenaming={editingBookId === book.id}
          renameVal={renameVal}
          onOpen={() => onOpen(book)}
          onStartRename={() => {
            onStartEdit(book.id)
            setRenameVal(book.title)
          }}
          onRenameChange={setRenameVal}
          onConfirmRename={() => {
            onRename(book.id, renameVal)
            onFinishEdit()
          }}
          onDelete={() => onDelete(book.id)}
          onCoverChange={onCoverChange}
        />
      ))}
    </div>
  )
}
