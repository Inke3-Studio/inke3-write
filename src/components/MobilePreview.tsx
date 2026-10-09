import { useState, useRef, useEffect } from 'react'

interface Props {
  title: string
  bookTitle: string
  content: string
  wordCount: number
  onClose: () => void
}

const PHONE_PRESETS = [
  { label: 'iPhone 17 Pro Max', vw: 440, vh: 956 },
  { label: 'iPhone 17 Pro', vw: 402, vh: 874 },
  { label: 'iPhone SE', vw: 375, vh: 667 },
  { label: 'Android', vw: 412, vh: 915 },
]

const PREVIEW_FONTS = [
  { label: '默认样式', value: "'Noto Serif SC', serif" },
  { label: '黑体', value: "'Noto Sans SC', sans-serif" },
  { label: '楷体', value: "'LXGW WenKai', cursive" },
]

export default function MobilePreview({ title, bookTitle, content, wordCount, onClose }: Props) {
  const [phoneIndex, setPhoneIndex] = useState(0)
  const [fontSize, setFontSize] = useState(17)
  const [fontIndex, setFontIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 300, h: 500 })

  const phone = PHONE_PRESETS[phoneIndex]
  const font = PREVIEW_FONTS[fontIndex]

  // 监测容器大小来计算 scale
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      setContainerSize({ w: el.clientWidth, h: el.clientHeight })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // scale 让手机壳适配容器，留 padding
  const padX = 32
  const padY = 16
  const scaleX = (containerSize.w - padX) / phone.vw
  const scaleY = (containerSize.h - padY) / phone.vh
  const scale = Math.min(scaleX, scaleY, 0.65)

  const formattedContent = content

  const currentTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      style={{
        width: 340,
        borderLeft: '1px solid var(--border)',
        background: 'var(--sidebar)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.6 }}>章节预览</span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, color: 'var(--text)', opacity: 0.4, padding: '2px 6px',
          }}
        >
          ✕
        </button>
      </div>

      {/* 手机渲染区 */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: phone.vw * scale,
            height: phone.vh * scale,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: phone.vw,
              height: phone.vh,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              borderRadius: 44,
              border: '4px solid #2a2a2a',
              background: '#faf9f6',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            {/* iOS 状态栏 */}
            <div
              style={{
                height: 54,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                padding: '0 28px 6px',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{currentTime}</span>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.4 }}>
                <span style={{ fontSize: 12 }}>📶</span>
                <span style={{ fontSize: 12 }}>🔋</span>
              </div>
            </div>

            {/* 阅读器导航 */}
            <div
              style={{
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '0.5px solid #e5e3dd',
                flexShrink: 0,
                background: '#faf9f6',
              }}
            >
              <span style={{ fontSize: 15, opacity: 0.35, fontFamily: font.value }}>‹ 目录</span>
              <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.6, fontFamily: font.value }}>
                {title || '章节预览'}
              </span>
              <span style={{ fontSize: 15, opacity: 0.35 }}>⋯</span>
            </div>

            {/* 正文 */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
              }}
            >
              {/* 书名 + 章节 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                  paddingBottom: 12,
                  borderBottom: '0.5px solid #e5e3dd',
                }}
              >
                <span style={{ fontSize: 14, opacity: 0.3, fontFamily: font.value }}>{bookTitle}</span>
                <span style={{ fontSize: 14, opacity: 0.3, fontFamily: font.value }}>{title}</span>
              </div>

              <div
                style={{
                  fontSize,
                  lineHeight: 1.85,
                  fontFamily: font.value,
                  color: '#2a2a2a',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  letterSpacing: '0.03em',
                }}
              >
                {formattedContent || '（暂无内容）'}
              </div>
            </div>

            {/* 底部 */}
            <div
              style={{
                padding: '10px 24px',
                borderTop: '0.5px solid #e5e3dd',
                display: 'flex',
                justifyContent: 'space-between',
                flexShrink: 0,
                background: '#faf9f6',
              }}
            >
              <span style={{ fontSize: 13, opacity: 0.3 }}>{currentTime}</span>
              <span style={{ fontSize: 13, opacity: 0.3 }}>本章：{wordCount}字</span>
            </div>

            {/* Home indicator */}
            <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 130, height: 5, borderRadius: 3, background: '#ccc' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 控制面板 */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={fontIndex}
            onChange={(e) => setFontIndex(Number(e.target.value))}
            style={{
              fontSize: 11, padding: '3px 6px', borderRadius: 4,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text)', cursor: 'pointer', flex: 1,
            }}
          >
            {PREVIEW_FONTS.map((f, i) => (
              <option key={i} value={i}>{f.label}</option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <span style={{ fontSize: 10, opacity: 0.4 }}>字号</span>
            <input
              type="range" min={14} max={32} step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ flex: 1, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 10, opacity: 0.4, minWidth: 16 }}>{fontSize}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={phoneIndex}
            onChange={(e) => setPhoneIndex(Number(e.target.value))}
            style={{
              fontSize: 11, padding: '3px 6px', borderRadius: 4,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text)', cursor: 'pointer', flex: 1,
            }}
          >
            {PHONE_PRESETS.map((p, i) => (
              <option key={i} value={i}>{p.label}</option>
            ))}
          </select>

          <span style={{ fontSize: 10, color: 'var(--accent, #4a7dff)' }}>● 实时同步</span>
        </div>
      </div>
    </div>
  )
}
