import { useState, useEffect } from 'react'

const THEMES = [
  { id: 'light', label: '默认', color: '#ffffff', border: '#ddd' },
  { id: 'dark', label: '暗色', color: '#2c2c2e', border: '#2c2c2e' },
  { id: 'sepia', label: '暖黄', color: '#f4ede4', border: '#ddd5c8' },
  { id: 'green', label: '豆绿', color: '#e8efe8', border: '#cddacd' },
  { id: 'blue', label: '淡蓝', color: '#e6ecf2', border: '#ccd6e2' },
]

const STORAGE_KEY = 'inke3-theme'

function getInitialTheme(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'light'
  } catch {
    return 'light'
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return { theme, setTheme }
}

interface Props {
  theme: string
  setTheme: (t: string) => void
}

export default function ThemeSwitcher({ theme, setTheme }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative', zIndex: 50 }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        title="主题/护眼"
        style={{
          background: open ? 'var(--active)' : 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: 14,
          opacity: open ? 0.9 : 0.5,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 4,
        }}
      >
        ◐
      </button>

      {open && (
        <>
          {/* 点击外部关闭 */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 36,
              right: 0,
              background: 'var(--paper)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 12px',
              zIndex: 50,
              boxShadow: '0 6px 20px var(--paper-shadow, rgba(0,0,0,0.1))',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {THEMES.map((t) => (
              <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => {
                    setTheme(t.id)
                    setOpen(false)
                  }}
                  title={t.label}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: t.color,
                    border: theme === t.id
                      ? '2px solid var(--accent, #4a7dff)'
                      : `1.5px solid ${t.border}`,
                    cursor: 'pointer',
                    transition: 'transform 0.15s, border-color 0.2s',
                    transform: theme === t.id ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: theme === t.id
                      ? '0 0 0 2px var(--accent-soft)'
                      : '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                />
                <span style={{
                  fontSize: 10,
                  color: theme === t.id ? 'var(--text)' : 'var(--text-muted, #999)',
                  fontWeight: theme === t.id ? 500 : 400,
                }}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
