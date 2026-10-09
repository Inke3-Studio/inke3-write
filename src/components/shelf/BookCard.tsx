import { useRef } from 'react'
import type { Book } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface Props {
  book: Book
  isRenaming: boolean
  renameVal: string
  onOpen: () => void
  onStartRename: () => void
  onRenameChange: (v: string) => void
  onConfirmRename: () => void
  onDelete: () => void
  onCoverChange: (id: string, url: string) => void
}

const inlineInput: React.CSSProperties = {
  border: 'none', outline: '1px solid var(--border)',
  borderRadius: 4, padding: '2px 6px', fontSize: 12,
  background: 'var(--bg)', color: 'var(--text)', width: '100%'
}

function formatWordCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万字'
  return n + '字'
}

export default function BookCard({
  book, isRenaming, renameVal,
  onOpen, onStartRename, onRenameChange, onConfirmRename, onDelete,
  onCoverChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // 重置以便再次选同一文件也能触发
    e.target.value = ''

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${book.user_id}/${book.id}.${ext}`

    try {
      const { error } = await supabase.storage
        .from('write-covers')
        .upload(path, file, { upsert: true })

      if (error) {
        alert('上传封面失败: ' + error.message)
        console.error('上传封面失败:', error)
        return
      }

      const { data: urlData } = supabase.storage.from('write-covers').getPublicUrl(path)
      const publicUrl = urlData.publicUrl + '?t=' + Date.now()

      const { error: dbError } = await supabase.from('books').update({ cover: publicUrl }).eq('id', book.id)
      if (dbError) {
        alert('保存封面URL失败: ' + dbError.message)
        return
      }

      onCoverChange(book.id, publicUrl)
    } catch (err) {
      alert('上传出错: ' + (err as Error).message)
      console.error(err)
    }
  }

  return (
    <div className="book-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 128 }}>
      {/* 封面 */}
      <div
        onClick={onOpen}
        style={{
          width: 128,
          height: 170,
          borderRadius: 6,
          background: 'var(--paper)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          transition: 'box-shadow 0.2s, transform 0.2s',
          boxShadow: '0 2px 8px var(--paper-shadow, rgba(0,0,0,0.06))',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 6px 20px var(--paper-shadow, rgba(0,0,0,0.12))'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 2px 8px var(--paper-shadow, rgba(0,0,0,0.06))'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: 36, opacity: 0.15 }}>📖</span>
        )}

        {/* hover 卡片时显示 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            fileRef.current?.click()
          }}
          className="cover-upload-btn"
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 10,
            cursor: 'pointer',
            opacity: 0,
            transition: 'opacity 0.15s',
            pointerEvents: 'auto',
          }}
        >
          换封面
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleUploadCover}
      />

      {/* 书名 */}
      {isRenaming ? (
        <input
          autoFocus
          value={renameVal}
          onChange={e => onRenameChange(e.target.value)}
          onBlur={onConfirmRename}
          onKeyDown={e => e.key === 'Enter' && onConfirmRename()}
          style={inlineInput}
        />
      ) : (
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            textAlign: 'center',
            cursor: 'pointer',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          onDoubleClick={onStartRename}
          title="双击重命名"
        >
          {book.title || '无标题'}
        </span>
      )}

      {/* 字数 · 章节数 */}
      <div style={{
        fontSize: 11,
        color: 'var(--text-muted, #999)',
        textAlign: 'center',
        lineHeight: 1.3,
      }}>
        {formatWordCount(book.word_count || 0)}
        {book.chapter_count > 0 && (
          <span> · {book.chapter_count}章</span>
        )}
      </div>

      {/* 删除 */}
      <button
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 11,
          cursor: 'pointer',
          color: 'var(--text-muted, #999)',
          opacity: 0,
          alignSelf: 'center',
          padding: '2px 8px',
          borderRadius: 4,
          transition: 'opacity 0.2s',
        }}
        className="book-delete-btn"
      >
        删除
      </button>

      {/* hover 显示封面上传和删除按钮 */}
      <style>{`
        .book-card-wrapper:hover .cover-upload-btn { opacity: 1 !important; }
        .book-card-wrapper:hover .book-delete-btn { opacity: 0.5 !important; }
      `}</style>
    </div>
  )
}
