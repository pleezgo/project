/**
 *
 * @param root0
 * @param root0.percent
 * @param root0.color
 * @param root0.thickness
 * @param root0.children
 */
export default function ProgressRing({ percent, color, thickness = 2.5, children }) {
  const clamped = Math.max(0, Math.min(100, percent || 0))
  // Працюємо в умовних одиницях viewBox 100×100, потім масштабуємо CSS
  const radius = (100 - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={thickness}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '60%',
        height: '60%',
        color,
      }}>
        {children}
      </div>
    </div>
  )
}