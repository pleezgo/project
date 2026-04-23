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
const { calcBMR, calcTDEE, calcCalorieGoal } = require('../utils/calculations')
const pool = require('../config/db')


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
  const { age, sex, weight, height, activity, goal, water_goal, activity_goal, name } = req.body

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
        activity = $5, goal = $6, water_goal = $7, activity_goal = $8,
        bmr = $9, tdee = $10, calorie_goal = $11,
        updated_at = NOW()
      WHERE user_id = $12`,
      [age, sex, weight, height, activity, goal,
      water_goal || 2000, activity_goal || null,
      bmr, tdee, calorie_goal, req.user.id]
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
    
    if (weight) {
      await pool.query(
        `INSERT INTO weight_logs (user_id, log_date, weight)
        VALUES ($1, CURRENT_DATE, $2)
        ON CONFLICT (user_id, log_date) DO UPDATE SET weight = $2`,
        [req.user.id, weight]
      )
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = {
  getProfile,
  updateProfile,
  calcBMR,
  calcTDEE,
  calcCalorieGoal,
}