/**
 * Визначає тип сну (нічний/денний) автоматично за тривалістю та часом засинання.
 * Денним вважається короткий сон (< 4 год) що почався вдень (06:00-18:00).
 * @param {Date} startDate Час засинання
 * @param {number} durationMin Тривалість у хвилинах
 * @returns {'night' | 'nap'}
 */
const detectSleepType = (startDate, durationMin) => {
  const startHour = startDate.getHours()
  const isShort = durationMin < 240 // менше 4 год
  const isDayTime = startHour >= 6 && startHour < 18

  return (isShort && isDayTime) ? 'nap' : 'night'
}

/**
 * Розраховує дату до якої прив'язується запис сну.
 * За правилом — це дата пробудження (бо людина прокинулась цього дня).
 * @param {Date} endDate Час пробудження
 * @returns {string} Дата у форматі YYYY-MM-DD
 */
const calcLogDate = (endDate) => {
  const year = endDate.getFullYear()
  const month = String(endDate.getMonth() + 1).padStart(2, '0')
  const day = String(endDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Розраховує цільову тривалість сну на основі цілі користувача.
 * Базується на рекомендаціях ВООЗ і National Sleep Foundation.
 * Для набору маси — більше для відновлення м'язів.
 */
const calcSleepGoal = (goal) => {
  if (goal === 'gain') return 510 // 8.5 год
  return 480 // 8 год
}

module.exports = { detectSleepType, calcLogDate, calcSleepGoal }