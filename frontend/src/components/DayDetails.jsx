import { Apple, Dumbbell, Droplet, Moon } from 'lucide-react'
import { calcMacroGoals, pct } from '../utils/nutritionUtils'
import { calcActivityGoal } from '../utils/activityUtils'
import { calcWaterGoal } from '../utils/hydrationUtils'
import { formatDuration, qualityLabel } from '../utils/sleepUtils'
import { displayDateLong } from '../utils/dateUtils'
import {
  scoreFood, scoreActivity, scoreHydration, scoreSleep, statusColor, statusLabel,
} from '../utils/dashboardUtils'

/**
 *
 * @param root0
 * @param root0.date
 * @param root0.data
 */
export default function DayDetails({ date, data }) {
  if (!data) return null

  const { profile, food, activity, hydration, sleep } = data
  const goals = calcMacroGoals(profile?.calorie_goal)
  const activityGoal = profile?.activity_goal || calcActivityGoal(profile?.goal)
  const waterGoal = profile?.water_goal || calcWaterGoal(profile?.weight, profile?.activity)

  const kcal = Math.round(+food?.kcal || 0)
  const protein = Math.round(+food?.protein || 0)
  const fat = Math.round(+food?.fat || 0)
  const carbs = Math.round(+food?.carbs || 0)
  const burned = Math.round(+activity?.kcal_burned || 0)
  const waterMl = +hydration?.total_ml || 0
  const nightMin = +sleep?.night_min || 0
  const napMin = +sleep?.nap_min || 0
  const qualityAvg = sleep?.night_quality_avg

  const blocks = [
    {
      title: 'Харчування',
      Icon: Apple,
      status: scoreFood(kcal, goals.kcal),
      headline: { value: `${kcal}`, unit: `/ ${goals.kcal} ккал` },
      rows: [
        ['Білки', `${protein} / ${goals.protein} г`],
        ['Жири', `${fat} / ${goals.fat} г`],
        ['Вуглеводи', `${carbs} / ${goals.carbs} г`],
      ],
    },
    {
      title: 'Активність',
      Icon: Dumbbell,
      status: scoreActivity(burned, activityGoal),
      headline: { value: `${burned}`, unit: `/ ${activityGoal} ккал` },
      rows: [
        ['Вправ', `${activity?.count || 0}`],
        ['Тривалість', formatDuration(+activity?.duration_min || 0)],
      ],
    },
    {
      title: 'Гідрація',
      Icon: Droplet,
      status: scoreHydration(waterMl, waterGoal),
      headline: { value: `${waterMl}`, unit: `/ ${waterGoal} мл` },
      rows: [
        ['Виконано', `${pct(waterMl, waterGoal)}%`],
        ['Записів', `${hydration?.count || 0}`],
      ],
    },
    {
      title: 'Сон',
      Icon: Moon,
      status: scoreSleep(nightMin, qualityAvg),
      headline: { value: nightMin > 0 ? formatDuration(nightMin) : '—', unit: '' },
      rows: [
        ['Денний', napMin > 0 ? formatDuration(napMin) : '—'],
        ['Якість', qualityAvg ? `${qualityLabel(Math.round(+qualityAvg))} (${Math.round(+qualityAvg)}/5)` : '—'],
      ],
    },
  ]

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{
        fontSize: 16,
        fontWeight: 500,
        color: 'var(--text)',
        marginBottom: 2,
      }}>
        {displayDateLong(date)}
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 14,
      }}>
        Деталі дня
      </div>

      {blocks.map(block => {
        const color = statusColor(block.status)
        return (
          <div key={block.title} style={{
            marginBottom: 12,
            paddingLeft: 10,
            borderLeft: `3px solid ${color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <block.Icon size={16} style={{ color }} fill={block.status !== 'none' ? color : 'none'} fillOpacity={0.2} />
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                flex: 1,
              }}>
                {block.title}
              </div>
              <div style={{
                fontSize: 10,
                color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {statusLabel(block.status)}
              </div>
            </div>

            <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2, marginBottom: 4 }}>
              {block.headline.value}
              {block.headline.unit && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4, fontWeight: 400 }}>
                  {block.headline.unit}
                </span>
              )}
            </div>

            {block.rows.map(([label, val]) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                padding: '2px 0',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{val}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}