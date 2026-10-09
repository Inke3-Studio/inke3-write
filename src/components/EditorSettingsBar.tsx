import { useState } from 'react'
import type { EditorSettings } from '@/hooks/useEditorSettings'

interface Props {
  settings: EditorSettings
  onUpdate: <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => void
}

export default function EditorSettingsBar({ settings, onUpdate }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* 分隔线 */}
      <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

      {/* 切换按钮 */}
      <button
        onClick={() => setOpen(!open)}
        title="排版设置"
        style={{
          background: open ? 'var(--active, rgba(0,0,0,0.08))' : 'transparent',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: 12,
          color: 'var(--text)',
          opacity: open ? 1 : 0.6,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        排版 <span style={{ fontSize: 10 }}>{open ? '▴' : '▾'}</span>
      </button>

      {/* 展开的滑条面板 */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--paper, #fff)',
            borderBottom: '1px solid var(--border)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
            zIndex: 15,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {/* 字号 */}
          <SliderRow
            label="字号"
            value={settings.fontSize}
            min={12}
            max={24}
            step={1}
            display={`${settings.fontSize}px`}
            onChange={(v) => onUpdate('fontSize', v)}
          />

          {/* 行高 */}
          <SliderRow
            label="行高"
            value={settings.lineHeight}
            min={1.4}
            max={3.0}
            step={0.1}
            display={settings.lineHeight.toFixed(1)}
            onChange={(v) => onUpdate('lineHeight', Math.round(v * 10) / 10)}
          />

          {/* 稿纸宽度 */}
          <SliderRow
            label="稿纸"
            value={settings.paperWidth}
            min={480}
            max={1080}
            step={40}
            display={`${settings.paperWidth}px`}
            onChange={(v) => onUpdate('paperWidth', v)}
          />

          {/* 缩放 */}
          <SliderRow
            label="缩放"
            value={settings.zoom}
            min={0.7}
            max={1.4}
            step={0.05}
            display={`${Math.round(settings.zoom * 100)}%`}
            onChange={(v) => onUpdate('zoom', Math.round(v * 100) / 100)}
          />
        </div>
      )}
    </>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, opacity: 0.5, minWidth: 24 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: 80,
          height: 3,
          cursor: 'pointer',
          accentColor: 'var(--text, #333)',
        }}
      />
      <span style={{ fontSize: 11, opacity: 0.4, minWidth: 36, textAlign: 'right' }}>{display}</span>
    </div>
  )
}
