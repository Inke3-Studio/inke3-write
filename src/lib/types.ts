export interface Draft {
  id: string
  user_id: string
  title: string
  content: string
  ydoc_state?: Uint8Array | null
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Book {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  cover: string | null
  word_count: number
  chapter_count: number
  created_at: string
  updated_at: string
}

export interface BookChapter {
  id: string
  book_id: string
  user_id: string
  title: string
  content: string
  ydoc_state?: Uint8Array | null
  order: number
  created_at: string
  updated_at: string
}

/** 每日码字记录 */
export interface WritingLog {
  id: string
  user_id: string
  book_id: string
  chapter_id: string
  date: string          // YYYY-MM-DD
  word_count: number    // 当日净增字数
  created_at: string
}
