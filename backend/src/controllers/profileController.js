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
const { checkRange } = require('../utils/validation')
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
      `SELECT up.*, u.email, u.name, u.role,
              COALESCE(us.preferences, '{}'::jsonb) AS preferences
       FROM user_profiles up
       JOIN users u ON u.id = up.user_id
       LEFT JOIN user_settings us ON us.user_id = up.user_id
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
  const { age, sex, weight, height, activity, goal, activity_goal, name } = req.body

  try {
    checkRange(age, 'Вік', 10, 120)
    checkRange(weight, 'Вага', 20, 300)
    checkRange(height, 'Зріст', 50, 250)
    checkRange(activity_goal, 'Ціль активності', 0, 5000)
    let bmr = null, tdee = null, calorie_goal = null
    if (weight && height && age && sex) {
      bmr = calcBMR(weight, height, age, sex)
      tdee = calcTDEE(bmr, activity)
      calorie_goal = calcCalorieGoal(tdee, goal)
    }

    await pool.query(
      `UPDATE user_profiles SET
        age = $1, sex = $2, weight = $3, height = $4,
        activity = $5, goal = $6, activity_goal = $7,
        bmr = $8, tdee = $9, calorie_goal = $10,
        updated_at = NOW()
      WHERE user_id = $11`,
      [age, sex, weight, height, activity, goal,
      activity_goal || null,
      bmr, tdee, calorie_goal, req.user.id]
    )

    if (name) {
      await pool.query(
        'UPDATE users SET name = $1 WHERE id = $2',
        [name, req.user.id]
      )
    }

    const result = await pool.query(
      `SELECT up.*, u.email, u.name, u.role,
              COALESCE(us.preferences, '{}'::jsonb) AS preferences
       FROM user_profiles up
       JOIN users u ON u.id = up.user_id
       LEFT JOIN user_settings us ON us.user_id = up.user_id
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
    if (err.message && err.message.match(/^(Вік|Вага|Зріст|Ціль)/)) {
      return res.status(400).json({ error: err.message })
    }
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Оновлює ціль гідрації користувача.
 * null — повернутись до автоматичного розрахунку.
 */
const updateWaterGoal = async (req, res) => {
  const { water_goal } = req.body

  // null або явно null — очищення до автоматичного
  if (water_goal === null) {
    try {
      await pool.query(
        `UPDATE user_profiles SET water_goal = NULL, updated_at = NOW() WHERE user_id = $1`,
        [req.user.id]
      )
      return res.json({ water_goal: null })
    } catch (err) {
      console.error('updateWaterGoal error:', err)
      return res.status(500).json({ error: 'Помилка сервера' })
    }
  }

  // Валідація числового значення
  const value = +water_goal
  if (!value || value <= 0) {
    return res.status(400).json({ error: 'Ціль має бути більше 0' })
  }
  if (value > 10000) {
    return res.status(400).json({ error: 'Максимум 10000 мл/день' })
  }

  try {
    await pool.query(
      `UPDATE user_profiles SET water_goal = $1, updated_at = NOW() WHERE user_id = $2`,
      [value, req.user.id]
    )
    res.json({ water_goal: value })
  } catch (err) {
    console.error('updateWaterGoal error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = {
  getProfile,
  updateProfile,
  calcBMR,
  calcTDEE,
  calcCalorieGoal,
  updateWaterGoal,
}