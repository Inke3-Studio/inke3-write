interface Props {
    email: string
    onCreateBook: () => void
    onCreateFolder: () => void
    onSignOut: () => void
  }
  
  const ghostBtn: React.CSSProperties = {
    background: 'none', border: '1px solid var(--border)',
    borderRadius: 5, padding: '4px 10px', fontSize: 12,
    cursor: 'pointer', color: 'var(--text)', opacity: 0.6
  }
  
  const primaryBtn: React.CSSProperties = {
    background: 'var(--text)', color: 'var(--bg)',
    border: 'none', borderRadius: 5, padding: '5px 14px',
    fontSize: 12, cursor: 'pointer'
  }
  
  export default function ShelfTopbar({ email, onCreateBook, onCreateFolder, onSignOut }: Props) {
    return (
      <div style={{
        height: 52, display: 'flex', alignItems: 'center',
        padding: '0 32px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10
      }}>
        <span style={{ fontFamily: "'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif", fontSize: 15, fontWeight: 600, opacity: 0.85 }}>
          ✦ 写作
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={onCreateFolder} style={ghostBtn}>＋ 文件夹</button>
          <button onClick={onCreateBook} style={primaryBtn}>＋ 新建书籍</button>
          <span style={{ fontSize: 12, opacity: 0.35, marginLeft: 8 }}>{email}</span>
          <button onClick={onSignOut} style={ghostBtn}>退出</button>
        </div>
      </div>
    )
  }