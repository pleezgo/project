import { waterProgressColor } from '../utils/hydrationUtils'

/**
 * SVG-компонент склянки з водою пропорційно до % виконання цілі гідрації.
 * @param {object} props
 * @param {number} props.current Поточний обʼєм випитої води (мл).
 * @param {number} props.goal Денна ціль (мл).
 */
export default function HydrationBottle({ current, goal }) {
  const pct = Math.min(200, Math.round(current / (goal || 1) * 100))
  const fillColor = waterProgressColor(pct)

  const fillHeight = Math.min(100, pct)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
      <svg width="200" height="260" viewBox="0 0 200 260">
        <defs>
          <clipPath id="glassClip">
            <path d="
              M 35 30
              L 165 30
              L 150 235
              Q 148 245, 138 245
              L 62 245
              Q 52 245, 50 235
              Z
            " />
          </clipPath>
        </defs>

        {/* Контур склянки */}
        <path
          d="
            M 35 30
            L 165 30
            L 150 235
            Q 148 245, 138 245
            L 62 245
            Q 52 245, 50 235
            Z
          "
          fill="var(--bg-secondary)"
          stroke="var(--border)"
          strokeWidth="1.5"
        />

        {/* Заливка води */}
        <rect
          x="0"
          y={260 - (fillHeight / 100 * 215) - 15}
          width="200"
          height={(fillHeight / 100 * 215) + 15}
          fill={fillColor}
          opacity="0.85"
          clipPath="url(#glassClip)"
          style={{ transition: 'y 0.5s ease, height 0.5s ease, fill 0.3s ease' }}
        />
      </svg>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: fillColor }}>
          {current}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}> / {goal} мл</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {pct}% виконано
          {pct >= 150 && ' - забагато, знизь темп'}
          {pct >= 100 && pct < 150 && ' - ціль досягнута!'}
        </div>
      </div>
    </div>
  )
}