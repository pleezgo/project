const pool = require('../config/db')

const MAX_CUSTOM_AMOUNTS = 4
const DEFAULT_AMOUNTS = [100, 200, 250, 500]

/**
 * Оновлює кастомні швидкі кнопки для додавання води.
 * Очікує body { water_quick_amounts: number[] }.
 */
const updateWaterQuickAmounts = async (req, res) => {
  const { water_quick_amounts } = req.body

  if (!Array.isArray(water_quick_amounts)) {
    return res.status(400).json({ error: 'water_quick_amounts має бути масивом' })
  }
  if (water_quick_amounts.length > MAX_CUSTOM_AMOUNTS) {
    return res.status(400).json({ error: `Максимум ${MAX_CUSTOM_AMOUNTS} власних кнопок` })
  }

  // Кожне значення — ціле число 1..5000
  for (const v of water_quick_amounts) {
    if (!Number.isInteger(v) || v <= 0 || v > 5000) {
      return res.status(400).json({ error: 'Кожне значення має бути цілим числом 1..5000' })
    }
  }

  // Без дублікатів і без перетину з дефолтними
  const unique = new Set(water_quick_amounts)
  if (unique.size !== water_quick_amounts.length) {
    return res.status(400).json({ error: 'Значення мають бути унікальні' })
  }
  if (water_quick_amounts.some(v => DEFAULT_AMOUNTS.includes(v))) {
    return res.status(400).json({ error: 'Це значення вже є серед стандартних кнопок' })
  }

  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, preferences)
       VALUES ($1, jsonb_build_object('water_quick_amounts', $2::jsonb))
       ON CONFLICT (user_id) DO UPDATE
         SET preferences = jsonb_set(user_settings.preferences, '{water_quick_amounts}', $2::jsonb),
             updated_at = NOW()`,
      [req.user.id, JSON.stringify(water_quick_amounts)]
    )
    res.json({ water_quick_amounts })
  } catch (err) {
    console.error('updateWaterQuickAmounts error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = { updateWaterQuickAmounts }