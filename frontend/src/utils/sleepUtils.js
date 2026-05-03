/**
 * Розраховує цільову тривалість сну на основі цілі користувача (хв/добу).
 */
export const calcSleepGoal = (goal) => {
  if (goal === 'gain') return 510
  return 480
}

/**
 * Форматує тривалість у хвилинах у вигляд "X год Y хв".
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} хв`
  if (m === 0) return `${h} год`
  return `${h} год ${m} хв`
}

/**
 * Форматує час у форматі HH:MM з ISO-рядка.
 */
export const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Повертає колір клітинки календаря.
 * Якщо є оцінка якості - колір береться з неї (пріоритет суб'єктивної оцінки).
 * Інакше - обчислюється за тривалістю нічного сну.
 */
export const sleepDayColor = (nightMin, qualityAvg) => {
  if (qualityAvg !== null && qualityAvg !== undefined) {
    const q = Math.round(+qualityAvg)
    if (q <= 2) return 'var(--red)'
    if (q === 3) return 'var(--amber)'
    return 'var(--green)' // 4-5
  }

  if (!nightMin || nightMin === 0) return 'var(--bg-secondary)'
  if (nightMin < 300) return 'var(--red)'
  if (nightMin < 420) return 'var(--amber)'
  if (nightMin <= 540) return 'var(--green)'
  if (nightMin <= 660) return 'var(--amber)'
  return 'var(--red)'
}

/**
 * Генерує список підказок на основі одного запису або тренду.
 * Повертає масив рядків.
 */
export const generateInsights = (logs) => {
  const insights = []
  if (!logs || logs.length === 0) return insights

  const nightLogs = logs.filter(l => l.sleep_type === 'night')

  // Підказки по останньому нічному запису
  if (nightLogs.length > 0) {
    const last = nightLogs[nightLogs.length - 1]
    const duration = +last.duration_min || 0
    const quality = +last.quality || 0
    const startHour = new Date(last.sleep_start).getHours()

    if (duration < 360) {
      insights.push('Менше 6 годин сну. Тривалий недосип впливає на здоров\'я та концентрацію.')
    } else if (duration > 600) {
      insights.push('Більше 10 годин сну. Можливо, потрібен відпочинок або перевірте якість сну.')
    }

    if (quality > 0 && quality <= 2) {
      insights.push('Низька оцінка сну. Спробуйте лягати раніше та уникати екранів за годину до сну.')
    }

    // Час засинання — якщо ліг після 1:00 ночі
    if (startHour >= 1 && startHour < 5) {
      insights.push('Пізнє засинання знижує якість сну та збиває циркадні ритми.')
    }
  }

  return insights
}

/**
 * Підпис до оцінки якості сну.
 */
export const qualityLabel = (q) => {
  if (!q) return ''
  const labels = ['', 'Дуже погано', 'Погано', 'Нормально', 'Добре', 'Чудово']
  return labels[q] || ''
}