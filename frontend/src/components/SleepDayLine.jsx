/**
 * Візуалізація доби з відрізками сну.
 * Лінія йде від 18:00 поточної доби до 18:00 наступної (зміщена доба сну).
 * @param {object} props
 * @param {Array} props.logs Масив записів сну за добу
 * @param {string} props.date Дата у форматі YYYY-MM-DD (день пробудження)
 */
export default function SleepDayLine({ logs, date }) {
  // Лінія представляє "добу сну" - від 18:00 попередньої доби до 18:00 поточної
  // Це дозволяє показати нічний сон цілком, без обрізання на півночі
  const dateObj = new Date(date + 'T00:00:00')
  const lineStart = new Date(dateObj)
  lineStart.setDate(lineStart.getDate() - 1)
  lineStart.setHours(18, 0, 0, 0)
  const lineEnd = new Date(dateObj)
  lineEnd.setHours(18, 0, 0, 0)

  const lineDurationMs = lineEnd - lineStart // 24 години в мс

  // Конвертація часу в позицію на лінії (0-100%)
  const timeToPercent = (iso) => {
    const t = new Date(iso)
    const offset = t - lineStart
    return Math.max(0, Math.min(100, (offset / lineDurationMs) * 100))
  }

  // Години для шкали (кожні 3 год)
  const scaleHours = []
  for (let i = 0; i <= 24; i += 3) {
    const h = (18 + i) % 24
    scaleHours.push({
      label: String(h).padStart(2, '0'),
      pct: (i / 24) * 100,
    })
  }

  return (
    <div style={{ width: '100%', padding: '16px 0' }}>
      {/* Сама лінія з відрізками */}
      <div style={{
        position: 'relative',
        height: 32,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}>
        {logs.map(log => {
          const left = timeToPercent(log.sleep_start)
          const right = timeToPercent(log.sleep_end)
          const width = Math.max(0.5, right - left)
          return (
            <div
              key={log.id}
              title={`${log.sleep_type === 'night' ? 'Нічний' : 'Денний'}: ${Math.floor(log.duration_min / 60)}год ${log.duration_min % 60}хв`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${left}%`,
                width: `${width}%`,
                background: log.sleep_type === 'night' ? 'var(--accent)' : 'var(--purple)',
                opacity: 0.85,
              }}
            />
          )
        })}
      </div>

      {/* Шкала годин */}
      <div style={{ position: 'relative', height: 18, marginTop: 4 }}>
        {scaleHours.map((tick, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${tick.pct}%`,
              top: 0,
              transform: 'translateX(-50%)',
              fontSize: 10,
              color: 'var(--text-muted)',
            }}
          >
            {tick.label}
          </div>
        ))}
      </div>

      {/* Легенда */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)' }}></span>
          Нічний
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--purple)' }}></span>
          Денний
        </div>
      </div>
    </div>
  )
}