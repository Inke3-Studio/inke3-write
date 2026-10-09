import { memo } from 'react'
import type { Session } from '@supabase/supabase-js'
import { signOut } from '@/lib/auth'
import ThemeSwitcher from '@/components/ThemeSwitcher'

interface Props {
  session: Session
  bookTitle: string
  isMobile: boolean
  sidebarOpen: boolean
  theme: string
  onToggleSidebar: () => void
  onBack: () => void
  onImportTxt: () => void
  onExportTxt: () => void
  onPreview: () => void
  onSetTheme: (theme: string) => void
}

const EditorTopbar = memo(function EditorTopbar({
  session, bookTitle, isMobile, sidebarOpen, theme,
  onToggleSidebar, onBack, onImportTxt, onExportTxt, onPreview, onSetTheme,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        background: 'var(--toolbar-bg, var(--paper))',
        height: 44,
        padding: '0 14px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 30,
        overflow: 'hidden',
        gap: 4,
      }}
    >
      <button
        onClick={onToggleSidebar}
        style={{
          background: sidebarOpen ? 'var(--active)' : 'none',
          border: 'none', cursor: 'pointer',
          fontSize: 16, color: 'var(--text)', padding: '4px 8px',
          opacity: 0.5, borderRadius: 4,
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        ☰
      </button>

      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: 'var(--text-muted)', padding: '4px 0',
          flexShrink: 0, whiteSpace: 'nowrap',
        }}
      >
        ← {isMobile ? '' : '书架'}
      </button>
      {!isMobile && (
        <>
          <span style={{ fontSize: 13, opacity: 0.2 }}>·</span>
          <span style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            minWidth: 0, flexShrink: 1,
          }}>
            {bookTitle}
          </span>
        </>
      )}

      <div style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'center',
        gap: isMobile ? 4 : 8, flexShrink: 0,
      }}>
        <TopbarBtn onClick={onImportTxt} title="导入 TXT" bordered>
          {isMobile ? '导入' : '导入TXT'}
        </TopbarBtn>
        {!isMobile && (
          <TopbarBtn onClick={onPreview} title="手机预览" bordered>
            📱 预览
          </TopbarBtn>
        )}
        <TopbarBtn onClick={onExportTxt} title="导出 TXT" bordered>
          {isMobile ? '导出' : '导出TXT'}
        </TopbarBtn>
        <ThemeSwitcher theme={theme} setTheme={onSetTheme} />
        {!isMobile && (
          <span style={{
            fontSize: 11, opacity: 0.35, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120,
          }}>
            {session.user.email}
          </span>
        )}
        <button
          onClick={signOut}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text-muted)', opacity: 0.6,
            padding: '4px 6px', borderRadius: 4, whiteSpace: 'nowrap',
          }}
        >
          退出
        </button>
      </div>
    </div>
  )
})

function TopbarBtn({
  onClick, title, bordered, children,
}: {
  onClick: () => void
  title: string
  bordered?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none',
        border: bordered ? '1px solid var(--border)' : 'none',
        borderRadius: 4, padding: '3px 8px', fontSize: 11,
        cursor: 'pointer', color: 'var(--text)', opacity: 0.6,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

export default EditorTopbar
