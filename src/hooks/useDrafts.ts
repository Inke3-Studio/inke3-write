import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Draft } from '@/lib/types'

export function useDrafts(userId: string | undefined) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDrafts = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('drafts')
      .select('id, title, updated_at, created_at, user_id, content')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (data) setDrafts(data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  const createDraft = async () => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('drafts')
      .insert({ user_id: userId, title: '无标题', content: '' })
      .select()
      .single()
    if (error || !data) return null
    setDrafts(prev => [data, ...prev])
    return data as Draft
  }

  const deleteDraft = async (id: string) => {
    await supabase.from('drafts').delete().eq('id', id)
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  const updateDraftTitle = (id: string, title: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, title } : d))
  }

  return { drafts, loading, createDraft, deleteDraft, updateDraftTitle, refetch: fetchDrafts }
}
