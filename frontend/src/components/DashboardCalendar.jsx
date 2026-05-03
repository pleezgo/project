import { useState, useEffect } from 'react'
import { Apple, Dumbbell, Droplet, Moon } from 'lucide-react'
import { api } from '../api/api'
import {
  scoreFood, scoreActivity, scoreHydration, scoreSleep,
  statusColor, percentOf, dayTotalScore,
} from '../utils/dashboardUtils'
import { calcActivityGoal } from '../utils/activityUtils'
import { calcWaterGoal } from '../utils/hydrationUtils'
import ProgressRing from './ProgressRing'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
]

/**
 *
 * @param root0
 * @param root0.profile
 * @param root0.currentDate
 * @param root0.onSelectDate
 */
export default function DashboardCalendar({ profile, currentDate, onSelectDate }) {
  const initial = new Date(currentDate + 'T00:00:00')
  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth())
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  const loadMonth = async (m) => {
    setLoading(true)
    try {
      const res = await api.getDashboardMonth(m)
      setDays(res.days || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMonth(monthStr) }, [monthStr])

  const goPrevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11) }
    else setMonth(month - 1)
  }

  const today = new Date()
  const isAtCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  const goNextMonth = () => {
    if (isAtCurrentMonth) return
    if (month === 11) { setYear(year + 1); setMonth(0) }
    else setMonth(month + 1)
  }

  const calorieGoal = profile?.calorie_goal || 2000
  const activityGoal = profile?.activity_goal || calcActivityGoal(profile?.goal)
  const waterGoal = profile?.water_goal || calcWaterGoal(profile?.weight, profile?.activity)
  const sleepGoal = 480

  // Оцінюємо кожен день
  const dayMap = {}
  days.forEach(d => {
    const scores = {
      food: scoreFood(+d.kcal, calorieGoal),
      activity: scoreActivity(+d.kcal_burned, activityGoal),
      hydration: scoreHydration(+d.water_ml, waterGoal),
      sleep: scoreSleep(+d.night_min, d.quality_avg),
    }
    const dataModulesCount = Object.values(scores).filter(s => s !== 'none').length
    dayMap[d.log_date] = {
      ...d,
      scores,
      total: dayTotalScore(scores),
      dataModulesCount,
    }
  })

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  let firstWeekday = firstDay.getDay() - 1
  if (firstWeekday < 0) firstWeekday = 6

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
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
    <div className="card" style={{ marginBottom: 0 }}>
      {/* Шапка: стрілки зліва, місяць по центру */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 12,
      }}>
        <button onClick={goPrevMonth} className="btn" style={{ padding: '4px 10px', fontSize: 12 }}>‹</button>
        <div style={{ fontSize: 14, fontWeight: 500, minWidth: 140, textAlign: 'center' }}>
          {MONTHS[month]} {year}
        </div>
        <button
          onClick={goNextMonth}
          className="btn"
          disabled={isAtCurrentMonth}
          style={{ padding: '4px 10px', fontSize: 12, opacity: isAtCurrentMonth ? 0.4 : 1 }}
        >›</button>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />
          return (
            <DayCell
              key={cell.dateStr}
              cell={cell}
              calorieGoal={calorieGoal}
              activityGoal={activityGoal}
              waterGoal={waterGoal}
              sleepGoal={sleepGoal}
              onClick={() => !cell.isFuture && onSelectDate(cell.dateStr)}
            />
          )
        })}
      </div>

      {loading && (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8, textAlign: 'center' }}>
          Завантаження...
        </div>
      )}

      {/* Легенда */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Apple size={12} /> <Dumbbell size={12} /> <Droplet size={12} /> <Moon size={12} />
          <span style={{ marginLeft: 2 }}>харчування / активність / вода / сон</span>
        </div>
      </div>
    </div>
  )
}

/**
 *
 * @param root0
 * @param root0.cell
 * @param root0.calorieGoal
 * @param root0.activityGoal
 * @param root0.waterGoal
 * @param root0.sleepGoal
 * @param root0.onClick
 */
function DayCell({ cell, calorieGoal, activityGoal, waterGoal, sleepGoal, onClick }) {
  const data = cell.data
  const scores = data?.scores || { food: 'none', activity: 'none', hydration: 'none', sleep: 'none' }

  // Усереднений тон фону клітинки
  const STATUS_RANK = { good: 2, mid: 1, bad: 0, none: 0 }
  const allScores = Object.values(scores)
  const hasAnyData = allScores.some(s => s !== 'none')
  let avgStatus = 'none'
  if (hasAnyData) {
    const avg = allScores.reduce((s, v) => s + STATUS_RANK[v], 0) / allScores.length
    if (avg >= 1.5) avgStatus = 'good'
    else if (avg >= 0.7) avgStatus = 'mid'
    else avgStatus = 'bad'
  }

  const STATUS_BG_TINT = {
    good: 'rgba(29, 158, 117, 0.08)',
    mid: 'rgba(186, 117, 23, 0.08)',
    bad: 'rgba(226, 75, 74, 0.08)',
    none: 'var(--bg)',
  }

  const rings = [
    { Icon: Apple,   percent: data ? percentOf(+data.kcal, calorieGoal) : 0,         status: scores.food },
    { Icon: Dumbbell,   percent: data ? percentOf(+data.kcal_burned, activityGoal) : 0, status: scores.activity },
    { Icon: Droplet, percent: data ? percentOf(+data.water_ml, waterGoal) : 0,       status: scores.hydration },
    { Icon: Moon,    percent: data ? percentOf(+data.night_min, sleepGoal) : 0,      status: scores.sleep },
  ]

  // Стилі клітинки
  let bg = STATUS_BG_TINT[avgStatus]
  let border = '1px solid var(--border-light)'
  let dayColor = 'var(--text-secondary)'

  if (cell.isSelected) {
    border = '2px solid var(--text)'
  } else if (cell.isToday) {
    border = '2px solid var(--accent)'
  }

  return (
    <div
      onClick={onClick}
      title={data
        ? `${cell.day}: к ${Math.round(+data.kcal)}, акт ${Math.round(+data.kcal_burned)}, в ${data.water_ml}мл, сон ${Math.round(+data.night_min/60*10)/10}г`
        : `${cell.day}: немає запису`}
      style={{
        aspectRatio: '1',
        background: bg,
        opacity: cell.isFuture ? 0.4 : 1,
        cursor: cell.isFuture ? 'default' : 'pointer',
        border,
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 90,
        position: 'relative',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{
        fontSize: 13,
        color: dayColor,
        fontWeight: cell.isToday || cell.isSelected ? 600 : 500,
        marginBottom: 4,
      }}>
        {cell.day}
      </div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 2,
        placeItems: 'center',
      }}>
        {rings.map((r, idx) => {
          const color = statusColor(r.status)
          return (
            <div key={idx} style={{ width: '100%', height: '100%', maxWidth: 48, maxHeight: 48, padding: 2 }}>
              <ProgressRing percent={r.percent} color={color} thickness={5}>
                <r.Icon
                  size="80%"
                  style={{
                    width: '100%',
                    height: '100%',
                    color,
                  }}
                  fill={r.status !== 'none' ? color : 'none'}
                  fillOpacity={cell.isSelected ? 0.5 : 0.3}
                />
              </ProgressRing>
            </div>
          )
        })}
      </div>
    </div>
  )
}