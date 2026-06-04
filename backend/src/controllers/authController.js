/**
 * Бізнес-логіка автентифікації користувача.
 *
 * Цей модуль відповідає за реєстрацію нового користувача
 * та вхід у систему через email і пароль.
 *
 * Під час реєстрації виконується перевірка обов’язкових полів,
 * унікальності email, хешування пароля та створення базового профілю.
 * Під час входу перевіряються облікові дані, а після успішної
 * автентифікації формується JWT-токен для подальшого доступу
 * до захищених маршрутів.
 */

const pool = require('../config/db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

/**
 * Реєструє нового користувача, створює базовий профіль і повертає JWT-токен.
 *
 * Перевіряє обов'язкові поля, унікальність email та мінімальну довжину пароля.
 * Після успішного створення користувача автоматично створює запис у таблиці
 * user_profiles і генерує токен автентифікації.
 * @param {object} req HTTP-запит з email, password і name у тілі запиту.
 * @param {object} res HTTP-відповідь з токеном і даними користувача.
 * @returns {Promise<void>}
 */
const register = async (req, res) => {
  const { email, password, name } = req.body

  if(!email || !password) {
    return res.status(400).json({ error: 'Email та пароль обовʼязкові' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль мінімум 6 символів' })
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email вже використовується' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, role',
      [email, hashedPassword, name || null]
    )

    const user = result.rows[0]

    await pool.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1)', [user.id]
    )

    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)', [user.id]
    )

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role},
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({token, user})
  } catch(err) {
    console.error(err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Автентифікує користувача за email і паролем та повертає JWT-токен.
 *
 * Перевіряє наявність обов'язкових полів, шукає користувача в базі даних,
 * порівнює хеш пароля, у разі успіху повертає токен і базову інформацію
 * про користувача.
 * @param {object} req HTTP-запит з email і password у тілі запиту.
 * @param {object} res HTTP-відповідь з токеном і даними користувача.
 * @returns {Promise<void>}
 */
const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email та пароль обовʼязкові' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )

    if (result.rows.length == 0) {
      return res.status(401).json({ error: 'Невірний email або пароль' })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password)

    if(!valid) {
      return res.status(401).json({ error: 'Невірний email або пароль' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role  },
      process.env.JWT_SECRET,
      {expiresIn: '7d'}
    )

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role  }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Змінює пароль поточного користувача.
 *
 * Перевіряє знання поточного пароля через bcrypt.compare,
 * валідує мінімальну довжину нового пароля та оновлює хеш у БД.
 * Функція доступна тільки автентифікованому користувачу
 * (захист через authMiddleware на рівні маршруту).
 * @param {object} req HTTP-запит з current_password і new_password у тілі запиту.
 * @param {object} res HTTP-відповідь з підтвердженням або повідомленням про помилку.
 * @returns {Promise<void>}
 */
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Поточний та новий пароль обовʼязкові' })
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Новий пароль має містити мінімум 6 символів' })
  }

  try {
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Користувача не знайдено' })
    }

    const valid = await bcrypt.compare(current_password, result.rows[0].password)
    if (!valid) {
      return res.status(401).json({ error: 'Невірний поточний пароль' })
    }

    const hashedNew = await bcrypt.hash(new_password, 10)
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNew, req.user.id]
    )

    res.json({ success: true })
  } catch (err) {
    console.error('Change password error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = { register, login, changePassword }