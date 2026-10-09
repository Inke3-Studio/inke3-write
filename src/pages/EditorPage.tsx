import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Editor as TiptapEditor } from '@tiptap/react'
import { useBookYjsDoc } from '@/hooks/useBookYjsDoc'
import { useChapterOutline } from '@/hooks/useChapterOutline'
import { useEditorSettings } from '@/hooks/useEditorSettings'
import { useTheme } from '@/components/ThemeSwitcher'
import { supabase } from '@/lib/supabase'
import type { Book } from '@/lib/types'
import { splitTxtChapters, type TxtChapterItem } from '@/lib/splitTxtChapters'
import BookEditor, { type EditorHandle } from '@/components/Editor'
import EditorTopbar from '@/components/EditorTopbar'
import ChapterSidebar from '@/components/ChapterSidebar'
import Toolbar from '@/components/Toolbar'
import Statusbar from '@/components/Statusbar'
import SnapshotPanel from '@/components/SnapshotPanel'
import TxtImportModal from '@/components/TxtImportModal'
import MobilePreview from '@/components/MobilePreview'

interface Props {
  session: Session
  book: Book
  onBack: () => void
}

export default function EditorPage({ session, book, onBack }: Props) {
  // ── 核心状态 ──
  const { ydoc, ready, saveStatus } = useBookYjsDoc(book.id, session.user.id)
  const { settings, updateSetting } = useEditorSettings()
  const { theme, setTheme } = useTheme()

  const [editor, setEditor] = useState<TiptapEditor | null>(null)
  const editorRef = useRef<EditorHandle>(null)
  const { chapters, totalWordCount } = useChapterOutline(editor, 500)

  // ── UI 状态 ──
  const [focusedChapterId, setFocusedChapterId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(false)

  // ── TXT 导入 ──
  const [txtChapters, setTxtChapters] = useState<TxtChapterItem[] | null>(null)
  const [txtChecked, setTxtChecked] = useState<boolean[]>([])
  const [txtOverwrite, setTxtOverwrite] = useState(false)
  const txtFileRef = useRef<HTMLInputElement>(null)

  // ── 码字速度 ──
  const [wordsPerHour, setWordsPerHour] = useState(0)
  const sessionStartRef = useRef<{ time: number; count: number } | null>(null)
  const speedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── 响应式检测 ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── 编辑器就绪 ──
  const handleEditorReady = useCallback((ed: TiptapEditor) => {
    setEditor(ed)
    const text = ed.getText()
    const matches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]|[a-zA-Z0-9]/g)
    sessionStartRef.current = { time: Date.now(), count: matches ? matches.length : 0 }
  }, [])

  // ── 自动聚焦第一个章节 ──
  useEffect(() => {
    if (chapters.length > 0 && !focusedChapterId) {
      setFocusedChapterId(chapters[0].id)
    }
  }, [chapters, focusedChapterId])

  // ── 光标位置追踪 ──
  useEffect(() => {
    if (!editor || editor.isDestroyed || chapters.length === 0) return
    const handleSelectionUpdate = () => {
      const cursorPos = editor.state.selection.from
      let current: typeof chapters[0] | null = null
      for (const ch of chapters) {
        if (ch.pos <= cursorPos) current = ch
        else break
      }
      if (current && current.id !== focusedChapterId) {
        setFocusedChapterId(current.id)
      }
    }
    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => { editor.off('selectionUpdate', handleSelectionUpdate) }
  }, [editor, chapters, focusedChapterId])

  // ── 码字速度 ──
  useEffect(() => {
    speedIntervalRef.current = setInterval(() => {
      const start = sessionStartRef.current
      if (!start) return
      const hours = (Date.now() - start.time) / (1000 * 60 * 60)
      const diff = totalWordCount - start.count
      if (hours >= 1 / 60 && diff > 0) {
        setWordsPerHour(Math.round(diff / hours))
      } else {
        setWordsPerHour(0)
      }
    }, 60_000)
    return () => { if (speedIntervalRef.current) clearInterval(speedIntervalRef.current) }
  }, [totalWordCount])

  // ── 章节操作 ──

  const handleNewChapter = useCallback(() => {
    if (!editor) return
    const endPos = editor.state.doc.content.size
    editor
      .chain()
      .focus(endPos)
      .insertContent([
        {
          type: 'heading',
          attrs: { level: 1, 'data-chapter-id': crypto.randomUUID() },
          content: [{ type: 'text', text: `第${chapters.length + 1}章` }],
        },
        { type: 'paragraph' },
      ])
      .run()
    if (isMobile) setSidebarOpen(false)
  }, [editor, chapters.length, isMobile])

  const handleDeleteChapter = useCallback(() => {
    if (!editor || !focusedChapterId) return
    const doc = editor.state.doc
    let startPos: number | null = null
    let endPos: number | null = null

    doc.forEach((node, offset) => {
      if (node.type.name === 'heading' && node.attrs.level === 1 && node.attrs['data-chapter-id'] === focusedChapterId) {
        startPos = offset
      } else if (startPos !== null && endPos === null && node.type.name === 'heading' && node.attrs.level === 1) {
        endPos = offset
      }
    })
    if (startPos === null) return
    if (endPos === null) endPos = doc.content.size

    editor.chain().deleteRange({ from: startPos, to: endPos }).run()
    const remaining = chapters.filter(c => c.id !== focusedChapterId)
    setFocusedChapterId(remaining.length > 0 ? remaining[0].id : null)
  }, [editor, focusedChapterId, chapters])

  const handleSidebarSelect = useCallback((id: string) => {
    const chapter = chapters.find(c => c.id === id)
    if (!chapter || !editorRef.current) return
    editorRef.current.scrollToPos(chapter.pos)
    setFocusedChapterId(id)
    if (isMobile) setSidebarOpen(false)
  }, [chapters, isMobile])

  // ── TXT 导入 ──

  const handleTxtFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const text = await file.text()
      const result = splitTxtChapters(text)
      setTxtChapters(result)
      setTxtChecked(result.map(() => true))
      setTxtOverwrite(false)
    } catch (err) {
      alert('TXT 解析失败: ' + (err as Error).message)
    }
  }

  const handleTxtImportConfirm = useCallback(async () => {
    if (!txtChapters || !editor) return
    const merged: TxtChapterItem[] = []
    for (let i = 0; i < txtChapters.length; i++) {
      if (txtChecked[i]) {
        merged.push({ ...txtChapters[i] })
      } else if (merged.length > 0) {
        const last = merged[merged.length - 1]
        last.content += '\n' + txtChapters[i].title + '\n' + txtChapters[i].content
        last.word_count += txtChapters[i].word_count
      }
    }
    if (merged.length === 0) { alert('没有选择任何章节'); return }

    editor.commands.selectAll()
    editor.commands.deleteSelection()

    const content: any[] = []
    for (let i = 0; i < merged.length; i++) {
      content.push({
        type: 'heading',
        attrs: { level: 1, 'data-chapter-id': crypto.randomUUID() },
        content: [{ type: 'text', text: merged[i].title || `第${i + 1}章` }],
      })
      for (const text of merged[i].content.split('\n')) {
        content.push(text.length > 0
          ? { type: 'paragraph', content: [{ type: 'text', text }] }
          : { type: 'paragraph' }
        )
      }
    }
    editor.commands.insertContent(content)

    const totalWords = merged.reduce((s, c) => s + c.word_count, 0)
    await supabase.from('books').update({ word_count: totalWords, chapter_count: merged.length }).eq('id', book.id)
    setTxtChapters(null)
    setFocusedChapterId(null)
  }, [txtChapters, txtChecked, editor, book.id])

  // ── 导出 TXT ──

  const handleExportTxt = useCallback(() => {
    if (!editor) return
    const doc = editor.state.doc
    const parts: string[] = []
    let currentTitle = ''
    let currentContent: string[] = []

    doc.forEach((node) => {
      if (node.type.name === 'heading' && node.attrs.level === 1) {
        if (currentTitle || currentContent.length > 0) {
          parts.push(currentTitle + '\n\n' + currentContent.join('\n'))
        }
        currentTitle = node.textContent
        currentContent = []
      } else {
        currentContent.push(node.textContent)
      }
    })
    if (currentTitle || currentContent.length > 0) {
      parts.push(currentTitle + '\n\n' + currentContent.join('\n'))
    }

    const fullText = parts.join('\n\n\n')
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${book.title || '导出'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [editor, book.title])

  // ── 快照恢复 ──

  const handleSnapshotRestore = useCallback((content: string, _restoredTitle: string) => {
    if (!editor) return
    editor.commands.selectAll()
    editor.commands.deleteSelection()
    const jsonContent = content.split('\n').map(text =>
      text.length > 0
        ? { type: 'paragraph', content: [{ type: 'text', text }] }
        : { type: 'paragraph' }
    )
    editor.commands.insertContent(jsonContent)
    setShowHistory(false)
  }, [editor])

  // ── 手机预览 ──

  const getFocusedContent = useCallback((): string => {
    if (!editor || !focusedChapterId) return ''
    const doc = editor.state.doc
    const chapter = chapters.find(c => c.id === focusedChapterId)
    if (!chapter) return ''

    const nextChapter = chapters.find(c => c.pos > chapter.pos)
    const endPos = nextChapter ? nextChapter.pos : doc.content.size

    let text = ''
    doc.nodesBetween(chapter.pos, endPos, (node) => {
      if (node.isText) text += node.text
      else if (node.isBlock && text.length > 0) text += '\n'
      return true
    })
    return text
  }, [editor, focusedChapterId, chapters])

  // ── 派生数据 ──

  const focusedChapter = useMemo(() => chapters.find(c => c.id === focusedChapterId), [chapters, focusedChapterId])
  const focusedWordCount = focusedChapter?.wordCount ?? 0

  // ── 渲染 ──

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Noto Sans SC', sans-serif" }}>

      <EditorTopbar
        session={session}
        bookTitle={book.title}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        theme={theme}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onBack={onBack}
        onImportTxt={() => txtFileRef.current?.click()}
        onExportTxt={handleExportTxt}
        onPreview={() => setShowMobilePreview(true)}
        onSetTheme={setTheme}
      />

      <Toolbar
        editor={editor}
        onToggleHistory={() => setShowHistory(!showHistory)}
        showHistory={showHistory}
        settings={settings}
        onUpdateSetting={updateSetting}
      />

      {showHistory && (
        <SnapshotPanel
          chapterId={book.id}
          onClose={() => setShowHistory(false)}
          onRestore={handleSnapshotRestore}
        />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ChapterSidebar
          chapters={chapters}
          focusedChapterId={focusedChapterId}
          ready={ready}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          onSelect={handleSidebarSelect}
          onNewChapter={handleNewChapter}
          onClose={() => setSidebarOpen(false)}
        />

        <main
          style={{
            flex: 1, background: 'var(--bg)', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: isMobile ? '20px 8px 200px' : '24px 24px 300px',
          }}
        >
          {!ready || !ydoc ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, flex: 1 }}>
              <p style={{ fontSize: 14 }}>加载中…</p>
            </div>
          ) : (
            <div style={{
              width: '100%', maxWidth: settings.paperWidth * settings.zoom,
              background: 'var(--paper)', borderRadius: 6,
              boxShadow: '0 1px 8px var(--paper-shadow, rgba(0,0,0,0.06))',
              transition: 'max-width 0.3s ease, background 0.35s ease',
            }}>
              <BookEditor ref={editorRef} ydoc={ydoc} settings={settings} onReady={handleEditorReady} />
            </div>
          )}
        </main>

        {showMobilePreview && (
          <MobilePreview
            title={focusedChapter?.title || '未选择章节'}
            bookTitle={book.title}
            content={getFocusedContent()}
            wordCount={focusedWordCount}
            onClose={() => setShowMobilePreview(false)}
          />
        )}
      </div>

      <Statusbar
        saveStatus={saveStatus}
        chapterWordCount={focusedWordCount}
        chapterTitle={focusedChapter?.title}
        totalBookWords={totalWordCount}
        wordsPerHour={wordsPerHour}
        onDelete={handleDeleteChapter}
        showDelete={!!focusedChapterId && chapters.length > 0}
      />

      <input ref={txtFileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={handleTxtFileSelect} />

      {txtChapters && (
        <TxtImportModal
          chapters={txtChapters}
          checked={txtChecked}
          overwrite={txtOverwrite}
          existingCount={chapters.length}
          onCheckedChange={(i, v) => { setTxtChecked(prev => { const next = [...prev]; next[i] = v; return next }) }}
          onOverwriteChange={setTxtOverwrite}
          onConfirm={handleTxtImportConfirm}
          onClose={() => setTxtChapters(null)}
        />
      )}
    </div>
  )
}
