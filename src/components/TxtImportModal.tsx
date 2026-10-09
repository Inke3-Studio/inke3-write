import type { TxtChapterItem } from '@/lib/splitTxtChapters'

interface Props {
  chapters: TxtChapterItem[]
  checked: boolean[]
  overwrite: boolean
  existingCount: number
  onCheckedChange: (index: number, checked: boolean) => void
  onOverwriteChange: (value: boolean) => void
  onConfirm: () => void
  onClose: () => void
}

export default function TxtImportModal({
  chapters,
  checked,
  overwrite,
  existingCount,
  onCheckedChange,
  onOverwriteChange,
  onConfirm,
  onClose,
}: Props) {
  const selectedCount = checked.filter(Boolean).length

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.4)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          maxWidth: 600,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600 }}>确认章节切分</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: 'var(--text-muted, #999)',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <div style={{ padding: '12px 20px 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 6, opacity: 0.7 }}>
            勾选为独立章节，取消勾选则合并到上一章
          </p>
          <p style={{ marginBottom: 8 }}>
            当前已有 <strong>{existingCount}</strong> 个章节，确认导入后将
            <strong>全部替换</strong>为下方切分结果（已选 {selectedCount}/{chapters.length} 项）
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => onOverwriteChange(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              覆盖现有章节（勾选后确认导入将清空当前章节并替换）
            </span>
          </label>
        </div>

        {/* Chapter list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
          {chapters.map((ch, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-light, var(--border))',
                marginBottom: 6,
                background: checked[i] ? 'var(--active, rgba(0,0,0,0.03))' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={(e) => onCheckedChange(i, e.target.checked)}
                style={{ width: 15, height: 15, marginTop: 2, cursor: 'pointer', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {ch.title || '（无标题）'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted, #999)', marginTop: 2 }}>
                  {ch.word_count} 字
                  {ch.content.length > 0 && (
                    <>
                      {' · '}
                      {ch.content.slice(0, 60).replace(/\n/g, ' ')}
                      {ch.content.length > 60 ? '…' : ''}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 16px',
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--text)',
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!overwrite}
            style={{
              background: overwrite ? 'var(--text)' : 'var(--border)',
              color: overwrite ? 'var(--paper)' : 'var(--text-muted, #999)',
              border: 'none',
              borderRadius: 6,
              padding: '6px 16px',
              fontSize: 13,
              cursor: overwrite ? 'pointer' : 'not-allowed',
              fontWeight: 500,
              opacity: overwrite ? 1 : 0.6,
            }}
            title={!overwrite ? '请勾选「覆盖现有章节」后确认导入' : undefined}
          >
            确认导入（覆盖）
          </button>
        </div>
      </div>
    </div>
  )
}
