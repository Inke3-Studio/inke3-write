import { supabase } from './supabase'

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { source: 'write' },
    },
  })
  if (error) throw error

  // 自动确认邮箱，跳过验证邮件
  if (data.user) {
    await supabase.rpc('auto_confirm_email', { p_user_id: data.user.id })
    // 确认后立即登录
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
  }

  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
