const pool = require('../config/db')

/**
 * Повертає всі записи гідрації за вказану дату і загальну суму.
 */
const getHydration = async (req, res) => {
  const { date } = req.params

  try {
    const result = await pool.query(
      `SELECT id, amount_ml, drink_type, logged_at
       FROM hydration_logs
       WHERE user_id = $1 AND log_date = $2
       ORDER BY logged_at ASC`,
      [req.user.id, date]
    )

    const total_ml = result.rows.reduce((sum, r) => sum + (+r.amount_ml || 0), 0)

    res.json({
      logs: result.rows,
      total_ml,
      count: result.rows.length,
    })
  } catch (err) {
    console.error('getHydration error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Додає новий запис гідрації.
 */
const addHydration = async (req, res) => {
  const { log_date, amount_ml, drink_type } = req.body

  const amount = +amount_ml
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Кількість має бути більше 0' })
  }
  if (amount > 5000) {
    return res.status(400).json({ error: 'Максимум 5000 мл за раз' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO hydration_logs (user_id, log_date, amount_ml, drink_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        req.user.id,
        log_date || new Date().toISOString().split('T')[0],
        amount,
        drink_type || 'water',
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('addHydration error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Видаляє запис гідрації (лише власні записи користувача).
 */
const deleteHydration = async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      `DELETE FROM hydration_logs
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Запис не знайдено' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('deleteHydration error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = { getHydration, addHydration, deleteHydration }