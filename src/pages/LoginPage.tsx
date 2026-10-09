import { useState } from 'react'
import { signInWithEmail, signUpWithEmail } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (): string | null => {
    if (!email.trim()) return '请输入邮箱'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '邮箱格式不正确'
    if (!password) return '请输入密码'
    if (password.length < 6) return '密码至少 6 位'
    if (mode === 'signup' && password !== confirmPassword) return '两次密码不一致'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }

    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
        // 注册后自动确认并登录，页面会自动跳转
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '出错了'
      // 友好化常见错误
      if (msg.includes('Invalid login')) setError('邮箱或密码错误')
      else if (msg.includes('already registered')) setError('该邮箱已注册，请直接登录')
      else if (msg.includes('Email not confirmed')) setError('邮箱未验证，请查收验证邮件')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: "'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif",
    }}>
      <div style={{
        width: 400, background: 'var(--paper)',
        borderRadius: 12, padding: '48px 40px',
        boxShadow: '0 4px 32px var(--paper-shadow, rgba(0,0,0,0.08))',
      }}>
        {/* Logo / Brand */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 24, fontWeight: 700,
            marginBottom: 6, color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}>
            ✎ 银客写作
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #999)' }}>
            {mode === 'login' ? '登录你的写作空间' : '创建账号，开始写作'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 邮箱 */}
          <div>
            <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 4 }}>邮箱</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%',
                padding: '10px 14px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 14, background: 'var(--bg)',
                color: 'var(--text)', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent, #4a7dff)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* 密码 */}
          <div>
            <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 4 }}>密码</label>
            <input
              type="password"
              placeholder={mode === 'signup' ? '至少 6 位' : '输入密码'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleSubmit() : undefined)}
              style={{
                width: '100%',
                padding: '10px 14px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 14, background: 'var(--bg)',
                color: 'var(--text)', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent, #4a7dff)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* 确认密码（仅注册） */}
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 12, opacity: 0.5, display: 'block', marginBottom: 4 }}>确认密码</label>
              <input
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%',
                  padding: '10px 14px', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: 14, background: 'var(--bg)',
                  color: 'var(--text)', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent, #4a7dff)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          )}

          {/* 错误 */}
          {error && (
            <p style={{
              fontSize: 13, color: '#e07a5f',
              background: 'rgba(224, 122, 95, 0.08)',
              padding: '8px 12px', borderRadius: 6,
              lineHeight: 1.5,
            }}>
              {error}
            </p>
          )}

          {/* 提交 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '11px', background: 'var(--text)', color: 'var(--paper)',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, marginTop: 4,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
          </button>

          {/* 切换模式 */}
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setConfirmPassword('') }}
              style={{
                background: 'none', border: 'none', fontSize: 13,
                color: 'var(--accent, #4a7dff)', cursor: 'pointer',
                opacity: 0.8,
              }}
            >
              {mode === 'login' ? '没有账号？注册' : '已有账号？登录'}
            </button>
          </div>
        </div>

        {/* 底部说明 */}
        <p style={{
          fontSize: 11, opacity: 0.25, textAlign: 'center',
          marginTop: 28, lineHeight: 1.6,
        }}>
          银客写作 · 万维银客城旗下创作工具
        </p>
      </div>
    </div>
  )
}
