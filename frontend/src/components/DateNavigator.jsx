import { today, addDays, displayDateShort } from '../utils/dateUtils'

/**
 *
 * @param root0
 * @param root0.date
 * @param root0.onChange
 */
export default function DateNavigator({ date, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
      <button
        onClick={() => onChange(addDays(date, -1))}
        style={{
          padding: '5px 12px', border: 'none',
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 16
        }}
      >‹</button>

      <span style={{ padding: '5px 14px', fontSize: 13 }}>
        {displayDateShort(date)}
      </span>

      <button
        onClick={() => onChange(addDays(date, 1))}
        disabled={date >= today()}
        style={{
          padding: '5px 12px', border: 'none',
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 16,
          opacity: date >= today() ? 0.3 : 1
        }}
      >›</button>
    </div>
  )
}