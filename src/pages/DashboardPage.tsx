import { useEffect, useState, useMemo } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Props {
  session: Session
  onBack: () => void
}

interface DayData {
  date: string
  total: number
  books: { bookTitle: string; words: number }[]
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const WEEKDAY_LABELS = ['一', '', '三', '', '五', '', '日']

function getHeatColor(count: number): string {
  if (count === 0) return 'var(--border, #eee)'
  if (count < 200) return '#c6e48b'
  if (count < 500) return '#7bc96f'
  if (count < 1000) return '#239a3b'
  return '#196127'
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Supabase embed `books(title)`: TS often infers an array; API may return one row as object or array */
type WritingLogWithBook = {
  date: string
  word_count: number
  book_id: string
  books?: { title: string }[] | { title: string } | null
}

function bookTitleFromEmbed(books: WritingLogWithBook['books']): string {
  if (!books) return '未知'
  if (Array.isArray(books)) return books[0]?.title ?? '未知'
  return books.title
}

export default function DashboardPage({ session, onBack }: Props) {
  const [logs, setLogs] = useState<WritingLogWithBook[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)

  // 加载过去一年的数据
  useEffect(() => {
    async function load() {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      const { data } = await supabase
        .from('writing_logs')
        .select('date, word_count, book_id, books(title)')
        .eq('user_id', session.user.id)
        .gte('date', formatDate(oneYearAgo))
        .order('date', { ascending: true })

      if (data) setLogs(data as WritingLogWithBook[])
      setLoading(false)
    }
    load()
  }, [session.user.id])

  // 按日期聚合
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>()
    for (const log of logs) {
      const existing = map.get(log.date)
      const bookTitle = bookTitleFromEmbed(log.books)
      if (existing) {
        existing.total += log.word_count
        const bookEntry = existing.books.find((b) => b.bookTitle === bookTitle)
        if (bookEntry) {
          bookEntry.words += log.word_count
        } else {
          existing.books.push({ bookTitle, words: log.word_count })
        }
      } else {
        map.set(log.date, {
          date: log.date,
          total: log.word_count,
          books: [{ bookTitle, words: log.word_count }],
        })
      }
    }
    return map
  }, [logs])

  // 生成过去一年的日期网格（52-53 周）
  const { weeks, monthPositions } = useMemo(() => {
    const today = new Date()
    const weeks: { date: Date; dateStr: string }[][] = []
    const monthPositions: { month: number; weekIdx: number }[] = []

    // 从一年前的周一开始
    const start = new Date(today)
    start.setFullYear(start.getFullYear() - 1)
    // 调整到周一
    const dayOfWeek = start.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    start.setDate(start.getDate() + diff)

    let currentWeek: { date: Date; dateStr: string }[] = []
    let lastMonth = -1
    const cursor = new Date(start)

    while (cursor <= today || currentWeek.length > 0) {
      const d = new Date(cursor)
      const dateStr = formatDate(d)

      if (d.getMonth() !== lastMonth) {
        monthPositions.push({ month: d.getMonth(), weekIdx: weeks.length })
        lastMonth = d.getMonth()
      }

      currentWeek.push({ date: d, dateStr })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }

      cursor.setDate(cursor.getDate() + 1)
      if (cursor > today && currentWeek.length === 0) break
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return { weeks, monthPositions }
  }, [])

  // 汇总统计
  const stats = useMemo(() => {
    let totalWords = 0
    let activeDays = 0
    let maxStreak = 0
    let currentStreak = 0
    let prevDate: Date | null = null

    const sortedDates = Array.from(dayMap.keys()).sort()
    for (const dateStr of sortedDates) {
      const day = dayMap.get(dateStr)!
      totalWords += day.total
      activeDays++

      const d = new Date(dateStr)
      if (prevDate) {
        const diffDays = (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }
      maxStreak = Math.max(maxStreak, currentStreak)
      prevDate = d
    }

    const avgPerDay = activeDays > 0 ? Math.round(totalWords / activeDays) : 0

    return { totalWords, activeDays, avgPerDay, maxStreak }
  }, [dayMap])

  // 月度柱状图数据
  const monthlyData = useMemo(() => {
    const months: { label: string; words: number }[] = []
    const today = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const label = `${year}/${month + 1}`

      let words = 0
      dayMap.forEach((day, dateStr) => {
        const dd = new Date(dateStr)
        if (dd.getFullYear() === year && dd.getMonth() === month) {
          words += day.total
        }
      })

      months.push({ label, words })
    }
    return months
  }, [dayMap])

  const maxMonthWords = Math.max(...monthlyData.map((m) => m.words), 1)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', opacity: 0.4 }}>
        加载中…
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: "'Noto Sans SC', sans-serif",
      }}
    >
      {/* 顶栏 */}
      <div
        style={{
          height: 44,
          borderBottom: '1px solid var(--border)',
          background: 'var(--paper)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--text)',
            opacity: 0.5,
          }}
        >
          ← 书架
        </button>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>写作统计</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        {/* ── 汇总卡片 ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <StatCard label="总字数" value={stats.totalWords.toLocaleString()} unit="字" />
          <StatCard label="活跃天数" value={String(stats.activeDays)} unit="天" />
          <StatCard label="日均字数" value={String(stats.avgPerDay)} unit="字" />
          <StatCard label="最长连续" value={String(stats.maxStreak)} unit="天" />
        </div>

        {/* ── 日历热力图 ── */}
        <div
          style={{
            background: 'var(--paper)',
            borderRadius: 8,
            padding: '20px 24px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            marginBottom: 32,
            overflowX: 'auto',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 16px', color: 'var(--text)' }}>码字日历</h3>

          {/* 月份标签 */}
          <div style={{ display: 'flex', marginLeft: 28, marginBottom: 4 }}>
            {monthPositions.map((mp, i) => {
              const nextPos = monthPositions[i + 1]?.weekIdx ?? weeks.length
              const span = nextPos - mp.weekIdx
              return (
                <span
                  key={`${mp.month}-${mp.weekIdx}`}
                  style={{
                    width: span * 14,
                    fontSize: 10,
                    opacity: 0.4,
                    flexShrink: 0,
                  }}
                >
                  {MONTH_LABELS[mp.month]}
                </span>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 0 }}>
            {/* 星期标签 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4, width: 24 }}>
              {WEEKDAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  style={{
                    height: 12,
                    fontSize: 9,
                    opacity: 0.35,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: 4,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* 格子 */}
            <div style={{ display: 'flex', gap: 2 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {week.map(({ dateStr }) => {
                    const day = dayMap.get(dateStr)
                    const count = day?.total ?? 0
                    return (
                      <div
                        key={dateStr}
                        onClick={() => {
                          if (day) setSelectedDay(day)
                          else
                            setSelectedDay({
                              date: dateStr,
                              total: 0,
                              books: [],
                            })
                        }}
                        title={`${dateStr}: ${count} 字`}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          background: getHeatColor(count),
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                        }}
                        onMouseEnter={(e) => {
                          ;(e.target as HTMLElement).style.transform = 'scale(1.3)'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.target as HTMLElement).style.transform = 'scale(1)'
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 图例 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 10, opacity: 0.5 }}>
            <span>少</span>
            {[0, 100, 300, 700, 1500].map((v) => (
              <div
                key={v}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: getHeatColor(v),
                }}
              />
            ))}
            <span>多</span>
          </div>
        </div>

        {/* ── 选中日期详情 ── */}
        {selectedDay && (
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: 8,
              padding: '16px 24px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
              marginBottom: 32,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, margin: 0, color: 'var(--text)' }}>
                {selectedDay.date} · {selectedDay.total} 字
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: 0.4,
                  fontSize: 14,
                  color: 'var(--text)',
                }}
              >
                ✕
              </button>
            </div>
            {selectedDay.total === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.4 }}>这天没有写作记录</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedDay.books.map((b) => (
                  <div key={b.bookTitle} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text)' }}>{b.bookTitle}</span>
                    <span style={{ opacity: 0.5 }}>{b.words} 字</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 月度柱状图 ── */}
        <div
          style={{
            background: 'var(--paper)',
            borderRadius: 8,
            padding: '20px 24px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 16px', color: 'var(--text)' }}>月度统计</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {monthlyData.map((m) => {
              const height = m.words > 0 ? Math.max(4, (m.words / maxMonthWords) * 100) : 0
              return (
                <div
                  key={m.label}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {m.words > 0 && (
                    <span style={{ fontSize: 9, opacity: 0.4 }}>{(m.words / 1000).toFixed(1)}k</span>
                  )}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 40,
                      height,
                      background: '#239a3b',
                      borderRadius: '3px 3px 0 0',
                      opacity: m.words > 0 ? 0.7 : 0.15,
                      transition: 'height 0.3s',
                    }}
                  />
                  <span style={{ fontSize: 9, opacity: 0.35, whiteSpace: 'nowrap' }}>
                    {m.label.split('/')[1]}月
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div
      style={{
        background: 'var(--paper)',
        borderRadius: 8,
        padding: '16px 20px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{value}</span>
        <span style={{ fontSize: 12, opacity: 0.4 }}>{unit}</span>
      </div>
    </div>
  )
}
