import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { sleepDayColor, formatDuration } from '../utils/sleepUtils'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
]

/**
 * Календар місяця з відображенням сну за днями.
 * Кожна клітинка кольорована за тривалістю нічного сну.
 * Клік на клітинку — перехід на цю дату.
 * @param {object} props
 * @param {string} props.currentDate Поточна вибрана дата (YYYY-MM-DD)
 * @param {function} props.onSelectDate Колбек при кліку на день
 */
export default function SleepCalendar({ currentDate, onSelectDate }) {
  // Місяць що показується (може відрізнятись від currentDate)
  const initial = new Date(currentDate + 'T00:00:00')
  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth()) // 0-11

  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  useEffect(() => {
    let cancelled = false
    api.getSleepCalendar(monthStr)
      .then(res => {
        if (!cancelled) {
          setDays(res.days || [])
          setLoading(false)
        }
      })
      .catch(err => console.error(err))
    return () => { cancelled = true }
  }, [monthStr])

  const goPrevMonth = () => {
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
  }

  const goNextMonth = () => {
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
  }

  // Будуємо сітку місяця
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  // День тижня першого числа (0=Нд → переводимо в 0=Пн)
  let firstWeekday = firstDay.getDay() - 1
  if (firstWeekday < 0) firstWeekday = 6

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Мапа даних по днях
  const dayMap = {}
  days.forEach(d => {
    const dateStr = typeof d.log_date === 'string'
      ? d.log_date.split('T')[0]
      : new Date(d.log_date).toISOString().split('T')[0]
    dayMap[dateStr] = d
  })

  // Будуємо клітинки (включаючи порожні на початку)
  const cells = []
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      day: d,
      dateStr,
      data: dayMap[dateStr],
      isToday: dateStr === todayStr,
      isSelected: dateStr === currentDate,
      isFuture: dateStr > todayStr,
    })
  }

  return (
    <div>
      {/* Шапка з навігацією */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={goPrevMonth} className="btn" style={{ padding: '4px 10px', fontSize: 12 }}>‹</button>
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          {MONTHS[month]} {year}
        </div>
        <button onClick={goNextMonth} className="btn" style={{ padding: '4px 10px', fontSize: 12 }}>›</button>
      </div>

      {/* Заголовки днів тижня */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {w}
          </div>
        ))}
      </div>

      {/* Клітинки днів */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} style={{ aspectRatio: '1', background: 'transparent' }} />
          }

          const nightMin = cell.data ? +cell.data.night_min || 0 : 0
          const napMin = cell.data ? +cell.data.nap_min || 0 : 0
          const bg = cell.isFuture
            ? 'var(--bg-secondary)'
            : sleepDayColor(nightMin)

          const totalHours = nightMin > 0 ? (nightMin / 60).toFixed(nightMin % 60 === 0 ? 0 : 1) : ''

          return (
            <div
              key={cell.dateStr}
              onClick={() => !cell.isFuture && onSelectDate(cell.dateStr)}
              title={cell.data
                ? `${cell.day}: нічний ${formatDuration(nightMin)}${napMin > 0 ? ', денний ' + formatDuration(napMin) : ''}`
                : `${cell.day}: немає запису`}
              style={{
                aspectRatio: '1',
                background: bg,
                opacity: cell.isFuture ? 0.4 : 1,
                cursor: cell.isFuture ? 'default' : 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: cell.isSelected ? '2px solid var(--text)' : cell.isToday ? '1px solid var(--text-muted)' : '1px solid var(--border-light)',
                fontSize: 11,
              }}
            >
              <div style={{ fontSize: 11, color: nightMin > 0 ? '#fff' : 'var(--text-muted)', fontWeight: cell.isToday ? 600 : 400 }}>
                {cell.day}
              </div>
              {totalHours && (
                <div style={{ fontSize: 10, color: '#fff', opacity: 0.9 }}>
                  {totalHours}г
                </div>
              )}
              {napMin > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--purple)',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {loading && (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8, textAlign: 'center' }}>
          Завантаження...
        </div>
      )}
    </div>
  )
}