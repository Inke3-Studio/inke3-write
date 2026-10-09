import { useState, useCallback } from 'react'
import type { Editor as TiptapEditor } from '@tiptap/react'
import EditorSettingsBar from './EditorSettingsBar'
import type { EditorSettings } from '@/hooks/useEditorSettings'

const FONTS = [
  { label: '思源黑体', value: "'Noto Sans SC', sans-serif" },
  { label: '思源宋体', value: "'Noto Serif SC', serif" },
  { label: '霞鹜文楷', value: "'LXGW WenKai', cursive" },
  { label: '站酷小薇', value: "'ZCOOL XiaoWei', serif" },
]

const COLORS = [
  { label: '默认', value: '' },
  { label: '红', value: '#e03131' },
  { label: '橙', value: '#e8590c' },
  { label: '蓝', value: '#1971c2' },
  { label: '绿', value: '#2f9e44' },
  { label: '紫', value: '#7048e8' },
  { label: '灰', value: '#868e96' },
]

const HIGHLIGHTS = [
  { label: '无', value: '' },
  { label: '黄', value: '#fff3bf' },
  { label: '绿', value: '#d3f9d8' },
  { label: '蓝', value: '#d0ebff' },
  { label: '粉', value: '#ffe3e3' },
  { label: '紫', value: '#e5dbff' },
]

interface Props {
  editor: TiptapEditor | null
  onToggleHistory?: () => void
  showHistory?: boolean
  settings: EditorSettings
  onUpdateSetting: <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => void
}

export default function Toolbar({ editor, onToggleHistory, showHistory = false, settings, onUpdateSetting }: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [currentFont, setCurrentFont] = useState(FONTS[0])

  const applyFont = useCallback(
    (font: (typeof FONTS)[number]) => {
      setCurrentFont(font)
      setShowFontPicker(false)
      if (editor) {
        editor.chain().focus().setFontFamily(font.value).run()
      }
    },
    [editor],
  )

  if (!editor) {
    return (
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '5px 10px',
          borderBottom: '1px solid var(--border)',
          alignItems: 'center',
          background: 'var(--toolbar-bg, var(--paper))',
          height: 38,
          opacity: 0.4,
          transition: 'background 0.35s ease',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>选中章节以使用工具栏</span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        padding: '5px 10px',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
        background: 'var(--toolbar-bg, var(--paper))',
        flexShrink: 0,
        position: 'relative',
        transition: 'background 0.35s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 字体 */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowFontPicker(!showFontPicker)
            setShowColorPicker(false)
            setShowHighlightPicker(false)
          }}
          style={{
            background: showFontPicker ? 'var(--active, rgba(0,0,0,0.08))' : 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: 12,
            color: 'var(--text)',
            opacity: 0.7,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {currentFont.label}
          <span style={{ fontSize: 10 }}>▾</span>
        </button>
        {showFontPicker && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 32,
              left: 0,
              background: 'var(--paper, #fff)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 4,
              zIndex: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              minWidth: 140,
            }}
          >
            {FONTS.map((f) => (
              <button
                key={f.label}
                onClick={() => applyFont(f)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: currentFont.value === f.value ? 'var(--active, rgba(0,0,0,0.06))' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  padding: '6px 10px',
                  fontSize: 13,
                  fontFamily: f.value,
                  color: 'var(--text)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      <ToolBtn
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="标题 1"
      >
        H1
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="标题 2"
      >
        H2
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="标题 3"
      >
        H3
      </ToolBtn>

      <Divider />

      <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗">
        <b>B</b>
      </ToolBtn>
      <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体">
        <i>I</i>
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="下划线"
      >
        <u>U</u>
      </ToolBtn>
      <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线">
        <s>S</s>
      </ToolBtn>

      <Divider />

      <div style={{ position: 'relative' }}>
        <ToolBtn
          active={showColorPicker}
          onClick={(e) => {
            e.stopPropagation()
            setShowColorPicker(!showColorPicker)
            setShowHighlightPicker(false)
            setShowFontPicker(false)
          }}
          title="文字颜色"
        >
          <span style={{ borderBottom: '2px solid #e03131' }}>A</span>
        </ToolBtn>
        {showColorPicker && (
          <ColorPanel
            colors={COLORS}
            onSelect={(c) => {
              if (c) editor.chain().focus().setColor(c).run()
              else editor.chain().focus().unsetColor().run()
              setShowColorPicker(false)
            }}
          />
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <ToolBtn
          active={showHighlightPicker}
          onClick={(e) => {
            e.stopPropagation()
            setShowHighlightPicker(!showHighlightPicker)
            setShowColorPicker(false)
            setShowFontPicker(false)
          }}
          title="高亮标记"
        >
          <span style={{ background: '#fff3bf', padding: '0 3px', borderRadius: 2 }}>H</span>
        </ToolBtn>
        {showHighlightPicker && (
          <ColorPanel
            colors={HIGHLIGHTS}
            onSelect={(c) => {
              if (c) editor.chain().focus().setHighlight({ color: c }).run()
              else editor.chain().focus().unsetHighlight().run()
              setShowHighlightPicker(false)
            }}
          />
        )}
      </div>

      <Divider />

      <ToolBtn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="无序列表"
      >
        ⋮
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="有序列表"
      >
        1.
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="引用"
      >
        &ldquo;
      </ToolBtn>

      <Divider />

      <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分割线">
        ─
      </ToolBtn>

      <Divider />

      {onToggleHistory && (
        <ToolBtn active={!!showHistory} onClick={() => onToggleHistory()} title="历史版本">
          ↺
        </ToolBtn>
      )}

      {/* 排版设置（滑条） */}
      <EditorSettingsBar settings={settings} onUpdate={onUpdateSetting} />
    </div>
  )
}

// ── 子组件 ──

function ToolBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: (e: React.MouseEvent) => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'var(--active, rgba(0,0,0,0.08))' : 'transparent',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        padding: '4px 8px',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: 'var(--text)',
        opacity: active ? 1 : 0.6,
        minWidth: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
}

function ColorPanel({
  colors,
  onSelect,
}: {
  colors: { label: string; value: string }[]
  onSelect: (color: string) => void
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 32,
        left: 0,
        background: 'var(--paper, #fff)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: 6,
        display: 'flex',
        gap: 4,
        zIndex: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      {colors.map((c) => (
        <button
          key={c.label}
          onClick={() => onSelect(c.value)}
          title={c.label}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: c.value ? `2px solid ${c.value}` : '2px solid var(--border)',
            background: c.value || 'transparent',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {!c.value && (
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(45deg)',
                width: 16,
                height: 1,
                background: '#e03131',
              }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
