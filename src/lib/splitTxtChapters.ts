/**
 * TXT 章节切割：格式脱水 + 正则切片（行首匹配）+ 安全校验
 * 脱水：去 HTML、删行首空格（半角/全角）、\r\n→\n、连续 2+ 换行规范为 \n\n。
 * 校验：原文与拼接串先脱水，再移除全部 \n 后比较字数，避免换行符差异导致误报。
 */

/** 半角/全角空格（行首 trim） */
const LEADING_SPACES_RE = /^[\s\u3000]+/

/** 脱水：去 HTML；删每行行首空格；\r\n→\n；连续 2 个及以上换行规范为 \n\n */
export function dehydrateText(raw: string): string {
  let t = raw
  t = t.replace(/<[^>]*>/g, '')
  t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  t = t.split('\n').map((line) => line.replace(LEADING_SPACES_RE, '')).join('\n')
  t = t.replace(/\n{2,}/g, '\n\n')
  return t
}

/** 去掉常见 Markdown 符号后统计「可读字数」：汉字按字计，英文按单词计。用于展示用 word_count。 */
export function countWordsForDisplay(text: string): number {
  if (!text || !text.trim()) return 0
  let t = text
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1')
  t = t.replace(/\*([^*]+)\*/g, '$1')
  t = t.replace(/__(.+?)__/g, '$1')
  t = t.replace(/_([^_]+)_/g, '$1')
  t = t.replace(/^#{1,6}\s+/gm, '')
  t = t.replace(/^---+$/gm, '')
  t = t.replace(/^\*\*\*+$/gm, '')
  t = t.replace(/^___+$/gm, '')
  t = t.replace(/`([^`]+)`/g, '$1')
  t = t.replace(/~~([^~]+)~~/g, '$1')
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  t = t.replace(/^[-*+]\s+/gm, '')
  t = t.replace(/^\d+\.\s+/gm, '')
  const cjk = (t.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  const en = (t.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ').trim().split(/\s+/) || []).filter(Boolean).length
  return cjk + en
}

/** 行首章节标题（行首=该行起始，忽略空格后）：第X章/节/卷/回、Chapter 数字、1~4 位数字（排除 01:30 这类） */
const CHAPTER_LINE_RE = /^\s*(?:第.{1,7}[章节卷回]|Chapter\s+[0-9]+|[0-9]{1,4}(?![0-9：:]))(?=\s|$)/gm

type MatchInfo = { index: number; lineStart: number; endOfLine: number; titleLine: string }

/**
 * 行首校验：严格确保匹配位置是该行的起始（忽略行首空格后）。
 * 返回所有匹配行的信息：lineStart=该行第一个字符下标，titleLine=整行原文（含行首空格与换行前内容）。
 */
function findChapterStarts(text: string): MatchInfo[] {
  const list: MatchInfo[] = []
  const re = new RegExp(CHAPTER_LINE_RE.source, 'gm')
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const matchStart = m.index
    const matchText = m[0]
    
    // 如果匹配文本以换行符开头，跳过它（multiline 模式下可能发生）
    let actualMatchStart = matchStart
    if (matchText.startsWith('\n')) {
      actualMatchStart = matchStart + 1
    }
    
    // 找到这一行的起始和结束位置
    const lineStart = text.lastIndexOf('\n', actualMatchStart - 1) + 1
    const lineEnd = text.indexOf('\n', actualMatchStart)
    const endOfLine = lineEnd === -1 ? text.length : lineEnd
    const fullLine = text.slice(lineStart, endOfLine)
    
    let titleLine = fullLine.trim()
    
    // 长度限制：如果标题行超过35个字符，跳过
    if (titleLine.length > 35) {
      continue
    }
    
    list.push({ index: actualMatchStart, lineStart, endOfLine, titleLine })
  }
  return list
}

export type TxtChapterItem = { title: string; content: string; word_count: number }

/**
 * 校验：将切分出的 title + content 拼接后与脱水后的 rawText 比较。
 * 为避开 Windows/Mac 换行符差异导致的「多一个字符」误报，先将两者去掉全部 \n 再比较字数（内容一致即通过）。
 */
export function validateSplitResult(rawText: string, chapters: TxtChapterItem[], hasPreamble: boolean, preamble: string): void {
  let rebuilt = ''
  if (hasPreamble && preamble.length > 0) {
    rebuilt += preamble
  }
  const startIdx = hasPreamble && preamble.length > 0 ? 1 : 0
  for (let i = startIdx; i < chapters.length; i++) {
    const ch = chapters[i]
    rebuilt += ch.title
    const isLast = i === chapters.length - 1
    if (ch.content.length > 0) {
      if (ch.title.length > 0 || !rebuilt.endsWith('\n')) rebuilt += '\n'
      rebuilt += ch.content
    } else if (!isLast || rawText.endsWith('\n')) {
      rebuilt += '\n'
    }
  }
  const original = dehydrateText(rawText)
  const combined = dehydrateText(rebuilt)
  const origNoNewlines = original.replace(/\n/g, '')
  const combNoNewlines = combined.replace(/\n/g, '')
  if (origNoNewlines !== combNoNewlines) {
    for (let i = 0; i < Math.max(origNoNewlines.length, combNoNewlines.length); i++) {
      if (origNoNewlines[i] !== combNoNewlines[i]) {
        console.error('[章节切分] 差异起始位置（去换行后）:', i)
        console.error('[章节切分] 原文片段:', JSON.stringify(origNoNewlines.substring(i, i + 20)))
        console.error('[章节切分] 拼接片段:', JSON.stringify(combNoNewlines.substring(i, i + 20)))
        break
      }
    }
    throw new Error(
      `章节切分校验失败：重新拼接后与原文不一致（去换行后原文 ${origNoNewlines.length} 字，拼接 ${combNoNewlines.length} 字）。请检查文件是否被截断或含有不支持的格式。详见控制台差异位置。`
    )
  }
}

/**
 * 切分 TXT 为章节数组。
 * - 标题行：匹配行整行作为 title 存储（不丢弃）。
 * - 内容：该标题行之后到下一个标题行之前的所有内容作为 content。
 * - 校验：通过 validate 将 title + content 拼接后必须与脱水后全文完全相等。
 */
export function splitTxtChapters(raw: string): TxtChapterItem[] {
  const text = dehydrateText(raw)
  const matches = findChapterStarts(text)

  const chapters: TxtChapterItem[] = []

  if (matches.length === 0) {
    chapters.push({
      title: '',
      content: text,
      word_count: countWordsForDisplay(text),
    })
    validateSplitResult(text, chapters, false, '')
    return chapters
  }

  const hasPreamble = matches[0].lineStart > 0
  const preamble = hasPreamble ? text.slice(0, matches[0].lineStart) : ''

  if (hasPreamble && preamble.length > 0) {
    chapters.push({
      title: '前言',
      content: preamble,
      word_count: preamble.length,
    })
  }

  for (let i = 0; i < matches.length; i++) {
    const titleLine = matches[i].titleLine
    const contentStart = matches[i].endOfLine + 1
    const contentEnd = i + 1 < matches.length ? matches[i + 1].lineStart : text.length
    const content = text.slice(contentStart, contentEnd)
    chapters.push({
      title: titleLine,
      content,
      word_count: countWordsForDisplay(content),
    })
  }

  validateSplitResult(text, chapters, hasPreamble, preamble)
  return chapters
}
