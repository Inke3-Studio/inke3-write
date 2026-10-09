interface Props {
  saveStatus: 'saved' | 'saving' | 'offline'
  /** 当前聚焦章节的字数 */
  chapterWordCount: number
  /** 当前聚焦章节的标题 */
  chapterTitle?: string
  totalBookWords: number
  wordsPerHour?: number
  onDelete: () => void
  showDelete: boolean
}

const statusText = {
  saved: '已保存',
  saving: '保存中…',
  offline: '离线',
}

const statusColor = {
  saved: '#7ab87a',
  saving: '#e8a44a',
  offline: '#e07a5f',
}

export default function Statusbar({
  saveStatus,
  chapterWordCount,
  chapterTitle,
  totalBookWords,
  wordsPerHour,
  onDelete,
  showDelete,
}: Props) {
  return (
    <div
      style={{
        height: 32,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
        fontSize: 11,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      {/* 保存状态 */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          color: statusColor[saveStatus],
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            display: 'inline-block',
          }}
        />
        {statusText[saveStatus]}
      </span>

      {/* 当前章节 */}
      {chapterTitle && (
        <span style={{ opacity: 0.35, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chapterTitle}
        </span>
      )}

      {/* 本章字数 */}
      <span style={{ opacity: 0.4 }}>本章 {chapterWordCount} 字</span>

      {/* 全书字数 */}
      <span style={{ opacity: 0.4 }}>全书 {totalBookWords} 字</span>

      {/* 码字速度 */}
      {wordsPerHour !== undefined && wordsPerHour > 0 && (
        <span style={{ opacity: 0.4 }}>{wordsPerHour} 字/时</span>
      )}

      {showDelete && (
        <button
          onClick={onDelete}
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            opacity: 0.35,
            color: 'var(--text)',
          }}
        >
          删除章节
        </button>
      )}
    </div>
  )
}
