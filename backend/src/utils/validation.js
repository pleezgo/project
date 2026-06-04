/**
 * Утиліти валідації числових діапазонів для контролерів API.
 *
 * Кидають Error з повідомленням, яке потім обробляє контролер
 * і повертає клієнту як 400.
 */

/**
 * Перевіряє, що значення є кінцевим числом у заданому діапазоні.
 * Якщо значення дорівнює undefined, null або '', перевірка пропускається
 * (для опціональних полів).
 * @param {*} value Значення, що перевіряється.
 * @param {string} field Назва поля для повідомлення про помилку.
 * @param {number} min Мінімально допустиме значення.
 * @param {number} max Максимально допустиме значення.
 * @returns {void}
 */
const checkRange = (value, field, min, max) => {
  if (value === undefined || value === null || value === '') return
  const num = Number(value)
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new Error(`${field} має бути від ${min} до ${max}`)
  }
}

/**
 * Те саме, що checkRange, але поле обов'язкове та не може бути порожнім.
 * @param {*} value Значення, що перевіряється.
 * @param {string} field Назва поля для повідомлення про помилку.
 * @param {number} min Мінімально допустиме значення.
 * @param {number} max Максимально допустиме значення.
 * @returns {void}
 */
const checkRangeRequired = (value, field, min, max) => {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${field} є обовʼязковим полем`)
  }
  const num = Number(value)
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new Error(`${field} має бути від ${min} до ${max}`)
  }
}

module.exports = { checkRange, checkRangeRequired }