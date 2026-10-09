import type { Draft } from '@/lib/types'

interface Props {
  drafts: Draft[]
  loading: boolean
  activeDraftId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
}

export default function Sidebar({ drafts, loading, activeDraftId, onSelect, onCreate }: Props) {
  return (
    <aside style={{
      width: 220, background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0
    }}>
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: 10, letterSpacing: '0.08em', opacity: 0.4, textTransform: 'uppercase' }}>
          草稿
        </span>
        <button onClick={onCreate} style={{
          fontSize: 18, background: 'var(--btn)', border: 'none', cursor: 'pointer',
          width: 22, height: 22, borderRadius: 4, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--text)', opacity: 0.6
        }}>＋</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {loading ? (
          <p style={{ padding: '12px 14px', fontSize: 12, opacity: 0.4 }}>加载中…</p>
        ) : drafts.length === 0 ? (
          <p style={{ padding: '12px 14px', fontSize: 12, opacity: 0.4 }}>还没有草稿</p>
        ) : drafts.map(draft => (
          <div
            key={draft.id}
            onClick={() => onSelect(draft.id)}
            style={{
              padding: '8px 14px', cursor: 'pointer', borderRadius: 6,
              margin: '1px 6px',
              background: activeDraftId === draft.id ? 'var(--active)' : 'transparent'
            }}
          >
            <div style={{
              fontSize: 13,
              fontWeight: activeDraftId === draft.id ? 500 : 400,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {draft.title || '无标题'}
            </div>
            <div style={{ fontSize: 10, opacity: 0.35, marginTop: 2 }}>
              {new Date(draft.updated_at).toLocaleDateString('zh-CN')}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}