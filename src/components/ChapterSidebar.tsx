import { memo } from 'react'
import type { ChapterInfo } from '@/hooks/useChapterOutline'

interface Props {
  chapters: ChapterInfo[]
  focusedChapterId: string | null
  ready: boolean
  isMobile: boolean
  sidebarOpen: boolean
  onSelect: (id: string) => void
  onNewChapter: () => void
  onClose: () => void
}

const ChapterSidebar = memo(function ChapterSidebar({
  chapters, focusedChapterId, ready, isMobile, sidebarOpen,
  onSelect, onNewChapter, onClose,
}: Props) {
  return (
    <>
      {/* 遮罩（仅移动端） */}
      {isMobile && sidebarOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.25)', zIndex: 19,
            transition: 'opacity 0.2s',
          }}
        />
      )}

      <aside
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.25s ease, transform 0.25s ease',
          overflow: 'hidden',
          ...(isMobile
            ? {
                position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 20,
                width: 220,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                boxShadow: sidebarOpen ? '4px 0 16px rgba(0,0,0,0.1)' : 'none',
              }
            : {
                width: sidebarOpen ? 220 : 0,
                borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
              }),
        }}
      >
        {/* 头部 */}
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 10, letterSpacing: '0.08em', opacity: 0.4, textTransform: 'uppercase' }}>
            章节
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={onNewChapter}
              style={{
                fontSize: 18, background: 'var(--btn)', border: 'none', cursor: 'pointer',
                width: 22, height: 22, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text)', opacity: 0.6,
              }}
            >
              ＋
            </button>
            <button
              onClick={onClose}
              style={{
                fontSize: 14, background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text)', opacity: 0.35, padding: '2px 4px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 章节列表 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {!ready ? (
            <p style={{ padding: '12px 14px', fontSize: 12, opacity: 0.4 }}>加载中…</p>
          ) : chapters.length === 0 ? (
            <p style={{ padding: '12px 14px', fontSize: 12, opacity: 0.4 }}>
              还没有章节，用 H1 标题创建章节
            </p>
          ) : (
            chapters.map((chapter) => {
              const isFocused = focusedChapterId === chapter.id
              return (
                <div
                  key={chapter.id}
                  onClick={() => onSelect(chapter.id)}
                  style={{
                    padding: '8px 14px', cursor: 'pointer', borderRadius: 6,
                    margin: '1px 6px',
                    background: isFocused ? 'var(--active)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isFocused ? 500 : 400,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {chapter.title || '无标题'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, opacity: 0.35, marginTop: 2 }}>
                    <span>{chapter.wordCount} 字</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
})

export default ChapterSidebar
