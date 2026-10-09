import { useState, useCallback, useEffect } from 'react'

export interface EditorSettings {
  fontSize: number    // px: 14, 16, 18, 20, 22
  lineHeight: number  // 1.6, 1.8, 2.0, 2.2, 2.5
  paperWidth: number  // px: 560, 680, 800, 960
  zoom: number        // 缩放比例: 0.8, 0.9, 1.0, 1.1, 1.2
}

const STORAGE_KEY = 'inke3-editor-settings'

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 16,
  lineHeight: 2.0,
  paperWidth: 680,
  zoom: 1.0,
}

export const FONT_SIZE_OPTIONS = [14, 16, 18, 20, 22]
export const LINE_HEIGHT_OPTIONS = [1.6, 1.8, 2.0, 2.2, 2.5]
export const PAPER_WIDTH_OPTIONS = [
  { label: '窄', value: 560 },
  { label: '中', value: 680 },
  { label: '宽', value: 800 },
  { label: '超宽', value: 960 },
]
export const ZOOM_OPTIONS = [0.8, 0.9, 1.0, 1.1, 1.2]

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS
}

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const updateSetting = useCallback(<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  return { settings, updateSetting }
}
