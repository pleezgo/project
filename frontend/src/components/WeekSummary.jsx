import { Apple, Dumbbell, Droplet, Moon } from 'lucide-react'
import { formatDuration } from '../utils/sleepUtils'
import { calcMacroGoals } from '../utils/nutritionUtils'
import { calcActivityGoal } from '../utils/activityUtils'
import { calcWaterGoal } from '../utils/hydrationUtils'
import {
  scoreFood, scoreActivity, scoreHydration, scoreSleep, statusColor, statusLabel,
} from '../utils/dashboardUtils'

/**
 *
 * @param root0
 * @param root0.data
 * @param root0.profile
 */
export default function WeekSummary({ data, profile }) {
  if (!data || !profile) return null

  const goals = calcMacroGoals(profile.calorie_goal)
  const activityGoal = profile.activity_goal || calcActivityGoal(profile.goal)
  const waterGoal = profile.water_goal || calcWaterGoal(profile.weight, profile.activity)
  
  const cells = [
    {
      Icon: Apple,
      label: 'калорії',
      value: data.avg_kcal,
      unit: 'ккал',
      status: scoreFood(data.avg_kcal, goals.kcal),
    },
    {
      Icon: Dumbbell,
      label: 'спалено',
      value: data.avg_kcal_burned,
      unit: 'ккал',
      status: scoreActivity(data.avg_kcal_burned, activityGoal),
    },
    {
      Icon: Droplet,
      label: 'вода',
      value: data.avg_water_ml,
      unit: 'мл',
      status: scoreHydration(data.avg_water_ml, waterGoal),
    },
    {
      Icon: Moon,
      label: 'сон',
      value: data.avg_sleep_min,
      unit: '',
      isSleep: true,
      status: scoreSleep(data.avg_sleep_min, null),
    },
  ]

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: 8,
      }}>
        Середнє за останні 7 днів
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}>
        {cells.map(c => {
          const color = statusColor(c.status)
          const valueText = c.isSleep
            ? (c.value > 0 ? formatDuration(c.value) : '—')
            : (c.value > 0 ? `${c.value}` : '—')
          return (
            <div key={c.label} style={{
              padding: '14px 16px',
              border: '1px solid var(--border-light)',
              borderLeft: `3px solid ${color}`,
              background: 'var(--bg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <c.Icon size={16} fill={c.status !== 'none' ? color : 'none'} style={{ color }} />
                <div style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                }}>
                  {c.label}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2 }}>
                {valueText}
                {c.unit && c.value > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4, fontWeight: 400 }}>
                    {c.unit}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color, marginTop: 4 }}>
                {statusLabel(c.status)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}