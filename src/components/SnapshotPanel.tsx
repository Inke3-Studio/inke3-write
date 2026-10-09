import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Snapshot {
  id: string
  content: string
  title: string
  word_count: number
  created_at: string
}

interface Props {
  /** 现在传 book_id（单 Y.Doc 模式） */
  chapterId: string
  onRestore: (content: string, title: string) => void
  onClose: () => void
}

export default function SnapshotPanel({ chapterId, onRestore, onClose }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // 先从新表 book_snapshots 读取
      const { data: bookSnaps } = await supabase
        .from('book_snapshots')
        .select('id, content, word_count, created_at')
        .eq('book_id', chapterId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (bookSnaps && bookSnaps.length > 0) {
        // 新表没有 title 字段，用空字符串
        setSnapshots(bookSnaps.map(s => ({ ...s, title: '' })))
      } else {
        // 向下兼容：从旧表 chapter_snapshots 读取
        const { data: chapterSnaps } = await supabase
          .from('chapter_snapshots')
          .select('id, content, title, word_count, created_at')
          .eq('chapter_id', chapterId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (chapterSnaps) setSnapshots(chapterSnaps)
      }

      setLoading(false)
    }
    load()
  }, [chapterId])

  const previewSnap = snapshots.find((s) => s.id === previewId)

  const handleRestore = (snap: Snapshot) => {
    if (confirmId === snap.id) {
      onRestore(snap.content, snap.title)
      setConfirmId(null)
    } else {
      setConfirmId(snap.id)
      setTimeout(() => setConfirmId((prev) => (prev === snap.id ? null : prev)), 3000)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hours = d.getHours().toString().padStart(2, '0')
    const mins = d.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hours}:${mins}`
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins} 分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} 小时前`
    const days = Math.floor(hours / 24)
    return `${days} 天前`
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        maxWidth: '100vw',
        background: 'var(--paper, #fff)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Noto Sans SC', sans-serif",
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>历史版本</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            color: 'var(--text)',
            opacity: 0.4,
            padding: '2px 6px',
          }}
        >
          ✕
        </button>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: 20, opacity: 0.4, fontSize: 13 }}>加载中…</div>
        ) : snapshots.length === 0 ? (
          <div style={{ padding: 20, opacity: 0.4, fontSize: 13 }}>
            暂无历史版本，写作 5 分钟后会自动保存第一个快照
          </div>
        ) : previewId && previewSnap ? (
          /* 预览模式 */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg)',
              }}
            >
              <button
                onClick={() => setPreviewId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--text)',
                  opacity: 0.6,
                  padding: 0,
                }}
              >
                ← 返回列表
              </button>
              <span style={{ fontSize: 11, opacity: 0.4 }}>
                {formatTime(previewSnap.created_at)} · {previewSnap.word_count} 字
              </span>
            </div>

            {/* 快照标题（可能为空） */}
            {previewSnap.title && (
              <div
                style={{
                  padding: '12px 16px 4px',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {previewSnap.title}
              </div>
            )}

            {/* 快照内容 */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 16px 20px',
                fontSize: 13,
                lineHeight: 1.9,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {previewSnap.content}
            </div>

            {/* 恢复按钮 */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => handleRestore(previewSnap)}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  background: confirmId === previewSnap.id ? '#e03131' : 'var(--text)',
                  color: '#fff',
                  transition: 'background 0.2s',
                }}
              >
                {confirmId === previewSnap.id ? '确认恢复？当前内容将被覆盖' : '恢复此版本'}
              </button>
            </div>
          </div>
        ) : (
          /* 列表模式 */
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                onClick={() => setPreviewId(snap.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--active, rgba(0,0,0,0.03))'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, opacity: 0.4 }}>{snap.word_count} 字</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.35, marginTop: 4 }}>
                  {formatTime(snap.created_at)} · {timeAgo(snap.created_at)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.5,
                    marginTop: 6,
                    lineHeight: 1.5,
                    maxHeight: 36,
                    overflow: 'hidden',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {snap.content.slice(0, 80)}
                  {snap.content.length > 80 ? '…' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
