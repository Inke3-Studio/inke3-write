import { useEffect, useRef, useState, useCallback } from 'react'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { supabase } from '@/lib/supabase'

/** 只统计汉字 + 英文字母 + 数字 */
function countChars(str: string): number {
  const matches = str.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]|[a-zA-Z0-9]/g)
  return matches ? matches.length : 0
}

export interface BookDocState {
  ydoc: Y.Doc | null
  ready: boolean
  saveStatus: 'saved' | 'saving' | 'offline'
}

/**
 * 单 Y.Doc 管理整本书的内容。
 * 一个 Y.Doc + 一个 IndexedDB persistence + 一个 Supabase broadcast channel。
 */
export function useBookYjsDoc(bookId: string | null, userId: string | undefined) {
  const [state, setState] = useState<BookDocState>({
    ydoc: null,
    ready: false,
    saveStatus: 'saved',
  })

  const ydocRef = useRef<Y.Doc | null>(null)
  const persistenceRef = useRef<IndexeddbPersistence | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionStartCountRef = useRef<number | null>(null)
  const lastSnapshotTimeRef = useRef<number>(0)

  const saveToDb = useCallback(async (doc: Y.Doc, id: string) => {
    if (!userId) return
    try {
      const fullState = Y.encodeStateAsUpdate(doc)
      const yxml = doc.getXmlFragment('default')
      const plainContent = extractPlainText(yxml)
      const wc = countChars(plainContent)

      const { error } = await supabase
        .from('book_docs')
        .upsert({
          book_id: id,
          ydoc_state: Array.from(fullState),
          plain_content: plainContent,
          word_count: wc,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'book_id' })

      // 同步书籍元数据
      await supabase.from('books').update({ word_count: wc }).eq('id', id)

      // 记录每日码字量
      if (sessionStartCountRef.current !== null) {
        const netIncrease = wc - sessionStartCountRef.current
        if (netIncrease > 0) {
          const today = new Date().toISOString().slice(0, 10)
          await supabase.rpc('upsert_writing_log', {
            p_user_id: userId,
            p_book_id: id,
            p_chapter_id: id, // 单 doc 模式下用 book_id
            p_date: today,
            p_word_count: netIncrease,
          })
        }
        sessionStartCountRef.current = wc
      }

      // 自动版本快照：至少间隔 5 分钟
      const now = Date.now()
      if (now - lastSnapshotTimeRef.current >= 5 * 60 * 1000) {
        lastSnapshotTimeRef.current = now
        await supabase.from('book_snapshots').insert({
          book_id: id,
          user_id: userId,
          content: plainContent,
          word_count: wc,
        })
      }

      setState(prev => ({ ...prev, saveStatus: error ? 'offline' : 'saved' }))
    } catch {
      setState(prev => ({ ...prev, saveStatus: 'offline' }))
    }
  }, [userId])

  useEffect(() => {
    if (!bookId || !userId) return

    const ydoc = new Y.Doc({ guid: `book-${bookId}` })
    ydocRef.current = ydoc

    const persistence = new IndexeddbPersistence(`book-${bookId}`, ydoc)
    persistenceRef.current = persistence

    const channel = supabase.channel(`book-doc:${bookId}`, {
      config: { broadcast: { self: false } },
    })
    channelRef.current = channel

    setState({ ydoc, ready: false, saveStatus: 'saved' })

    // Broadcast channel 设置（与旧代码相同的协议）
    channel
      .on('broadcast', { event: 'sync-update' }, ({ payload }) => {
        if (payload?.update) {
          Y.applyUpdate(ydoc, new Uint8Array(payload.update), 'remote')
        }
      })
      .on('broadcast', { event: 'sync-step1' }, ({ payload }) => {
        if (payload?.sv) {
          const sv = new Uint8Array(payload.sv)
          const update = Y.encodeStateAsUpdate(ydoc, sv)
          channel.send({
            type: 'broadcast',
            event: 'sync-step2',
            payload: { update: Array.from(update) },
          })
        }
      })
      .on('broadcast', { event: 'sync-step2' }, ({ payload }) => {
        if (payload?.update) {
          Y.applyUpdate(ydoc, new Uint8Array(payload.update), 'remote')
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          const sv = Y.encodeStateVector(ydoc)
          channel.send({
            type: 'broadcast',
            event: 'sync-step1',
            payload: { sv: Array.from(sv) },
          })
        }
      })

    // IndexedDB synced → 从 Supabase 拉最新
    persistence.on('synced', async () => {
      try {
        // 尝试从新表读取
        const { data: bookDoc } = await supabase
          .from('book_docs')
          .select('ydoc_state')
          .eq('book_id', bookId)
          .single()

        if (bookDoc?.ydoc_state) {
          const raw = bookDoc.ydoc_state as number[]
          Y.applyUpdate(ydoc, new Uint8Array(raw), 'remote')
        } else {
          // 迁移：从旧的 book_chapters 表导入
          await migrateFromChapters(ydoc, bookId)
        }

        // 记录初始字数
        const plainText = extractPlainText(ydoc.getXmlFragment('default'))
        sessionStartCountRef.current = countChars(plainText)
      } catch {
        setState(prev => ({ ...prev, saveStatus: 'offline' }))
      }

      setState(prev => ({ ...prev, ready: true }))
    })

    // 监听更新
    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || origin === persistence) return

      setState(prev => ({ ...prev, saveStatus: 'saving' }))

      // 广播给其他端
      channel.send({
        type: 'broadcast',
        event: 'sync-update',
        payload: { update: Array.from(update) },
      })

      // debounce 保存到数据库
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      syncTimerRef.current = setTimeout(() => saveToDb(ydoc, bookId), 2000)
    }

    ydoc.on('update', handleUpdate)

    return () => {
      // 最后保存一次
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
        saveToDb(ydoc, bookId)
      }

      ydoc.off('update', handleUpdate)
      persistence.destroy()
      channel.unsubscribe()
      ydoc.destroy()
      ydocRef.current = null
      persistenceRef.current = null
      channelRef.current = null

      setState({ ydoc: null, ready: false, saveStatus: 'saved' })
    }
  }, [bookId, userId, saveToDb])

  return state
}

// ── 迁移：从旧的 per-chapter 表导入到单 Y.Doc ──

async function migrateFromChapters(ydoc: Y.Doc, bookId: string) {
  const { data: chapters } = await supabase
    .from('book_chapters')
    .select('title, content, ydoc_state, order')
    .eq('book_id', bookId)
    .order('order', { ascending: true })

  if (!chapters || chapters.length === 0) return

  const yxml = ydoc.getXmlFragment('default')
  if (yxml.length > 0) return // 已有内容，不覆盖

  ydoc.transact(() => {
    for (const chapter of chapters) {
      // 章节标题作为 H1
      // 注意：TipTap Collaboration 的 Yjs 映射中，heading 节点属性通过
      // XmlElement attributes 传递。level 需要存为数字才能与 ProseMirror schema 匹配。
      const h1 = new Y.XmlElement('heading')
      h1.setAttribute('level', 1 as any)
      h1.setAttribute('data-chapter-id', crypto.randomUUID())
      const titleText = new Y.XmlText(chapter.title || '无标题')
      h1.insert(0, [titleText])
      yxml.push([h1])

      // 章节内容
      const content = chapter.content || ''
      const paragraphs = content.split('\n')
      for (const text of paragraphs) {
        const p = new Y.XmlElement('paragraph')
        if (text.length > 0) {
          const t = new Y.XmlText(text)
          p.insert(0, [t])
        }
        yxml.push([p])
      }
    }
  }, 'remote')
}

// ── 工具函数 ──

function extractPlainText(fragment: Y.XmlFragment): string {
  const lines: string[] = []
  for (let i = 0; i < fragment.length; i++) {
    const node = fragment.get(i)
    if (node instanceof Y.XmlElement) {
      lines.push(getTextFromElement(node))
    } else if (node instanceof Y.XmlText) {
      lines.push(node.toString())
    }
  }
  return lines.join('\n')
}

function getTextFromElement(el: Y.XmlElement): string {
  const parts: string[] = []
  for (let i = 0; i < el.length; i++) {
    const child = el.get(i)
    if (child instanceof Y.XmlText) {
      parts.push(child.toString())
    } else if (child instanceof Y.XmlElement) {
      parts.push(getTextFromElement(child))
    }
  }
  return parts.join('')
}
