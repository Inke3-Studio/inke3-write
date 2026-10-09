import { useState, useEffect, useRef, useCallback } from 'react'
import type { Editor as TiptapEditor } from '@tiptap/react'

export interface ChapterInfo {
  id: string        // data-chapter-id attr
  title: string     // H1 文本内容
  pos: number       // 在文档中的绝对位置
  wordCount: number // 从该 H1 到下一个 H1 之间的文字数
}

/** 只统计汉字 + 英文字母 + 数字 */
function countChars(str: string): number {
  const matches = str.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]|[a-zA-Z0-9]/g)
  return matches ? matches.length : 0
}

/**
 * 从 TipTap editor 的 ProseMirror doc 中提取所有 H1 节点作为章节大纲。
 * 使用 debounce 避免打字时频繁计算。
 */
export function useChapterOutline(editor: TiptapEditor | null, debounceMs = 500) {
  const [chapters, setChapters] = useState<ChapterInfo[]>([])
  const [totalWordCount, setTotalWordCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const extract = useCallback(() => {
    if (!editor || editor.isDestroyed) {
      setChapters([])
      setTotalWordCount(0)
      return
    }

    const doc = editor.state.doc
    const result: ChapterInfo[] = []

    // 收集所有 H1 位置
    const h1Positions: { pos: number; id: string; title: string }[] = []

    doc.forEach((node, offset) => {
      if (node.type.name === 'heading' && node.attrs.level === 1) {
        const id = node.attrs['data-chapter-id'] || `pos-${offset}`
        h1Positions.push({
          pos: offset,
          id,
          title: node.textContent || '无标题',
        })
      }
    })

    // 全文字数统计（始终计算）
    const fullText = doc.textContent
    const total = countChars(fullText)
    setTotalWordCount(total)

    // 计算每章字数（H1 到下一个 H1 之间）
    for (let i = 0; i < h1Positions.length; i++) {
      const startPos = h1Positions[i].pos
      const endPos = i + 1 < h1Positions.length
        ? h1Positions[i + 1].pos
        : doc.content.size

      // 提取该范围的文本
      let text = ''
      doc.nodesBetween(startPos, endPos, (node) => {
        if (node.isText) {
          text += node.text
        }
        return true
      })

      result.push({
        id: h1Positions[i].id,
        title: h1Positions[i].title,
        pos: startPos,
        wordCount: countChars(text),
      })
    }

    setChapters(result)
  }, [editor])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    // 初始提取（延迟一帧，等 Collaboration 同步完毕）
    const initTimer = setTimeout(extract, 100)

    const handleUpdate = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(extract, debounceMs)
    }

    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
      clearTimeout(initTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [editor, extract, debounceMs])

  return { chapters, totalWordCount }
}
