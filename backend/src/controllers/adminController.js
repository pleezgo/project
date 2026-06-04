/**
 * Бізнес-логіка адміністрування системи.
 *
 * Цей модуль містить контролери, доступні тільки користувачам
 * з роллю 'admin'. Захист на рівні маршрутів забезпечується
 * middleware requireAdmin, який перевіряє req.user.role.
 *
 * Реалізовано перегляд списку всіх користувачів системи,
 * видалення користувача та керування довідником фізичних вправ.
 */

const pool = require('../config/db')
const bcrypt = require('bcrypt')

/**
 * Повертає список усіх користувачів системи з підрахунком записів за кожним модулем.
 *
 * Для кожного користувача обчислюється кількість записів у таблицях
 * food_logs, activity_logs, hydration_logs, sleep_logs через окремі підзапити.
 * @param {object} req HTTP-запит.
 * @param {object} res HTTP-відповідь зі списком користувачів.
 * @returns {Promise<void>}
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.created_at,
              (SELECT COUNT(*) FROM food_logs WHERE user_id = u.id) AS food_count,
              (SELECT COUNT(*) FROM activity_logs WHERE user_id = u.id) AS activity_count,
              (SELECT COUNT(*) FROM hydration_logs WHERE user_id = u.id) AS hydration_count,
              (SELECT COUNT(*) FROM sleep_logs WHERE user_id = u.id) AS sleep_count
       FROM users u
       ORDER BY u.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Get all users error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Видаляє користувача за ідентифікатором.
 *
 * Каскадне видалення з пов'язаних таблиць (food_logs, activity_logs,
 * hydration_logs, sleep_logs, weight_logs, user_profiles, user_settings,
 * custom_foods) забезпечується обмеженням ON DELETE CASCADE на рівні схеми.
 * Адміністратор не може видалити сам себе.
 * @param {object} req HTTP-запит з параметром id у шляху.
 * @param {object} res HTTP-відповідь з підтвердженням.
 * @returns {Promise<void>}
 */
const deleteUser = async (req, res) => {
  const { id } = req.params

  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'Адміністратор не може видалити свій акаунт' })
  }

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Користувача не знайдено' })
    }
    res.json({ success: true })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Повертає повний список вправ із довідника exercises.
 *
 * Цей довідник доступний усім користувачам через GET /exercises (без auth),
 * але для адміністратора вона повертає повний список для перегляду
 * і керування.
 * @param {object} req HTTP-запит.
 * @param {object} res HTTP-відповідь зі списком вправ.
 * @returns {Promise<void>}
 */
const getAllExercises = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM exercises ORDER BY category, name'
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Get all exercises error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Додає нову вправу до довідника exercises.
 *
 * Перевіряє обов'язкові поля та валідність категорії.
 * Для категорій 'cardio_distance', 'cardio_time', 'isometric' приймається лише met_moderate.
 * Для категорій 'bodyweight_reps', 'weighted_reps' додатково приймається seconds_per_rep.
 * @param {object} req HTTP-запит з даними вправи.
 * @param {object} res HTTP-відповідь зі створеною вправою.
 * @returns {Promise<void>}
 */
const addExercise = async (req, res) => {
  const {
    name, category, met_low, met_moderate, met_high,
    supports_distance, supports_duration, supports_sets_reps, supports_weight,
    seconds_per_rep,
  } = req.body

  if (!name || !category || !met_moderate) {
    return res.status(400).json({ error: 'Назва, категорія та met_moderate обовʼязкові' })
  }

  const allowedCategories = ['cardio_distance', 'cardio_time', 'isometric', 'bodyweight_reps', 'weighted_reps']
  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ error: 'Невідома категорія вправи' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO exercises
        (name, category, met_low, met_moderate, met_high,
         supports_distance, supports_duration, supports_sets_reps, supports_weight,
         seconds_per_rep)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [
        name, category,
        met_low || null, met_moderate, met_high || null,
        !!supports_distance, !!supports_duration,
        !!supports_sets_reps, !!supports_weight,
        seconds_per_rep || null,
      ]
    )
    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Вправа з такою назвою вже існує' })
    }
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Add exercise error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Видаляє вправу з довідника за ідентифікатором.
 *
 * Перевірка пов'язаних записів activity_logs виконується завдяки
 * обмеженню ON DELETE RESTRICT (або SET NULL), щоб не порушити
 * цілісність історії тренувань.
 * @param {object} req HTTP-запит з параметром id у шляху.
 * @param {object} res HTTP-відповідь з підтвердженням.
 * @returns {Promise<void>}
 */
const deleteExercise = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      'DELETE FROM exercises WHERE id = $1 RETURNING id',
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Вправу не знайдено' })
    }
    res.json({ success: true })
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'Неможливо видалити вправу — вона використовується в записах активності',
      })
    }
    console.error('Delete exercise error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Скидає пароль користувача, генеруючи новий випадковий пароль.
 *
 * Генерує тимчасовий пароль довжиною 8 символів з латинських літер
 * і цифр, хешує його через bcrypt та оновлює запис у таблиці users.
 * Тимчасовий пароль повертається в чистому вигляді в одноразовій
 * відповіді — адміністратор має передати його користувачу через
 * безпечний канал. Сам користувач рекомендується змінити пароль
 * на власний при наступному вході.
 * @param {object} req HTTP-запит з параметром id у шляху.
 * @param {object} res HTTP-відповідь з новим тимчасовим паролем.
 * @returns {Promise<void>}
 */
const resetUserPassword = async (req, res) => {
  const { id } = req.params

  // Генерація випадкового пароля з 8 символів (a-z, A-Z, 0-9)
  const charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let newPassword = ''
  for (let i = 0; i < 8; i++) {
    newPassword += charset[Math.floor(Math.random() * charset.length)]
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10)
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, email',
      [hashed, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Користувача не знайдено' })
    }
    res.json({
      email: result.rows[0].email,
      new_password: newPassword,
    })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = {
  getAllUsers,
  deleteUser,
  resetUserPassword,
  getAllExercises,
  addExercise,
  deleteExercise,
}