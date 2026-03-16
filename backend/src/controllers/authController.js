const pool = require('../config/db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

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
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name || null]
    )

    const user = result.rows[0]

    await pool.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1)', [user.id]
    )

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({token, user})
  } catch(err) {
    console.error(err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}


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
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      {expiresIn: '7d'}
    )

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = { register, login }