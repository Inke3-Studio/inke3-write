import { useState, useRef, useEffect } from 'react'
import type { Book, Folder } from '@/lib/types'

interface Props {
  folder: Folder
  books: Book[]
  onClick: () => void
  onRename: (name: string) => void
  onDelete: () => void
  isEditingName: boolean
  onStartEditName: () => void
  onFinishEditName: () => void
}

export default function FolderCard({
  folder, books, onClick, onRename, onDelete,
  isEditingName, onStartEditName, onFinishEditName
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [nameVal, setNameVal] = useState(folder.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditingName) {
      setNameVal(folder.name)
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [isEditingName])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const confirmRename = () => {
    if (nameVal.trim()) onRename(nameVal.trim())
    onFinishEditName()
  }

  const previewBooks = books.slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 120, position: 'relative' }}>
      {/* 文件夹封面 */}
      <div
        onClick={onClick}
        style={{
          width: 120, height: 160, borderRadius: 6,
          background: 'var(--sidebar)', border: '1px solid var(--border)',
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          transition: 'box-shadow 0.15s, transform 0.15s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.13)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {previewBooks.length === 0 ? (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 32, opacity: 0.3
          }}>📁</div>
        ) : (
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {previewBooks.map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 72, height: 96,
                borderRadius: 4,
                background: ['#d4c5b0', '#c5b89e', '#b5a88e'][i],
                border: '1px solid rgba(0,0,0,0.08)',
                transform: `rotate(${[-6, 0, 6][i]}deg) translateY(${[-4, 0, 4][i]}px)`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20
              }}>📖</div>
            ))}
          </div>
        )}
      </div>

      {/* 文件夹名 */}
      {isEditingName ? (
        <input
          ref={inputRef}
          value={nameVal}
          onChange={e => setNameVal(e.target.value)}
          onBlur={confirmRename}
          onKeyDown={e => e.key === 'Enter' && confirmRename()}
          style={{
            border: 'none', outline: '1.5px solid var(--text)',
            borderRadius: 4, padding: '2px 6px', fontSize: 12,
            background: 'var(--bg)', color: 'var(--text)',
            width: '100%', textAlign: 'center'
          }}
        />
      ) : (
        <span style={{
          fontSize: 12, textAlign: 'center', lineHeight: 1.4, color: 'var(--text)'
        }}>
          {folder.name}
        </span>
      )}

      {/* 书籍数量 */}
      <div style={{ textAlign: 'center', fontSize: 10, opacity: 0.4 }}>
        {books.length} 本
      </div>

      {/* 三点菜单 */}
      <div ref={menuRef} style={{ position: 'absolute', top: 6, right: 6 }}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
          style={{
            width: 24, height: 24, borderRadius: 4,
            background: menuOpen ? 'var(--active)' : 'rgba(0,0,0,0.06)',
            border: 'none', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text)', opacity: 0.7
          }}
        >···</button>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: 28, right: 0, zIndex: 100,
            background: 'var(--paper)', border: '1px solid var(--border)',
            borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            overflow: 'hidden', minWidth: 120
          }}>
            {[
              { label: '重命名', action: () => { setMenuOpen(false); onStartEditName() } },
              { label: '删除文件夹', action: () => { setMenuOpen(false); onDelete() }, danger: true },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  display: 'block', width: '100%', padding: '9px 14px',
                  background: 'none', border: 'none', textAlign: 'left',
                  fontSize: 13, cursor: 'pointer',
                  color: item.danger ? '#e07a5f' : 'var(--text)',
                  borderBottom: '1px solid var(--border)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--active)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >{item.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}