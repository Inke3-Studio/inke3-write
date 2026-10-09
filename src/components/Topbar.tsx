interface Props {
    email: string
    bookTitle: string
    onBack: () => void
    onSignOut: () => void
  }
  
  export default function Topbar({ email, bookTitle, onBack, onSignOut }: Props) {
    return (
      <div style={{
        height: 44, display: 'flex', alignItems: 'center',
        padding: '0 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', flexShrink: 0, gap: 12
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, opacity: 0.5, color: 'var(--text)', padding: '0 4px'
        }}>← 书架</button>
        <span style={{ fontSize: 13, opacity: 0.6 }}>{bookTitle}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, opacity: 0.4 }}>{email}</span>
          <button onClick={onSignOut} style={{
            fontSize: 12, background: 'none', border: 'none',
            cursor: 'pointer', opacity: 0.5, color: 'var(--text)'
          }}>退出</button>
        </div>
      </div>
    )
  }