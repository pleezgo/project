/**
 * Бізнес-логіка профілю користувача і розрахунку добових норм.
 *
 * Цей модуль відповідає за отримання та оновлення профілю користувача,
 * а також за обчислення похідних показників:
 * - BMR (базовий рівень метаболізму),
 * - TDEE (загальні добові енерговитрати),
 * - calorie_goal (добова калорійна ціль).
 *
 * Логіка розрахунків залежить від персональних даних користувача
 * (вік, стать, вага, зріст), рівня активності та обраної цілі
 * (схуднення, підтримка ваги або набір маси).
 */

const pool = require('../config/db')

/**
 * Обчислює базовий рівень метаболізму (BMR) за вагою, зростом, віком і статтю.
 *
 * Використовує формулу Mifflin–St Jeor для приблизного розрахунку
 * кількості калорій, необхідних організму в стані спокою.
 * @param {number} weight Вага користувача в кілограмах.
 * @param {number} height Зріст користувача в сантиметрах.
 * @param {number} age Вік користувача в роках.
 * @param {string} sex Стать користувача ('female' або інше значення для чоловічої формули).
 * @returns {number} Округлене значення BMR.
 */
const calcBMR = (weight, height, age, sex) => {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === 'female' ? base - 161 : base + 5)
}

/**
 * Коефіцієнти фізичної активності для розрахунку добових енерговитрат.
 *
 * Використовуються під час обчислення TDEE на основі рівня активності користувача.
 */
const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

/**
 * Обчислює загальні добові енерговитрати (TDEE) на основі BMR
 * і рівня фізичної активності.
 *
 * Якщо рівень активності не знайдено, використовується коефіцієнт light.
 * @param {number} bmr Базовий рівень метаболізму.
 * @param {string} activity Рівень фізичної активності користувача.
 * @returns {number} Округлене значення TDEE.
 */
const calcTDEE = (bmr, activity) => {
  return Math.round(bmr * (activityFactors[activity] || 1.375))
}

/**
 * Визначає добову калорійну ціль користувача залежно від мети.
 *
 * Для схуднення зменшує TDEE на 500 ккал, для набору маси
 * збільшує на 300 ккал, для підтримки ваги залишає без змін.
 * @param {number} tdee Загальні добові енерговитрати.
 * @param {string} goal Ціль користувача: lose, gain або maintain.
 * @returns {number} Добова калорійна ціль.
 */
const calcCalorieGoal = (tdee, goal) => {
  if(goal == 'lose') return tdee - 500
  if(goal == 'gain') return tdee + 300
  return tdee
}

/**
 * Повертає профіль поточного авторизованого користувача разом з email і name.
 *
 * Отримує дані з таблиці user_profiles та пов'язаного запису users
 * за ідентифікатором користувача з req.user.id.
 * @param {object} req HTTP-запит з даними авторизованого користувача.
 * @param {object} res HTTP-відповідь з даними профілю або повідомленням про помилку.
 * @returns {Promise<void>}
 */
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT up.*, u.email, u.name
       FROM user_profiles up
       JOIN users u ON u.id = up.user_id
       WHERE up.user_id = $1`,
      [req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error:'Профіль не знайдено'})
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({error: 'Помилка сервера'})
  }
}

/**
 * Оновлює профіль поточного авторизованого користувача та перераховує
 * похідні показники харчування і активності.
 *
 * Якщо передані weight, height, age і sex, функція обчислює BMR, TDEE
 * та добову калорійну ціль. Також за потреби оновлює ім'я користувача
 * в таблиці users і повертає актуальний стан профілю.
 * @param {object} req HTTP-запит з новими даними профілю в тілі запиту.
 * @param {object} res HTTP-відповідь з оновленими даними профілю або повідомленням про помилку.
 * @returns {Promise<void>}
 */  
const updateProfile = async (req, res) => {
  const { age, sex, weight, height, activity, goal, water_goal, name } = req.body

  try {
    let bmr = null, tdee = null, calorie_goal = null
    if (weight && height && age && sex) {
      bmr = calcBMR(weight, height, age, sex)
      tdee = calcTDEE(bmr, activity)
      calorie_goal = calcCalorieGoal(tdee, goal)
    }

    await pool.query(
      `UPDATE user_profiles SET
        age = $1, sex = $2, weight = $3, height = $4,
        activity = $5, goal = $6, water_goal = $7,
        bmr = $8, tdee = $9, calorie_goal = $10,
        updated_at = NOW()
       WHERE user_id = $11`,
      [age, sex, weight, height, activity, goal,
       water_goal || 2000, bmr, tdee, calorie_goal, req.user.id]
    )

    if (name) {
      await pool.query(
        'UPDATE users SET name = $1 WHERE id = $2',
        [name, req.user.id]
      )
    }

    const result = await pool.query(
      `SELECT up.*, u.email, u.name
       FROM user_profiles up
       JOIN users u ON u.id = up.user_id
       WHERE up.user_id = $1`,
      [req.user.id]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = { getProfile, updateProfile }