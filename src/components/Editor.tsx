import { useEffect, useRef, forwardRef, useImperativeHandle, memo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor as TiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import FontFamily from '@tiptap/extension-font-family'
import type * as Y from 'yjs'
import type { EditorSettings } from '@/hooks/useEditorSettings'
import { ChapterHeading } from '@/lib/chapterHeading'

interface Props {
  ydoc: Y.Doc
  settings: EditorSettings
  onReady?: (editor: TiptapEditor) => void
}

export interface EditorHandle {
  getEditor: () => TiptapEditor | null
  scrollToPos: (pos: number) => void
}

const BookEditor = memo(forwardRef<EditorHandle, Props>(function BookEditor(
  { ydoc, settings, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: false, // 用我们的 ChapterHeading 替代
        }),
        ChapterHeading.configure({ levels: [1, 2, 3] }),
        Underline,
        TextStyle,
        Color,
        FontFamily,
        Highlight.configure({ multicolor: true }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === 'heading') {
              if (node.attrs.level === 1) return '章节标题'
              return '标题'
            }
            return ''
          },
        }),
        Collaboration.configure({ document: ydoc, field: 'default' }),
      ],
      editorProps: {
        attributes: {
          class: 'tiptap-editor book-editor',
          spellcheck: 'false',
        },
      },
    },
    [ydoc],
  )

  // 通知父组件 editor 已就绪
  useEffect(() => {
    if (editor) {
      onReadyRef.current?.(editor)
    }
  }, [editor])

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    scrollToPos: (pos: number) => {
      if (!editor) return
      // 设置光标到目标位置
      const docSize = editor.state.doc.content.size
      const safePos = Math.min(pos + 1, docSize) // +1 进入节点内部
      editor.commands.setTextSelection(safePos)
      // 滚动到可见
      const domAtPos = editor.view.domAtPos(safePos)
      const node = domAtPos.node as HTMLElement
      const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
  }))

  if (!editor) return null

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      <EditorContent editor={editor} style={{ flex: 1 }} />

      {/* 动态样式 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&family=ZCOOL+XiaoWei&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css');

        .book-editor {
          padding: ${Math.round(24 * settings.zoom)}px ${Math.round(56 * settings.zoom)}px ${Math.round(64 * settings.zoom)}px;
          outline: none;
          font-family: 'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif;
          font-size: ${Math.round(settings.fontSize * settings.zoom)}px;
          line-height: ${settings.lineHeight};
          color: var(--text-secondary);
          letter-spacing: 0.02em;
          min-height: 80vh;
        }

        .book-editor h1 {
          font-size: ${Math.round(settings.fontSize * 1.5 * settings.zoom)}px;
          font-weight: 600; line-height: 1.4;
          color: var(--text); margin: 48px 0 12px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        /* 第一个 H1 不需要上边框和上边距 */
        .book-editor > h1:first-child,
        .book-editor > [data-node-view-wrapper]:first-child h1 {
          margin-top: 8px;
          padding-top: 0;
          border-top: none;
        }

        .book-editor h2 {
          font-size: ${Math.round(settings.fontSize * 1.25 * settings.zoom)}px;
          font-weight: 600; line-height: 1.4;
          color: var(--text); margin: 24px 0 10px;
        }
        .book-editor h3 {
          font-size: ${Math.round(settings.fontSize * 1.06 * settings.zoom)}px;
          font-weight: 600; line-height: 1.5;
          color: var(--text); margin: 20px 0 8px;
        }
        .book-editor p { margin: 0 0 4px; }
        .book-editor blockquote {
          border-left: 3px solid var(--border);
          padding-left: 16px; margin: 12px 0;
          opacity: 0.85; font-style: italic;
        }
        .book-editor ul, .book-editor ol {
          padding-left: 24px; margin: 8px 0;
        }
        .book-editor hr {
          border: none; border-top: 1px solid var(--border); margin: 24px 0;
        }
        .book-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left; color: var(--text-secondary);
          opacity: 0.3; pointer-events: none; height: 0;
        }
        .book-editor [data-placeholder]::before {
          content: attr(data-placeholder);
          float: left; color: var(--text-secondary);
          opacity: 0.3; pointer-events: none; height: 0;
        }
        @media (max-width: 600px) {
          .book-editor {
            padding: 16px 20px 40px;
            font-size: ${Math.max(settings.fontSize - 1, 14)}px;
          }
        }
      `}</style>
    </div>
  )
}))

export default BookEditor
