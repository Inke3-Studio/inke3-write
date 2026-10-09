import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Book, Folder } from '@/lib/types'

export function useBooks(userId: string | undefined) {
  const [books, setBooks] = useState<Book[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!userId) return
    const [{ data: booksData }, { data: foldersData }] = await Promise.all([
      supabase.from('books').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
      supabase.from('folders').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    ])
    if (booksData) setBooks(booksData)
    if (foldersData) setFolders(foldersData)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const createBook = async (folderId?: string) => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('books')
      .insert({ user_id: userId, title: '无标题', folder_id: folderId ?? null })
      .select()
      .single()
    if (error || !data) return null
    setBooks(prev => [data, ...prev])
    return data as Book
  }

  const createFolder = async () => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('folders')
      .insert({ user_id: userId, name: '新文件夹' })
      .select()
      .single()
    if (error || !data) return null
    setFolders(prev => [...prev, data])
    return data as Folder
  }

  const deleteBook = async (id: string) => {
    await supabase.from('books').delete().eq('id', id)
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  const deleteFolder = async (id: string) => {
    await supabase.from('folders').delete().eq('id', id)
    setFolders(prev => prev.filter(f => f.id !== id))
    // 文件夹删除后书籍 folder_id 自动变 null（数据库设置了 set null）
    setBooks(prev => prev.map(b => b.folder_id === id ? { ...b, folder_id: null } : b))
  }

  const renameBook = async (id: string, title: string) => {
    await supabase.from('books').update({ title }).eq('id', id)
    setBooks(prev => prev.map(b => b.id === id ? { ...b, title } : b))
  }

  const renameFolder = async (id: string, name: string) => {
    await supabase.from('folders').update({ name }).eq('id', id)
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  }

  const updateCover = (id: string, cover: string) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, cover } : b))
  }

  return {
    books, folders, loading,
    createBook, createFolder,
    deleteBook, deleteFolder,
    renameBook, renameFolder,
    updateCover,
    refetch: fetchAll
  }
}
