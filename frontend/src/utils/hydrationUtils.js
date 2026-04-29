/**
 * Розраховує рекомендовану ціль води (мл/день) на основі ваги і активності.
 * Формула: базова = вага * 30 + додаткова залежно від активності.
 * Результат округлюється до 50 мл для "красивих" чисел.
 */
export const calcWaterGoal = (weight, activity) => {
  if (!weight) return 2000

  const base = weight * 30

  const activityBonus = {
    sedentary: 0,
    light: 200,
    moderate: 400,
    active: 600,
    very_active: 800,
  }

  const total = base + (activityBonus[activity] || 0)
  return Math.round(total / 50) * 50
}

/**
 * Повертає CSS-колір для прогресу гідрації залежно від відсотка виконання.
 * 0-99%    — акцентний (основний)
 * 100-150% — зелений (ціль досягнута)
 * >150%    — жовтий (попередження)
 */
export const waterProgressColor = (pct) => {
  if (pct >= 150) return 'var(--amber)'
  if (pct >= 100) return 'var(--green)'
  return 'var(--accent)'
}

/**
 * Форматує час логування у короткий вигляд (HH:MM).
 */
export const formatLogTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}