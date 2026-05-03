/**
 * Утиліти для дашборду-приладки.
 * Кожен модуль має детермінований набір порогів які перетворюють
 * значення дня у статус 'good' | 'mid' | 'bad' | 'none'.
 *
 * Статуси мапляться у CSS-кольори через statusColor().
 */

const STATUS_COLORS = {
  good: 'var(--green)',
  mid:  'var(--amber)',
  bad:  'var(--red)',
  none: 'var(--text-faint)',
}

const STATUS_LABELS = {
  good: 'добре',
  mid: 'середньо',
  bad: 'погано',
  none: 'без даних',
}

export const statusLabel = (status) => STATUS_LABELS[status] || STATUS_LABELS.none

/**
 * Колір CSS для статусу.
 * @param {'good'|'mid'|'bad'|'none'} status
 * @returns {string}
 */
export const statusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.none

/**
 * Числовий бал статусу — для пошуку найкращого/найгіршого дня.
 * good = 2, mid = 1, bad = 0, none = -1 (виключається з порівняння).
 */
const STATUS_SCORE = { good: 2, mid: 1, bad: 0, none: -1 }

/**
 * Оцінка дня по харчуванню.
 * Нормально = 90-110% від цілі. Жовто = 70-89% або 110-130%. Червоно = поза.
 * @param kcal
 * @param goal
 */
export const scoreFood = (kcal, goal) => {
  if (!kcal || kcal <= 0) return 'none'
  if (!goal || goal <= 0) return 'none'
  const p = (kcal / goal) * 100
  if (p >= 90 && p <= 110) return 'good'
  if (p >= 70 && p <= 130) return 'mid'
  return 'bad'
}

/**
 * Оцінка дня по фізичній активності (спалені калорії).
 * Зелено ≥100% від цілі, жовто 50-99%, червоно <50%.
 * @param burned
 * @param goal
 */
export const scoreActivity = (burned, goal) => {
  if (!burned || burned <= 0) return 'none'
  if (!goal || goal <= 0) return 'none'
  const p = (burned / goal) * 100
  if (p >= 100) return 'good'
  if (p >= 50) return 'mid'
  return 'bad'
}

/**
 * Оцінка дня по гідрації.
 * Зелено 90-150%, жовто 50-89% або 150-200%, червоно поза.
 * @param ml
 * @param goal
 */
export const scoreHydration = (ml, goal) => {
  if (!ml || ml <= 0) return 'none'
  if (!goal || goal <= 0) return 'none'
  const p = (ml / goal) * 100
  if (p >= 90 && p <= 150) return 'good'
  if (p >= 50 && p <= 200) return 'mid'
  return 'bad'
}

/**
 * Оцінка дня по сну.
 * Якщо є оцінка якості — пріоритет за нею (1-2 bad, 3 mid, 4-5 good).
 * Інакше — за тривалістю нічного сну (7-9 год = good, 5-7 або 9-11 = mid, поза = bad).
 * @param nightMin
 * @param qualityAvg
 */
export const scoreSleep = (nightMin, qualityAvg) => {
  if (qualityAvg !== null && qualityAvg !== undefined) {
    const q = Math.round(+qualityAvg)
    if (q >= 4) return 'good'
    if (q === 3) return 'mid'
    if (q >= 1) return 'bad'
  }
  if (!nightMin || nightMin <= 0) return 'none'
  if (nightMin >= 420 && nightMin <= 540) return 'good' // 7-9 год
  if (nightMin >= 300 && nightMin <= 660) return 'mid'  // 5-7 або 9-11
  return 'bad'
}

/**
 * Відсоток виконання для прогрес-кільця.
 * Повертає число 0-100, обрізане зверху.
 * @param value
 * @param goal
 */
export const percentOf = (value, goal) => {
  if (!value || !goal || goal <= 0) return 0
  return Math.min(100, Math.round((value / goal) * 100))
}

/**
 * Сумарний бал дня — сума балів усіх 4 модулів.
 * Дні без жодних даних повертають null (не учасник порівняння).
 * @param scores
 */
export const dayTotalScore = (scores) => {
  const values = [scores.food, scores.activity, scores.hydration, scores.sleep]
  const hasAnyData = values.some(s => s !== 'none')
  if (!hasAnyData) return null

  const RANK = { good: 2, mid: 1, bad: 0, none: 0 }
  return values.reduce((sum, s) => sum + RANK[s], 0)
}