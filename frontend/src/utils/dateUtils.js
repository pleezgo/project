
/**
 * Повертає поточну дату у форматі YYYY-MM-DD.
 * @returns {string} Поточна дата для використання в API-запитах і стані компонента.
 */
export const today = () => new Date().toISOString().split('T')[0]

/**
 * Додає або віднімає задану кількість днів від дати у форматі YYYY-MM-DD.
 * @param {string} dateStr Базова дата у форматі YYYY-MM-DD.
 * @param {number} n Кількість днів для зміщення.
 * @returns {string} Нова дата у форматі YYYY-MM-DD.
 */
export const addDays = (dateStr, n) => {
  const parts = dateStr.split('-')
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2])
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Форматує дату для відображення в інтерфейсі українською мовою.
 * @param {string} dateStr Дата у форматі YYYY-MM-DD.
 * @returns {string} Локалізоване текстове представлення дати.
 */
export const displayDateLong = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

export const displayDateShort = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('uk-UA', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
